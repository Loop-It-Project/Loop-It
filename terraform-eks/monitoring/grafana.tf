# terraform-eks/monitoring-grafana.tf
# Grafana Dashboard Component

# ============================================================================
# GRAFANA DATASOURCES
# ============================================================================

resource "kubernetes_config_map" "grafana_datasources" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "grafana-datasources"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app = "grafana"
    }
  }

  data = {
    "datasources.yaml" = <<-EOT
      apiVersion: 1
      datasources:
        - name: Prometheus
          type: prometheus
          access: proxy
          url: http://prometheus.monitoring.svc.cluster.local:9090
          isDefault: true
          editable: true
          jsonData:
            httpMethod: POST
            prometheusType: Prometheus
            prometheusVersion: 2.47.0
            
        - name: Loki
          type: loki
          access: proxy
          url: http://loki.monitoring.svc.cluster.local:3100
          editable: true
          jsonData:
            maxLines: 1000
    EOT
  }
}

# ============================================================================
# GRAFANA STORAGE
# ============================================================================

resource "kubernetes_persistent_volume_claim" "grafana_pvc" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "grafana-pvc"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app = "grafana"
    }
  }
  
  spec {
    access_modes       = ["ReadWriteOnce"]
    storage_class_name = "gp3"
    resources {
      requests = {
        storage = var.grafana_storage_size
      }
    }
  }
  
  wait_until_bound = false
}

# ============================================================================
# GRAFANA DEPLOYMENT
# ============================================================================

resource "kubernetes_deployment" "grafana" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "grafana"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app = "grafana"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "grafana"
      }
    }

    template {
      metadata {
        labels = {
          app = "grafana"
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "3000"
        }
      }

      spec {
        container {
          name  = "grafana"
          image = "grafana/grafana:10.2.0"
          
          port {
            container_port = 3000
            name          = "http"
          }
          
          env {
            name = "GF_SECURITY_ADMIN_USER"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.monitoring_secrets[0].metadata[0].name
                key  = "grafana-admin-user"
              }
            }
          }
          
          env {
            name = "GF_SECURITY_ADMIN_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.monitoring_secrets[0].metadata[0].name
                key  = "grafana-admin-password"
              }
            }
          }
          
          env {
            name  = "GF_SERVER_DOMAIN"
            value = var.monitoring_domain
          }
          
          env {
            name  = "GF_SERVER_ROOT_URL"
            value = "http://${var.monitoring_domain}/"
          }
          
          env {
            name  = "GF_USERS_ALLOW_SIGN_UP"
            value = "false"
          }
          
          env {
            name  = "GF_PATHS_PROVISIONING"
            value = "/etc/grafana/provisioning"
          }
          
          env {
            name  = "GF_INSTALL_PLUGINS"
            value = "grafana-clock-panel"
          }
          
          volume_mount {
            name       = "grafana-storage"
            mount_path = "/var/lib/grafana"
          }
          
          volume_mount {
            name       = "grafana-datasources"
            mount_path = "/etc/grafana/provisioning/datasources"
          }
          
          resources {
            requests = {
              memory = var.grafana_memory_request
              cpu    = var.grafana_cpu_request
            }
            limits = {
              memory = var.grafana_memory_limit
              cpu    = var.grafana_cpu_limit
            }
          }
          
          liveness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 30
            period_seconds        = 30
          }
          
          readiness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
          
          security_context {
            run_as_non_root             = true
            run_as_user                 = 472
            allow_privilege_escalation  = false
            capabilities {
              drop = ["ALL"]
            }
          }
        }
        
        volume {
          name = "grafana-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.grafana_pvc[0].metadata[0].name
          }
        }
        
        volume {
          name = "grafana-datasources"
          config_map {
            name = kubernetes_config_map.grafana_datasources[0].metadata[0].name
          }
        }
        
        security_context {
          fs_group = 472
        }
      }
    }
  }
}

# ============================================================================
# GRAFANA SERVICE
# ============================================================================

resource "kubernetes_service" "grafana" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "grafana"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app = "grafana"
    }
    annotations = {
      "prometheus.io/scrape" = "true"
      "prometheus.io/port"   = "3000"
    }
  }

  spec {
    selector = {
      app = "grafana"
    }
    port {
      port        = 3000
      target_port = 3000
      name        = "http"
    }
  }
}