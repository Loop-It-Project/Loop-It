# terraform-eks/monitoring-module.tf
# Integration des modularen Monitoring-Stacks

module "monitoring" {
  source = "./monitoring"
  
  # Control Variables
  deploy_applications = var.deploy_applications
  enable_monitoring  = var.enable_monitoring
  environment = var.environment
  
  # EKS Dependencies
  eks_cluster_name = module.eks.cluster_name
  kubernetes_namespace_loop_it = kubernetes_namespace.loop_it
  
  # Monitoring Configuration
  grafana_admin_user     = var.grafana_admin_user
  grafana_admin_password = var.grafana_admin_password
  grafana_secret_key     = var.grafana_secret_key
  
  # Domains
  monitoring_domain = var.monitoring_domain
  prometheus_domain = var.prometheus_domain
  loki_domain      = var.loki_domain
  
  # Storage
  prometheus_storage_size = var.prometheus_storage_size
  grafana_storage_size   = var.grafana_storage_size
  loki_storage_size      = var.loki_storage_size
  
  # Retention
  prometheus_retention_time = var.prometheus_retention_time
  loki_retention_period    = var.loki_retention_period
  
  # Resource Limits
  prometheus_memory_limit = var.prometheus_memory_limit
  prometheus_cpu_limit   = var.prometheus_cpu_limit
  grafana_memory_limit   = var.grafana_memory_limit
  grafana_cpu_limit     = var.grafana_cpu_limit
  loki_memory_limit     = var.loki_memory_limit
  loki_cpu_limit       = var.loki_cpu_limit
  
  # Dependencies
  depends_on = [
    module.eks,
    kubernetes_namespace.loop_it,
    kubernetes_service.backend
  ]
}