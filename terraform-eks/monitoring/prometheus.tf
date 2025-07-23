# terraform-eks/monitoring-prometheus.tf
# Prometheus Monitoring Component

# ============================================================================
# PROMETHEUS RBAC
# ============================================================================

resource "kubernetes_service_account" "prometheus" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "prometheus"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "prometheus"
      component = "monitoring"
    }
  }
}

resource "kubernetes_cluster_role" "prometheus" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name = "prometheus-loop-it"
    labels = {
      app       = "prometheus"
      component = "monitoring"
    }
  }

  rule {
    api_groups = [""]
    resources  = ["nodes", "nodes/proxy", "services", "endpoints", "pods"]
    verbs      = ["get", "list", "watch"]
  }
  
  rule {
    api_groups = ["extensions", "networking.k8s.io"]
    resources  = ["ingresses"]
    verbs      = ["get", "list", "watch"]
  }
  
  rule {
    non_resource_urls = ["/metrics"]
    verbs             = ["get"]
  }
}

resource "kubernetes_cluster_role_binding" "prometheus" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name = "prometheus-loop-it"
  }
  
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.prometheus[0].metadata[0].name
  }
  
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.prometheus[0].metadata[0].name
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
  }
}

# ============================================================================
# PROMETHEUS CONFIGURATION
# ============================================================================

resource "kubernetes_config_map" "prometheus_config" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "prometheus-config"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "prometheus"
      component = "monitoring"
    }
  }

  data = {
    "prometheus.yml" = <<-EOT
      global:
        scrape_interval: 15s
        evaluation_interval: 15s

      scrape_configs:
        - job_name: 'prometheus'
          static_configs:
            - targets: ['localhost:9090']

        - job_name: 'loop-it-backend'
          static_configs:
            - targets: ['backend.loop-it.svc.cluster.local:3000']
          metrics_path: '/metrics'
          scrape_interval: 10s

        - job_name: 'kubernetes-services'
          kubernetes_sd_configs:
            - role: service
              namespaces:
                names: [loop-it, default]
          relabel_configs:
            - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
              action: keep
              regex: true
            - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
              action: replace
              target_label: __metrics_path__
              regex: (.+)

        - job_name: 'monitoring-stack'
          kubernetes_sd_configs:
            - role: pod
              namespaces:
                names: [monitoring]
          relabel_configs:
            - source_labels: [__meta_kubernetes_pod_label_app]
              action: keep
              regex: (prometheus|grafana|loki)
    EOT
  }
}

# ============================================================================
# PROMETHEUS STORAGE
# ============================================================================

resource "kubernetes_persistent_volume_claim" "prometheus_pvc" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "prometheus-pvc"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
  }
  
  spec {
    access_modes       = ["ReadWriteOnce"]
    storage_class_name = "gp3"
    resources {
      requests = {
        storage = var.prometheus_storage_size
      }
    }
  }
  
  wait_until_bound = false
}

# ============================================================================
# PROMETHEUS DEPLOYMENT
# ============================================================================

resource "kubernetes_deployment" "prometheus" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "prometheus"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app = "prometheus"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "prometheus"
      }
    }

    template {
      metadata {
        labels = {
          app = "prometheus"
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "9090"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.prometheus[0].metadata[0].name
        
        container {
          name  = "prometheus"
          image = "prom/prometheus:v2.47.0"
          
          port {
            container_port = 9090
            name          = "http"
          }
          
          args = [
            "--config.file=/etc/prometheus/prometheus.yml",
            "--storage.tsdb.path=/prometheus",
            "--storage.tsdb.retention.time=${var.prometheus_retention_time}",
            "--web.enable-lifecycle",
            "--web.external-url=http://${var.prometheus_domain}"
          ]
          
          volume_mount {
            name       = "prometheus-config"
            mount_path = "/etc/prometheus"
          }
          volume_mount {
            name       = "prometheus-storage"
            mount_path = "/prometheus"
          }
          
          resources {
            requests = {
              memory = var.prometheus_memory_request
              cpu    = var.prometheus_cpu_request
            }
            limits = {
              memory = var.prometheus_memory_limit
              cpu    = var.prometheus_cpu_limit
            }
          }
          
          liveness_probe {
            http_get {
              path = "/-/healthy"
              port = 9090
            }
            initial_delay_seconds = 30
            period_seconds        = 30
          }
          
          readiness_probe {
            http_get {
              path = "/-/ready"
              port = 9090
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
          
          security_context {
            run_as_non_root             = true
            run_as_user                 = 65534
            read_only_root_filesystem   = true
            allow_privilege_escalation  = false
            capabilities {
              drop = ["ALL"]
            }
          }
        }
        
        volume {
          name = "prometheus-config"
          config_map {
            name = kubernetes_config_map.prometheus_config[0].metadata[0].name
          }
        }
        volume {
          name = "prometheus-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.prometheus_pvc[0].metadata[0].name
          }
        }
        
        security_context {
          fs_group = 65534
        }
      }
    }
  }
}

# ============================================================================
# PROMETHEUS SERVICE
# ============================================================================

resource "kubernetes_service" "prometheus" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "prometheus"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app = "prometheus"
    }
    annotations = {
      "prometheus.io/scrape" = "true"
      "prometheus.io/port"   = "9090"
    }
  }

  spec {
    selector = {
      app = "prometheus"
    }
    port {
      port        = 9090
      target_port = 9090
      name        = "http"
    }
  }
}