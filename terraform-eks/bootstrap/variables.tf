# terraform-eks/bootstrap/variables.tf

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "loop-it"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "github_org" {
  description = "GitHub organization name"
  type        = string
  default     = "Loop-It-Project"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "Loop-It"
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}