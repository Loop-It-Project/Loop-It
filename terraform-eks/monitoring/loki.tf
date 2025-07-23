# monitoring/loki.tf
# Loki Log Aggregation Stack

# ============================================================================
# LOKI CONFIGURATION
# ============================================================================

resource "kubernetes_config_map" "loki_config" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "loki-config"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "loki"
      component = "monitoring"
    }
  }

  data = {
    "loki.yaml" = <<-EOT
      auth_enabled: false

      server:
        http_listen_port: 3100
        grpc_listen_port: 9096
        log_level: info

      common:
        instance_addr: 127.0.0.1
        path_prefix: /loki
        storage:
          filesystem:
            chunks_directory: /loki/chunks
            rules_directory: /loki/rules
        replication_factor: 1
        ring:
          kvstore:
            store: inmemory

      memberlist:
        join_members: []

      query_range:
        results_cache:
          cache:
            embedded_cache:
              enabled: true
              max_size_mb: 100

      schema_config:
        configs:
          - from: 2020-10-24
            store: tsdb
            object_store: filesystem
            schema: v13
            index:
              prefix: index_
              period: 24h

      storage_config:
        tsdb_shipper:
          active_index_directory: /loki/tsdb-index
          cache_location: /loki/tsdb-cache
          cache_ttl: 24h
        filesystem:
          directory: /loki/chunks

      compactor:
        working_directory: /loki/compactor
        shared_store: filesystem
        compaction_interval: 10m
        retention_enabled: true
        retention_delete_delay: 2h
        retention_delete_worker_count: 150

      limits_config:
        retention_period: ${var.loki_retention_period}
        enforce_metric_name: false
        reject_old_samples: true
        reject_old_samples_max_age: 168h
        ingestion_rate_mb: 16
        ingestion_burst_size_mb: 32
        max_label_name_length: 1024
        max_label_value_length: 4096
        max_label_names_per_series: 30
        max_streams_per_user: 10000
        max_line_size: 256000
        max_entries_limit_per_query: 5000
        max_global_streams_per_user: 5000

      chunk_store_config:
        max_look_back_period: 0s

      table_manager:
        retention_deletes_enabled: true
        retention_period: ${var.loki_retention_period}

      ruler:
        storage:
          type: local
          local:
            directory: /loki/rules
        rule_path: /loki/rules
        ring:
          kvstore:
            store: inmemory
        enable_api: true

      analytics:
        reporting_enabled: false

      frontend:
        log_queries_longer_than: 5s
        compress_responses: true

      querier:
        query_timeout: 1m
        tail_max_duration: 1h
    EOT
  }
}

# ============================================================================
# LOKI STORAGE
# ============================================================================

resource "kubernetes_persistent_volume_claim" "loki_pvc" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "loki-pvc"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "loki"
      component = "monitoring"
    }
  }
  
  spec {
    access_modes       = ["ReadWriteOnce"]
    storage_class_name = "gp3"
    
    resources {
      requests = {
        storage = var.loki_storage_size
      }
    }
  }
  
  wait_until_bound = false
}

# ============================================================================
# LOKI DEPLOYMENT
# ============================================================================

resource "kubernetes_deployment" "loki" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "loki"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "loki"
      component = "monitoring"
    }
  }

  spec {
    replicas = 1
    
    selector {
      match_labels = {
        app = "loki"
      }
    }

    template {
      metadata {
        labels = {
          app = "loki"
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "3100"
          "prometheus.io/path"   = "/metrics"
        }
      }

      spec {
        container {
          name  = "loki"
          image = "grafana/loki:2.9.0"
          
          port {
            container_port = 3100
            name          = "http"
          }
          
          port {
            container_port = 9096
            name          = "grpc"
          }
          
          args = [
            "-config.file=/etc/loki/loki.yaml",
            "-target=all"
          ]
          
          env {
            name  = "LOKI_AUTH_ENABLED"
            value = "false"
          }
          
          env {
            name  = "LOKI_SERVER_HTTP_LISTEN_PORT"
            value = "3100"
          }
          
          volume_mount {
            name       = "loki-config"
            mount_path = "/etc/loki"
          }
          
          volume_mount {
            name       = "loki-storage"
            mount_path = "/loki"
          }
          
          resources {
            requests = {
              memory = "128Mi"
              cpu    = "100m"
            }
            limits = {
              memory = var.loki_memory_limit
              cpu    = var.loki_cpu_limit
            }
          }
          
          liveness_probe {
            http_get {
              path = "/ready"
              port = 3100
            }
            initial_delay_seconds = 45
            period_seconds        = 30
            timeout_seconds       = 10
            failure_threshold     = 3
          }
          
          readiness_probe {
            http_get {
              path = "/ready"
              port = 3100
            }
            initial_delay_seconds = 15
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }
          
          security_context {
            run_as_non_root             = true
            run_as_user                 = 10001
            allow_privilege_escalation  = false
            read_only_root_filesystem   = false
            
            capabilities {
              drop = ["ALL"]
            }
          }
        }
        
        volume {
          name = "loki-config"
          config_map {
            name = kubernetes_config_map.loki_config[0].metadata[0].name
          }
        }
        
        volume {
          name = "loki-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.loki_pvc[0].metadata[0].name
          }
        }
        
        security_context {
          fs_group = 10001
        }
      }
    }
  }
}

# ============================================================================
# LOKI SERVICE
# ============================================================================

resource "kubernetes_service" "loki" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "loki"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "loki"
      component = "monitoring"
    }
    annotations = {
      "prometheus.io/scrape" = "true"
      "prometheus.io/port"   = "3100"
      "prometheus.io/path"   = "/metrics"
    }
  }

  spec {
    type = "ClusterIP"
    
    selector = {
      app = "loki"
    }

    port {
      port        = 3100
      target_port = 3100
      name        = "http"
    }
    
    port {
      port        = 9096
      target_port = 9096
      name        = "grpc"
    }
  }
}

