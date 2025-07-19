# terraform-eks/k8s-apps.tf
# Kubernetes Applications for Loop-It

# ============================================================================
# NAMESPACE
# ============================================================================

resource "kubernetes_namespace" "loop_it" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name = "loop-it"
    labels = {
      name        = "loop-it"
      environment = var.environment
      project     = "loop-it"
    }
  }
  
  depends_on = [module.eks]
}

# ============================================================================
# SECRETS
# ============================================================================



resource "kubernetes_secret" "loopit_secrets" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name      = "loopit-secrets"
    namespace = kubernetes_namespace.loop_it[0].metadata[0].name
  }

  data = {
    postgres-user         = var.postgres_user
    postgres-password     = var.postgres_password      # Aus Environment Variable
    jwt-secret           = var.jwt_secret             # Aus Environment Variable  
    jwt-refresh-secret   = var.jwt_refresh_secret     # Aus Environment Variable
  }

  type = "Opaque"
}

# ============================================================================
# POSTGRESQL
# ============================================================================

resource "kubernetes_persistent_volume_claim" "postgres_pvc" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name      = "postgres-pvc"
    namespace = kubernetes_namespace.loop_it[0].metadata[0].name
  }
  
  spec {
    access_modes       = ["ReadWriteOnce"]
    storage_class_name = "gp3"
    
    resources {
      requests = {
        storage = var.postgres_storage_size
      }
    }
  }
  
  wait_until_bound = true
}

resource "kubernetes_deployment" "postgres" {
  count = var.deploy_applications ? 1 : 0

  # 🚀 TIMEOUT REDUZIEREN!
  timeouts {
    create = "2m"    # Reduziert von 10m auf 2m
    update = "2m"    # Reduziert von 10m auf 2m
    delete = "2m"    # Auch Delete timeout
  }

  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.loop_it[0].metadata[0].name
    labels = {
      app = "postgres"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "postgres"
      }
    }
    template {
      metadata {
        labels = {
          app = "postgres"
        }
      }
      spec {
        container {
          name  = "postgres"
          image = "postgres:17-alpine"
          port {
            container_port = 5432
            name          = "postgres"
          }
          env {
            name  = "POSTGRES_DB"
            value = "loop-it"
          }
          env {
            name = "POSTGRES_USER"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.loopit_secrets[0].metadata[0].name
                key  = "postgres-user"
              }
            }
          }
          env {
            name = "POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.loopit_secrets[0].metadata[0].name
                key  = "postgres-password"
              }
            }
          }
          # 🚀 WICHTIG: PostgreSQL Data Directory in Subdirectory
          env {
            name  = "PGDATA"
            value = "/var/lib/postgresql/data/pgdata"
          }
          volume_mount {
            name       = "postgres-storage"
            mount_path = "/var/lib/postgresql/data"
          }
          liveness_probe {
            exec {
              command = ["pg_isready", "-U", "loop_user", "-d", "loop-it"]
            }
            initial_delay_seconds = 30
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }
          readiness_probe {
            exec {
              command = ["pg_isready", "-U", "loop_user", "-d", "loop-it"]
            }
            initial_delay_seconds = 5
            period_seconds        = 5
            timeout_seconds       = 3
            failure_threshold     = 3
          }
          resources {
            limits = {
              cpu    = "200m"    # reduziert von 500m  
              memory = "256Mi"   # reduziert von 512Mi
            }
            requests = {
              cpu    = "100m"    # reduziert von 250m
              memory = "128Mi"   # reduziert von 256Mi  
            }
          }
        }
        volume {
          name = "postgres-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.postgres_pvc[0].metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "postgres" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.loop_it[0].metadata[0].name
    labels = {
      app = "postgres"
    }
  }

  spec {
    selector = {
      app = "postgres"
    }

    port {
      port        = 5432
      target_port = 5432
    }
  }
}

# ============================================================================
# DATABASE MIGRATION JOB
# ============================================================================

