variable "database_url" {
  description = "Complete database URL for Drizzle ORM"
  type        = string
  sensitive   = true
}
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

# ============================================================================
# SECRET VARIABLES (Vervollständigt)
# ============================================================================

variable "postgres_user" {
  description = "PostgreSQL database user"
  type        = string
  default     = "loop_user"
  sensitive   = true
}

variable "postgres_password" {
  description = "PostgreSQL database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for token signing (min 32 chars)"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh secret for refresh tokens (min 32 chars)"
  type        = string
  sensitive   = true
}

# ============================================================================
# INFRASTRUCTURE VARIABLES
# ============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "loop-it-cluster"
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "node_desired_capacity" {
  description = "Desired number of nodes"
  type        = number
  default     = 2
}

variable "node_max_capacity" {
  description = "Maximum number of nodes"
  type        = number
  default     = 6
}

variable "node_min_capacity" {
  description = "Minimum number of nodes"
  type        = number
  default     = 1
}

variable "enable_spot_instances" {
  description = "Use spot instances for cost optimization"
  type        = bool
  default     = true
}

variable "deploy_applications" {
  description = "Whether to deploy the Loop-It applications"
  type        = bool
  default     = true
}

variable "backend_replicas" {
  description = "Number of backend replicas"
  type        = number
  default     = 1
}

variable "frontend_replicas" {
  description = "Number of frontend replicas"
  type        = number
  default     = 1
}

variable "postgres_storage_size" {
  description = "PostgreSQL storage size"
  type        = string
  default     = "2Gi"
}

variable "enable_monitoring" {
  description = "Enable monitoring stack"
  type        = bool
  default     = false
}

# ============================================================================
# SSL & Security Variables
# ============================================================================

variable "domain_name" {
  description = "Domain für HTTPS Loop-It App"
  type        = string
  default     = ""
}

variable "ssl_email" {
  description = "Email für Let's Encrypt SSL Certificates"
  type        = string
  default     = ""
}

variable "enable_ssl" {
  description = "Enable SSL/HTTPS with cert-manager"
  type        = bool
  default     = false
}

# Public/Private Access Control
variable "public_ingress" {
  description = "Soll der Ingress Controller öffentlich sein?"
  type        = bool
  default     = true
}

# ============================================================================
# PROJECT VARIABLES
# ============================================================================

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "loop-it"
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}