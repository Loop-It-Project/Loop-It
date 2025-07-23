# monitoring/outputs.tf
# Outputs für das Monitoring-Modul

# ============================================================================
# MONITORING URLS
# ============================================================================

output "monitoring_urls" {
  description = "Monitoring dashboard URLs"
  value = var.deploy_applications && var.enable_monitoring ? {
    grafana    = "http://${var.monitoring_domain}/"
    prometheus = "http://${var.prometheus_domain}/"
    loki       = "http://${var.loki_domain}/"
  } : null
}

output "monitoring_credentials" {
  description = "Monitoring login credentials"
  value = var.deploy_applications && var.enable_monitoring ? {
    grafana_username = var.grafana_admin_user
    grafana_password = var.grafana_admin_password
  } : null
  sensitive = true
}

# ============================================================================
# DEPLOYMENT STATUS
# ============================================================================

output "monitoring_status" {
  description = "Monitoring stack deployment status"
  value = var.deploy_applications && var.enable_monitoring ? {
    namespace_created    = try(kubernetes_namespace.monitoring[0].metadata[0].name, "not_created")
    prometheus_deployed  = try(kubernetes_deployment.prometheus[0].metadata[0].name, "not_deployed")
    grafana_deployed     = try(kubernetes_deployment.grafana[0].metadata[0].name, "not_deployed")
    loki_deployed       = try(kubernetes_deployment.loki[0].metadata[0].name, "not_deployed")
    ingress_configured  = try(kubernetes_ingress_v1.monitoring[0].metadata[0].name, "not_configured")
  } : null
}

# ============================================================================
# STORAGE STATUS
# ============================================================================

output "monitoring_storage" {
  description = "Monitoring persistent storage status"
  value = var.deploy_applications && var.enable_monitoring ? {
    prometheus_pvc = try(kubernetes_persistent_volume_claim.prometheus_pvc[0].metadata[0].name, "not_created")
    grafana_pvc    = try(kubernetes_persistent_volume_claim.grafana_pvc[0].metadata[0].name, "not_created")
    loki_pvc       = try(kubernetes_persistent_volume_claim.loki_pvc[0].metadata[0].name, "not_created")
    storage_sizes = {
      prometheus = var.prometheus_storage_size
      grafana    = var.grafana_storage_size
      loki       = var.loki_storage_size
    }
  } : null
}

# ============================================================================
# SERVICE ENDPOINTS
# ============================================================================

output "monitoring_services" {
  description = "Internal service endpoints"
  value = var.deploy_applications && var.enable_monitoring ? {
    prometheus_internal = "http://prometheus.monitoring.svc.cluster.local:9090"
    grafana_internal    = "http://grafana.monitoring.svc.cluster.local:3000"
    loki_internal       = "http://loki.monitoring.svc.cluster.local:3100"
  } : null
}

# ============================================================================
# CONFIGURATION SUMMARY
# ============================================================================

output "monitoring_config" {
  description = "Monitoring configuration summary"
  value = var.deploy_applications && var.enable_monitoring ? {
    retention_settings = {
      prometheus = var.prometheus_retention_time
      loki       = var.loki_retention_period
    }
    domains = {
      grafana    = var.monitoring_domain
      prometheus = var.prometheus_domain
      loki       = var.loki_domain
    }
    resource_limits = {
      prometheus = {
        memory = var.prometheus_memory_limit
        cpu    = var.prometheus_cpu_limit
      }
      grafana = {
        memory = var.grafana_memory_limit
        cpu    = var.grafana_cpu_limit
      }
      loki = {
        memory = var.loki_memory_limit
        cpu    = var.loki_cpu_limit
      }
    }
  } : null
}

# ============================================================================
# DEMO HELPER OUTPUTS
# ============================================================================

output "demo_commands" {
  description = "Useful commands for demo"
  value = var.deploy_applications && var.enable_monitoring ? {
    check_pods       = "kubectl get pods -n monitoring"
    check_services   = "kubectl get services -n monitoring"
    check_ingress    = "kubectl get ingress -n monitoring"
    check_storage    = "kubectl get pvc -n monitoring"
    prometheus_logs  = "kubectl logs -n monitoring -l app=prometheus -f"
    grafana_logs     = "kubectl logs -n monitoring -l app=grafana -f"
    backend_metrics  = "curl http://$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')/api/metrics"
  } : null
}

output "hosts_file_entries" {
  description = "Entries for /etc/hosts file"
  value = var.deploy_applications && var.enable_monitoring ? [
    "127.0.0.1 ${var.monitoring_domain}",
    "127.0.0.1 ${var.prometheus_domain}",
    "127.0.0.1 ${var.loki_domain}"
  ] : []
}