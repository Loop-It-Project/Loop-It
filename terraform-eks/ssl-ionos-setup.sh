#!/bin/bash
# Ì¥í HTTPS Setup f√ºr loopit.tech mit bestehenden Ionos Nameservern

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warning() { echo -e "${YELLOW}‚ö†Ô∏è  $1${NC}"; }

log "Ì¥í Setting up HTTPS for loopit.tech with existing Ionos DNS..."

# terraform.tfvars erweitern (OHNE Route 53)
cat >> terraform-eks/terraform.tfvars << 'TFVARS'

# SSL Configuration (without Route 53)
enable_ssl = true
domain_name = "loopit.tech"
cert_manager_email = "vpj97@outlook.de"
TFVARS

# ============================================================================
# SCHRITT 1: CERT-MANAGER INSTALLATION
# ============================================================================

log "Ì¥í Installing cert-manager..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.18.2/cert-manager.yaml

log "‚è≥ Waiting for cert-manager..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager -n cert-manager --timeout=300s

# ============================================================================
# SCHRITT 2: LET'S ENCRYPT CLUSTER ISSUER
# ============================================================================

log "Ì≥ú Creating Let's Encrypt ClusterIssuer..."
cat << ISSUER | kubectl apply -f -
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
ISSUER

# ============================================================================
# SCHRITT 3: IONOS DNS RECORD SETUP
# ============================================================================

# Load Balancer URL abrufen
LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

warning "Ì≥ã MANUELLE DNS KONFIGURATION BEI IONOS ERFORDERLICH:"
echo "=============================================="
echo "Gehe zu: Ionos ‚Üí loopit.tech ‚Üí DNS"
echo "Erstelle diese A-Records:"
echo ""
echo "Type: A"
echo "Name: @ (oder leer)"
echo "Value: $(nslookup $LB_URL | grep 'Address:' | tail -1 | cut -d' ' -f2)"
echo ""
echo "Type: A" 
echo "Name: www"
echo "Value: $(nslookup $LB_URL | grep 'Address:' | tail -1 | cut -d' ' -f2)"
echo "=============================================="

read -p "Ì≥ù Have you configured the A-records at Ionos? (y/N): " configured_dns
if [[ ! $configured_dns =~ ^[Yy]$ ]]; then
    warning "Please configure DNS first, then run this script again."
    exit 0
fi

# ============================================================================
# SCHRITT 4: HTTPS INGRESS
# ============================================================================

log "Ìºê Creating HTTPS Ingress..."
cat << INGRESS | kubectl apply -f -
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
    
    # Security Headers
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload";
      more_set_headers "X-Frame-Options: SAMEORIGIN";
      more_set_headers "X-Content-Type-Options: nosniff";
    
    # WebSocket Support
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
INGRESS

log "Ì¥í Monitoring SSL certificate..."
echo "‚è≥ Waiting for SSL certificate (this may take 2-5 minutes)..."

for i in {1..30}; do
    CERT_STATUS=$(kubectl get certificate loopit-tls -n loop-it -o jsonpath='{.status.conditions[0].status}' 2>/dev/null || echo "Unknown")
    
    if [[ "$CERT_STATUS" == "True" ]]; then
        log "‚úÖ SSL certificate issued successfully!"
        break
    fi
    
    echo "‚è≥ Certificate status: $CERT_STATUS (attempt $i/30)"
    sleep 10
done

log "Ìæâ HTTPS setup completed!"
echo "Ìºê Your app should be available at: https://loopit.tech"