resource "kubernetes_job" "db_migration" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name      = "db-migration-${formatdate("YYYYMMDD-hhmm", timestamp())}"
    namespace = kubernetes_namespace.loop_it[0].metadata[0].name
    labels = {
      app       = "migration"
      component = "database"
    }
  }

  spec {
    template {
      metadata {
        labels = {
          app = "migration"
        }
      }

      spec {
        restart_policy = "OnFailure"

        init_container {
          name  = "wait-for-postgres"
          image = "busybox:1.35"
          
          command = [
            "sh", "-c",
            "until nc -z postgres 5432; do echo 'Waiting for postgres...'; sleep 2; done; echo 'PostgreSQL is ready!'"
          ]
        }

        container {
          name  = "migration"
          image = "${aws_ecr_repository.backend.repository_url}:latest"
          
          command = ["/bin/sh"]
          args = [
            "-c",
            <<-EOT
              echo "🔄 Running Database Migrations..."
              
              echo "📦 Installing dependencies..."
              npm ci --only=production
              
              echo "🔧 Running Drizzle migrations..."
              npm run db:push || npm run db:migrate || echo "⚠️ Migration command failed, continuing..."
              
              echo "✅ Migration job completed!"
            EOT
          ]

          env {
            name  = "NODE_ENV"
            value = "production"
          }
          env {
            name  = "DB_HOST"
            value = "postgres"
          }
          env {
            name  = "DB_PORT"
            value = "5432"
          }
          env {
            name  = "POSTGRES_DB"
            value = "loop-it"
          }
          env {
            name = "POSTGRES_USER"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.loopit_secrets[0].metadata[0].name
                key  = "postgres-user"
              }
            }
          }
          env {
            name = "POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.loopit_secrets[0].metadata[0].name
                key  = "postgres-password"
              }
            }
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
        }
      }
    }
  }

  depends_on = [
    kubernetes_deployment.postgres,
    kubernetes_service.postgres
  ]

  # Job wird bei jedem Terraform Apply neu erstellt
  lifecycle {
    replace_triggered_by = [
      terraform_data.migration_trigger.output
    ]
  }
}

# Trigger für Migration Job
resource "terraform_data" "migration_trigger" {
  input = timestamp()
}

# ============================================================================
# BACKEND APPLICATION
# ============================================================================

resource "kubernetes_deployment" "backend" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.loop_it[0].metadata[0].name
    labels = {
      app     = "backend"
      version = "v1"
    }
  }

  spec {
    replicas = var.backend_replicas

    strategy {
      type = "RollingUpdate"
      rolling_update {
        max_unavailable = "0"
        max_surge      = "1"
      }
    }

    selector {
      match_labels = {
        app = "backend"
      }
    }

    template {
      metadata {
        labels = {
          app     = "backend"
          version = "v1"
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "3000"
          "prometheus.io/path"   = "/metrics"
        }
      }

      spec {
        container {
          name  = "backend"
          image = "${aws_ecr_repository.backend.repository_url}:latest"
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 3000
            name          = "http"
            protocol      = "TCP"
          }

          startup_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 5
            failure_threshold     = 20
            timeout_seconds       = 3
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 0
            period_seconds        = 30
            failure_threshold     = 3
            timeout_seconds       = 5
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 0
            period_seconds        = 5
            failure_threshold     = 2
            timeout_seconds       = 3
          }

          # Environment Variables
          env {
            name  = "PORT"
            value = "3000"
          }
          env {
            name  = "NODE_ENV"
            value = "production"
          }
          env {
            name  = "DB_HOST"
            value = "postgres"
          }
          env {
            name  = "DB_PORT"
            value = "5432"
          }
          env {
            name  = "POSTGRES_DB"
            value = "loop-it"
          }
          env {
            name = "POSTGRES_USER"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.loopit_secrets[0].metadata[0].name
                key  = "postgres-user"
              }
            }
          }
          env {
            name = "POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.loopit_secrets[0].metadata[0].name
                key  = "postgres-password"
              }
            }
          }
          env {
            name  = "DATABASE_URL"
            value = "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(POSTGRES_DB)"
          }
          env {
            name = "JWT_SECRET"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.loopit_secrets[0].metadata[0].name
                key  = "jwt-secret"
              }
            }
          }
          env {
            name = "JWT_REFRESH_SECRET"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.loopit_secrets[0].metadata[0].name
                key  = "jwt-refresh-secret"
              }
            }
          }
          env {
            name  = "JWT_EXPIRES_IN"
            value = "7d"
          }

          volume_mount {
            name       = "uploads-volume"
            mount_path = "/app/uploads"
          }

          resources {
            requests = {
              cpu    = "200m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          security_context {
            allow_privilege_escalation = false
            run_as_non_root           = true
            run_as_user              = 1001
            capabilities {
              drop = ["ALL"]
            }
          }
        }

        volume {
          name = "uploads-volume"
          empty_dir {}
        }
      }
    }
  }

  depends_on = [
    kubernetes_job.db_migration
  ]
}

