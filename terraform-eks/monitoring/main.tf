# terraform-eks/monitoring-namespace.tf
# Monitoring Namespace und Shared Resources

resource "kubernetes_namespace" "monitoring" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name = "monitoring"
    labels = {
      name                           = "monitoring"
      "app.kubernetes.io/name"      = "loop-it-monitoring"
      "app.kubernetes.io/instance"  = "loop-it"
      "app.kubernetes.io/component" = "monitoring"
      "app.kubernetes.io/part-of"   = "loop-it"
      "app.kubernetes.io/managed-by" = "terraform"
      environment                   = var.environment
    }
    annotations = {
      "description" = "Loop-It Monitoring Stack - Prometheus, Grafana, Loki"
      "managed-by"  = "terraform"
    }
  }
  
  depends_on = []  # Dependencies werden vom Parent-Modul verwaltet
}

# Shared Secret für Monitoring
resource "kubernetes_secret" "monitoring_secrets" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "monitoring-secrets"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "monitoring"
      component = "shared"
    }
  }

  data = {
    grafana-admin-user     = var.grafana_admin_user
    grafana-admin-password = var.grafana_admin_password
    grafana-secret-key     = var.grafana_secret_key
  }

  type = "Opaque"
}

# Backend Service Annotations für Prometheus Scraping
resource "kubernetes_annotations" "backend_prometheus" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  api_version = "v1"
  kind        = "Service"
  metadata {
    name      = "backend"
    namespace = "loop-it"
  }
  
  annotations = {
    "prometheus.io/scrape" = "true"
    "prometheus.io/port"   = "3000"
    "prometheus.io/path"   = "/metrics"
  }
  
  depends_on = [
    # kubernetes_service.backend, # Managed by parent module
    kubernetes_namespace.monitoring
  ]
}