# ============================================================================
# PROMTAIL (LOG COLLECTOR) - OPTIONAL
# ============================================================================

resource "kubernetes_service_account" "promtail" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "promtail"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "promtail"
      component = "monitoring"
    }
  }
}

resource "kubernetes_cluster_role" "promtail" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name = "promtail-loop-it"
    labels = {
      app       = "promtail"
      component = "monitoring"
    }
  }

  rule {
    api_groups = [""]
    resources  = ["nodes", "nodes/proxy", "services", "endpoints", "pods"]
    verbs      = ["get", "list", "watch"]
  }
}

resource "kubernetes_cluster_role_binding" "promtail" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name = "promtail-loop-it"
  }
  
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.promtail[0].metadata[0].name
  }
  
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.promtail[0].metadata[0].name
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
  }
}

resource "kubernetes_config_map" "promtail_config" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "promtail-config"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "promtail"
      component = "monitoring"
    }
  }

  data = {
    "promtail.yaml" = <<-EOT
      server:
        http_listen_port: 9080
        grpc_listen_port: 0
        log_level: info

      positions:
        filename: /tmp/positions.yaml

      clients:
        - url: http://loki.monitoring.svc.cluster.local:3100/loki/api/v1/push
          tenant_id: ""

      scrape_configs:
        # Kubernetes Pod Logs
        - job_name: kubernetes-pods
          kubernetes_sd_configs:
            - role: pod
          pipeline_stages:
            - cri: {}
          relabel_configs:
            # Nur bestimmte Namespaces
            - source_labels:
                - __meta_kubernetes_namespace
              action: keep
              regex: (loop-it|monitoring|default)
            
            # Container-Name
            - source_labels:
                - __meta_kubernetes_pod_container_name
              action: replace
              target_label: container
            
            # Namespace
            - source_labels:
                - __meta_kubernetes_namespace
              action: replace
              target_label: namespace
            
            # Pod-Name
            - source_labels:
                - __meta_kubernetes_pod_name
              action: replace
              target_label: pod
            
            # App-Label
            - source_labels:
                - __meta_kubernetes_pod_label_app
              action: replace
              target_label: app

        # Backend-spezifische Logs mit JSON Parsing
        - job_name: loop-it-backend
          kubernetes_sd_configs:
            - role: pod
              namespaces:
                names:
                  - loop-it
                  - default
          pipeline_stages:
            - cri: {}
            - match:
                selector: '{app="backend"}'
                stages:
                  - json:
                      expressions:
                        level: level
                        timestamp: timestamp
                        message: msg
                        method: method
                        url: url
                        status: status
                  - labels:
                      level:
                      method:
                      status:
          relabel_configs:
            - source_labels:
                - __meta_kubernetes_pod_label_app
              action: keep
              regex: (backend|loop-it-backend)
    EOT
  }
}

resource "kubernetes_daemonset" "promtail" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "promtail"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "promtail"
      component = "monitoring"
    }
  }

  spec {
    selector {
      match_labels = {
        app = "promtail"
      }
    }

    template {
      metadata {
        labels = {
          app = "promtail"
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "9080"
          "prometheus.io/path"   = "/metrics"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.promtail[0].metadata[0].name
        
        container {
          name  = "promtail"
          image = "grafana/promtail:2.9.0"
          
          port {
            container_port = 9080
            name          = "http"
          }
          
          args = [
            "-config.file=/etc/promtail/promtail.yaml",
            "-log.level=info"
          ]
          
          env {
            name = "HOSTNAME"
            value_from {
              field_ref {
                field_path = "spec.nodeName"
              }
            }
          }
          
          volume_mount {
            name       = "promtail-config"
            mount_path = "/etc/promtail"
          }
          
          volume_mount {
            name       = "varlog"
            mount_path = "/var/log"
            read_only  = true
          }
          
          volume_mount {
            name       = "varlibdockercontainers"
            mount_path = "/var/lib/docker/containers"
            read_only  = true
          }
          
          volume_mount {
            name       = "positions"
            mount_path = "/tmp"
          }
          
          resources {
            requests = {
              memory = "128Mi"
              cpu    = "100m"
            }
            limits = {
              memory = "256Mi"
              cpu    = "200m"
            }
          }
          
          liveness_probe {
            http_get {
              path = "/ready"
              port = 9080
            }
            initial_delay_seconds = 30
            period_seconds        = 30
          }
          
          readiness_probe {
            http_get {
              path = "/ready"
              port = 9080
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
          
          security_context {
            run_as_non_root             = false
            run_as_user                 = 0
            allow_privilege_escalation  = false
            read_only_root_filesystem   = true
            
            capabilities {
              drop = ["ALL"]
              add  = ["DAC_READ_SEARCH"]
            }
          }
        }
        
        volume {
          name = "promtail-config"
          config_map {
            name = kubernetes_config_map.promtail_config[0].metadata[0].name
          }
        }
        
        volume {
          name = "varlog"
          host_path {
            path = "/var/log"
          }
        }
        
        volume {
          name = "varlibdockercontainers"
          host_path {
            path = "/var/lib/docker/containers"
          }
        }
        
        volume {
          name = "positions"
          empty_dir {}
        }
        
        toleration {
          key      = "node-role.kubernetes.io/master"
          operator = "Exists"
          effect   = "NoSchedule"
        }
        
        toleration {
          key      = "node-role.kubernetes.io/control-plane"
          operator = "Exists"
          effect   = "NoSchedule"
        }
      }
    }
  }
}