# terraform-eks/ssl-config.tf - DNS + Load Balancer Konfiguration

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  count = var.enable_ssl && var.domain_name != "" ? 1 : 0
  
  name = var.domain_name
  
  tags = {
    Name        = var.domain_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "loop-it"
  }
}

# Hardcode für Network Load Balancer eu-central-1
locals {
  nlb_hosted_zone_id = "Z3F0SRJ5LGBH90"  # Korrekte Zone ID für deinen NLB
}

# A-Record für loopit.tech → Load Balancer (sicher)
resource "aws_route53_record" "app" {
  count   = var.deploy_applications && var.enable_ssl && var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = try(data.kubernetes_service.ingress_nginx_controller[0].status.0.load_balancer.0.ingress.0.hostname, "pending")
    zone_id               = local.nlb_hosted_zone_id  # NLB Zone ID
    evaluate_target_health = true
  }

  depends_on = [data.kubernetes_service.ingress_nginx_controller]
  
  lifecycle {
    ignore_changes = [alias[0].name]
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "nameservers" {
  description = "Nameserver für loopit.tech bei Ionos zu konfigurieren"
  value       = var.enable_ssl && var.domain_name != "" ? aws_route53_zone.main[0].name_servers : []
}

output "dns_setup_status" {
  description = "DNS Setup Status"
  value = var.enable_ssl && var.domain_name != "" ? {
    domain           = var.domain_name
    hosted_zone_id   = aws_route53_zone.main[0].zone_id
    nameservers      = aws_route53_zone.main[0].name_servers
    load_balancer    = try(data.kubernetes_service.ingress_nginx_controller[0].status.0.load_balancer.0.ingress.0.hostname, "pending")
    next_steps = [
      "1. ✅ Nameservers configured at Ionos", 
      "2. ✅ DNS propagation complete",
      "3. 🎯 Deploy A-record: terraform apply",
      "4. 🔒 Install cert-manager for SSL",
      "5. 🌐 Access via https://loopit.tech"
    ]
  } : null
}

output "load_balancer_hostname" {
  description = "NGINX Ingress Load Balancer Hostname"
  value = var.deploy_applications ? try(
    data.kubernetes_service.ingress_nginx_controller[0].status.0.load_balancer.0.ingress.0.hostname,
    "Load Balancer not ready yet"
  ) : "Applications not deployed"
}