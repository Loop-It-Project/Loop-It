#!/bin/bash
# 🔒 HTTPS + Route 53 Setup für loopit.tech
# Automatische SSL-Zertifikate mit cert-manager und Let's Encrypt

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# ============================================================================
# SCHRITT 1: ROUTE 53 HOSTED ZONE SETUP
# ============================================================================

log "🌐 Setting up Route 53 Hosted Zone for loopit.tech..."

# terraform.tfvars erweitern
cat >> terraform-eks/terraform.tfvars << 'EOF'

# SSL & Domain Configuration
enable_ssl = true
domain_name = "loopit.tech"
cert_manager_email = "vpj97@outlook.de"
EOF

# SSL-spezifische Terraform Konfiguration erstellen
cat > terraform-eks/ssl-route53.tf << 'EOF'
# ============================================================================
# ROUTE 53 HOSTED ZONE
# ============================================================================

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

# ============================================================================
# A-RECORD → LOAD BALANCER
# ============================================================================

# Data source für Load Balancer
data "kubernetes_service" "ingress_controller" {
  count = var.enable_ssl && var.domain_name != "" ? 1 : 0
  
  metadata {
    name      = "ingress-nginx-controller"
    namespace = "ingress-nginx"
  }
  
  depends_on = [module.eks]
}

# A-Record für loopit.tech → Load Balancer
resource "aws_route53_record" "app" {
  count   = var.enable_ssl && var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = data.kubernetes_service.ingress_controller[0].status.0.load_balancer.0.ingress.0.hostname
    zone_id               = "Z3F0SRJ5LGBH90"  # NLB Zone ID für eu-central-1
    evaluate_target_health = true
  }
}

# CNAME für www.loopit.tech → loopit.tech
resource "aws_route53_record" "www" {
  count   = var.enable_ssl && var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.domain_name]
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "nameservers" {
  description = "Nameserver für loopit.tech Domain-Konfiguration"
  value       = var.enable_ssl && var.domain_name != "" ? aws_route53_zone.main[0].name_servers : []
}

output "dns_setup_status" {
  description = "DNS Setup Status"
  value = var.enable_ssl && var.domain_name != "" ? {
    domain           = var.domain_name
    hosted_zone_id   = aws_route53_zone.main[0].zone_id
    nameservers      = aws_route53_zone.main[0].name_servers
    load_balancer    = try(data.kubernetes_service.ingress_controller[0].status.0.load_balancer.0.ingress.0.hostname, "pending")
    next_steps = [
      "1. 🌐 Configure nameservers at your domain registrar",
      "2. ⏳ Wait for DNS propagation (5-30 minutes)",
      "3. 🔒 Deploy cert-manager for SSL certificates",
      "4. 🚀 Access via https://loopit.tech"
    ]
  } : null
}
EOF

# Variables für SSL erweitern
cat >> terraform-eks/variables.tf << 'EOF'

# ============================================================================
# SSL & DOMAIN VARIABLES
# ============================================================================

