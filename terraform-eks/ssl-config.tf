# terraform-eks/ssl-config.tf - Nur Route53 DNS
# SSL Setup erfolgt manuell nach Cluster-Creation

resource "aws_route53_zone" "main" {
  count = var.enable_ssl && var.domain_name != "" ? 1 : 0
  
  name = var.domain_name
  
  tags = {
    Name        = var.domain_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

output "nameservers" {
  description = "Nameserver für loopit.tech bei Ionos zu konfigurieren"
  value       = var.enable_ssl && var.domain_name != "" ? aws_route53_zone.main[0].name_servers : []
}
