output "ecr_backend_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "ECR repository URL for frontend"  
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_registry_id" {
  description = "ECR registry ID"
  value       = aws_ecr_repository.backend.registry_id
}
output "cluster_name" {
  value       = module.eks.cluster_name
  description = "Kubernetes Cluster Name"
}

output "cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "Endpoint for EKS control plane"
}

output "cluster_security_group_id" {
  value       = module.eks.cluster_security_group_id
  description = "Security group ids attached to the cluster control plane"
}

output "cluster_oidc_issuer_url" {
  value       = module.eks.cluster_oidc_issuer_url
  description = "The URL on the EKS cluster OIDC Issuer"
}

output "configure_kubectl" {
  value       = "aws eks --region ${var.aws_region} update-kubeconfig --name ${module.eks.cluster_name}"
  description = "Configure kubectl"
}

output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "ID of the VPC where the cluster is deployed"
}

output "private_subnet_ids" {
  value       = module.vpc.private_subnets
  description = "IDs of the private subnets"
}

output "public_subnet_ids" {
  value       = module.vpc.public_subnets
  description = "IDs of the public subnets"
}

output "aws_region" {
  value       = var.aws_region
  description = "AWS region"
}

output "node_security_group_id" {
  value       = module.eks.node_security_group_id
  description = "ID of the node shared security group"
}

output "estimated_monthly_cost" {
  value       = var.enable_spot_instances ? "~95 EUR/month (EKS: 73, Nodes: 12, NAT: 8, Storage: 2)" : "~125 EUR/month (EKS: 73, Nodes: 40, NAT: 8, Storage: 2)"
  description = "Estimated monthly cost in EUR"
}

output "cost_optimization_enabled" {
  value = {
    spot_instances     = var.enable_spot_instances
    single_nat_gateway = true
    gp3_storage        = true
  }
  description = "Cost optimization features enabled"
}

output "next_steps" {
  value = [
    "1. Configure kubectl: ${module.eks.cluster_name}",
    "2. Install NGINX Ingress Controller",
    "3. Install cert-manager for SSL",
    "4. Deploy Loop-It applications to namespace: loop-it",
    "5. Set up monitoring stack"
  ]
  description = "Next steps for Loop-It deployment"
}
