# terraform-eks/monitoring-ingress.tf
# Monitoring Ingress Configuration

resource "kubernetes_ingress_v1" "monitoring" {
  count = var.deploy_applications && var.enable_monitoring ? 1 : 0
  
  metadata {
    name      = "monitoring-ingress"
    namespace = kubernetes_namespace.monitoring[0].metadata[0].name
    labels = {
      app       = "monitoring"
      component = "ingress"
    }
    annotations = {
      "kubernetes.io/ingress.class"               = "nginx"
      "nginx.ingress.kubernetes.io/ssl-redirect"  = "false"
      "nginx.ingress.kubernetes.io/rewrite-target" = "/"
    }
  }

  spec {
    ingress_class_name = "nginx"
    
    # Grafana Dashboard
    rule {
      host = var.monitoring_domain
      http {
        path {
          path      = "/"
          path_type = "Prefix"
          backend {
            service {
              name = kubernetes_service.grafana[0].metadata[0].name
              port {
                number = 3000
              }
            }
          }
        }
      }
    }
    
    # Prometheus UI
    rule {
      host = var.prometheus_domain
      http {
        path {
          path      = "/"
          path_type = "Prefix"
          backend {
            service {
              name = kubernetes_service.prometheus[0].metadata[0].name
              port {
                number = 9090
              }
            }
          }
        }
      }
    }
  }
}