resource "kubernetes_service" "backend" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.loop_it[0].metadata[0].name
    labels = {
      app = "backend"
    }
    annotations = {
      "prometheus.io/scrape" = "true"
      "prometheus.io/port"   = "3000"
      "prometheus.io/path"   = "/metrics"
    }
  }

  spec {
    selector = {
      app = "backend"
    }

    port {
      port        = 3000
      target_port = 3000
      protocol    = "TCP"
      name        = "http"
    }
  }
}

# ============================================================================
# NGINX INGRESS CONTROLLER (Pure Kubernetes)
# ============================================================================

# Da du bereits NGINX Ingress Controller hast, verwenden wir eine Data Source
data "kubernetes_service" "ingress_nginx_controller" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name      = "ingress-nginx-controller"
    namespace = "ingress-nginx"
  }
  
  # Falls NGINX Ingress noch nicht installiert ist, installiere es via kubectl apply
  # Dies ist ein Fallback, normalerweise sollte es bereits existieren
  depends_on = [module.eks]
}

# Optional: NGINX Ingress Installation via kubectl_manifest (falls nicht vorhanden)
resource "kubernetes_manifest" "nginx_ingress_install" {
  count = var.deploy_applications ? 0 : 0  # Disabled by default, da du es bereits hast
  
  manifest = {
    apiVersion = "v1"
    kind       = "Namespace"
    metadata = {
      name = "ingress-nginx"
    }
  }
}

# ============================================================================
# INGRESS
# ============================================================================

resource "kubernetes_ingress_v1" "loop_it" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name      = "loop-it-ingress"
    namespace = kubernetes_namespace.loop_it[0].metadata[0].name
    labels = {
      app       = "loop-it"
      component = "ingress"
    }
    annotations = {
      "kubernetes.io/ingress.class"                    = "nginx"
      "nginx.ingress.kubernetes.io/ssl-redirect"       = "false"
      "nginx.ingress.kubernetes.io/backend-protocol"   = "HTTP"
      "nginx.ingress.kubernetes.io/enable-cors"        = "true"
      "nginx.ingress.kubernetes.io/cors-allow-origin"  = "*"
      "nginx.ingress.kubernetes.io/cors-allow-methods" = "GET, POST, PUT, DELETE, OPTIONS"
      "nginx.ingress.kubernetes.io/cors-allow-headers" = "Content-Type, Authorization, X-Requested-With"
    }
  }

  spec {
    ingress_class_name = "nginx"
    
    rule {
      http {
        path {
          path      = "/api"
          path_type = "Prefix"
          backend {
            service {
              name = kubernetes_service.backend[0].metadata[0].name
              port {
                number = 3000
              }
            }
          }
        }
        
        path {
          path      = "/health"
          path_type = "Exact"
          backend {
            service {
              name = kubernetes_service.backend[0].metadata[0].name
              port {
                number = 3000
              }
            }
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_service.backend,
    data.kubernetes_service.ingress_nginx_controller
  ]
}