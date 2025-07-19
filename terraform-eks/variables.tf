variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

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
