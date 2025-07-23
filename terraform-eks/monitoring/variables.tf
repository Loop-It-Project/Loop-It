# monitoring/variables.tf
# Variables für das Monitoring-Modul

# ============================================================================
# CONTROL VARIABLES
# ============================================================================

variable "deploy_applications" {
  description = "Whether to deploy applications"
  type        = bool
}

variable "enable_monitoring" {
  description = "Enable monitoring stack"
  type        = bool
}

# ============================================================================
# DEPENDENCIES
# ============================================================================

variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "kubernetes_namespace_loop_it" {
  description = "Loop-It namespace resource"
}

# ============================================================================
# AUTHENTICATION
# ============================================================================

variable "grafana_admin_user" {
  description = "Grafana admin username"
  type        = string
  sensitive   = true
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
}

variable "grafana_secret_key" {
  description = "Grafana secret key"
  type        = string
  sensitive   = true
}

# ============================================================================
# DOMAINS
# ============================================================================

variable "monitoring_domain" {
  description = "Domain for Grafana"
  type        = string
  default     = "monitoring.localhost"
}

variable "prometheus_domain" {
  description = "Domain for Prometheus"
  type        = string
  default     = "prometheus.localhost"
}

variable "loki_domain" {
  description = "Domain for Loki"
  type        = string
  default     = "loki.localhost"
}

# ============================================================================
# STORAGE
# ============================================================================

variable "prometheus_storage_size" {
  description = "Prometheus storage size"
  type        = string
  default     = "10Gi"
}

variable "grafana_storage_size" {
  description = "Grafana storage size"
  type        = string
  default     = "2Gi"
}

variable "loki_storage_size" {
  description = "Loki storage size"
  type        = string
  default     = "5Gi"
}

# ============================================================================
# RETENTION
# ============================================================================

variable "prometheus_retention_time" {
  description = "Prometheus retention time"
  type        = string
  default     = "7d"
}

variable "loki_retention_period" {
  description = "Loki retention period"
  type        = string
  default     = "168h"
}

# ============================================================================
# RESOURCE LIMITS
# ============================================================================

variable "prometheus_memory_limit" {
  description = "Prometheus memory limit"
  type        = string
  default     = "1Gi"
}

variable "prometheus_cpu_limit" {
  description = "Prometheus CPU limit"
  type        = string
  default     = "500m"
}

variable "grafana_memory_limit" {
  description = "Grafana memory limit"
  type        = string
  default     = "512Mi"
}

variable "grafana_cpu_limit" {
  description = "Grafana CPU limit"
  type        = string
  default     = "500m"
}

variable "loki_memory_limit" {
  description = "Loki memory limit"
  type        = string
  default     = "512Mi"
}

variable "loki_cpu_limit" {
  description = "Loki CPU limit"
  type        = string
  default     = "300m"
}
# Fehlende Variables hinzufügen
variable "environment" {
  description = "Environment name"
  type        = string
}

# Resource Request Variables (fehlend)
variable "prometheus_memory_request" {
  description = "Prometheus memory request"
  type        = string
  default     = "256Mi"
}

variable "prometheus_cpu_request" {
  description = "Prometheus CPU request"
  type        = string
  default     = "100m"
}

variable "grafana_memory_request" {
  description = "Grafana memory request"
  type        = string
  default     = "128Mi"
}

variable "grafana_cpu_request" {
  description = "Grafana CPU request"
  type        = string
  default     = "100m"
}

variable "loki_memory_request" {
  description = "Loki memory request"
  type        = string
  default     = "128Mi"
}

variable "loki_cpu_request" {
  description = "Loki CPU request"
  type        = string
  default     = "100m"
}