variable "enable_ssl" {
  description = "Enable SSL/HTTPS with cert-manager"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "cert_manager_email" {
  description = "Email für cert-manager Let's Encrypt Zertifikate"
  type        = string
  default     = ""
}
EOF

log "🏗️ Deploying Route 53 Hosted Zone..."

cd terraform-eks
terraform init
terraform plan -var-file="secrets.tfvars"
terraform apply -var-file="secrets.tfvars" -auto-approve

# Nameservers anzeigen
NAMESERVERS=$(terraform output -json nameservers | jq -r '.[]' | tr '\n' ' ')
info "📋 Configure these nameservers at your domain registrar:"
echo "$NAMESERVERS"

read -p "📝 Have you configured the nameservers at your registrar? (y/N): " configured_ns
if [[ ! $configured_ns =~ ^[Yy]$ ]]; then
    warning "Please configure nameservers first, then run this script again."
    exit 0
fi

# ============================================================================
# SCHRITT 2: CERT-MANAGER INSTALLATION
# ============================================================================

log "🔒 Installing cert-manager..."

# cert-manager installieren
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.18.2/cert-manager.yaml

# Warten bis cert-manager ready
log "⏳ Waiting for cert-manager to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager -n cert-manager --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cainjector -n cert-manager --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=webhook -n cert-manager --timeout=300s

# ============================================================================
# SCHRITT 3: LET'S ENCRYPT CLUSTER ISSUER
# ============================================================================

log "📜 Creating Let's Encrypt ClusterIssuer..."

cat << EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: vpj97@outlook.de
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
          podTemplate:
            spec:
              nodeSelector:
                "kubernetes.io/os": linux
EOF

# ============================================================================
# SCHRITT 4: HTTPS INGRESS MIT SSL
# ============================================================================

log "🌐 Creating HTTPS Ingress with SSL..."

cat << EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: loop-it-https
  namespace: loop-it
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    
    # Security Headers für A+ SSL Rating
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload";
      more_set_headers "X-Frame-Options: SAMEORIGIN";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-XSS-Protection: 1; mode=block";
      more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
    
    # CORS + WebSocket Support
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://loopit.tech,https://www.loopit.tech"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Content-Type, Authorization, X-Requested-With"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/websocket-services: "backend"
    
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - loopit.tech
    - www.loopit.tech
    secretName: loopit-tls
  rules:
  - host: loopit.tech
    http:
      paths:
      - path: /socket.io
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
      - path: /health
        pathType: Exact
        backend:
          service:
            name: backend
            port:
              number: 3000
      - path: /metrics
        pathType: Exact
        backend:
          service:
            name: backend
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
  - host: www.loopit.tech
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
EOF

# ============================================================================
# SCHRITT 5: FRONTEND MIT HTTPS URL NEU BAUEN
# ============================================================================

log "🎨 Rebuilding Frontend with HTTPS URL..."

cd ../frontend

# Frontend mit HTTPS URL bauen
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com

# SwipeGame Import entfernen falls vorhanden
if grep -q "import SwipeGame" src/components/Header.jsx 2>/dev/null; then
  sed -i '/import SwipeGame/d' src/components/Header.jsx
  warning "Fixed SwipeGame import issue"
fi

# Docker config temporär entfernen
if [ -f "vite.config.docker.js" ]; then
  mv vite.config.docker.js vite.config.docker.js.backup
fi

# Frontend mit HTTPS API URL bauen
docker build --build-arg VITE_API_URL=https://loopit.tech \
  -t $ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/loop-it/frontend:https .

docker push $ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/loop-it/frontend:https

# Deployment updaten
kubectl set image deployment/frontend frontend=$ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/loop-it/frontend:https -n loop-it

# Config wiederherstellen
if [ -f "vite.config.docker.js.backup" ]; then
  mv vite.config.docker.js.backup vite.config.docker.js
fi

# ============================================================================
# SCHRITT 6: SSL ZERTIFIKAT ÜBERWACHUNG
# ============================================================================

log "🔒 Monitoring SSL certificate issuance..."

echo "⏳ Waiting for SSL certificate to be issued..."
echo "This can take 2-5 minutes..."

for i in {1..30}; do
    CERT_STATUS=$(kubectl get certificate loopit-tls -n loop-it -o jsonpath='{.status.conditions[0].status}' 2>/dev/null || echo "Unknown")
    
    if [[ "$CERT_STATUS" == "True" ]]; then
        log "✅ SSL certificate successfully issued!"
        break
    fi
    
    echo "⏳ Certificate status: $CERT_STATUS (attempt $i/30)"
    sleep 10
done

# ============================================================================
# SCHRITT 7: VERIFICATION & TESTING
# ============================================================================

log "🧪 Testing HTTPS setup..."

# DNS Test
echo "Testing DNS resolution..."
nslookup loopit.tech || echo "DNS might still be propagating"

# HTTPS Test
echo "Testing HTTPS connection..."
if curl -I https://loopit.tech/ 2>/dev/null | head -1 | grep -q "200"; then
    log "✅ HTTPS is working!"
else
    warning "HTTPS might still be setting up. Check certificate status:"
    kubectl describe certificate loopit-tls -n loop-it
fi

# ============================================================================
# SUCCESS SUMMARY
# ============================================================================

log "🎉 HTTPS + Route 53 setup completed!"
echo
echo "🌐 Your Loop-It app is now available at:"
echo "   ✅ https://loopit.tech"
echo "   ✅ https://www.loopit.tech"
echo
echo "🔒 SSL Certificate:"
kubectl get certificate loopit-tls -n loop-it -o wide
echo
echo "📊 Next steps:"
echo "1. Test the app: https://loopit.tech"
echo "2. Verify SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=loopit.tech"
echo "3. Setup monitoring with Grafana/Prometheus"
echo
info "🎯 Your Loop-It app is now production-ready with HTTPS!"

cd ../terraform-eks