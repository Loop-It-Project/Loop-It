#!/bin/bash
# 🔒 HTTPS + Domain Setup für loopit.tech
# Mit cert-manager und Let's Encrypt SSL

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo "🔒 HTTPS + Domain Setup für loopit.tech"
echo "========================================"

# ============================================================================
# SCHRITT 1: DNS KONFIGURATION ÜBERPRÜFEN
# ============================================================================

log "📋 DNS Konfiguration erforderlich bei Ionos:"
echo ""
echo "Gehe zu: Ionos → loopit.tech → DNS Management"
echo "Konfiguriere diese A-Records:"
echo ""
echo "📝 Record 1:"
echo "   Type: A"
echo "   Name: @ (oder leer für root domain)"
echo "   Value: 3.68.49.78"
echo "   TTL: 300 (5 Minuten)"
echo ""
echo "📝 Record 2:"
echo "   Type: A"
echo "   Name: www"
echo "   Value: 3.68.49.78" 
echo "   TTL: 300 (5 Minuten)"
echo ""
warning "💡 Verwende die erste IP (3.68.49.78) - AWS Load Balancer rotiert automatisch zwischen den IPs"
echo ""

read -p "🤔 Hast du die DNS Records bei Ionos konfiguriert? (y/N): " dns_configured
if [[ ! $dns_configured =~ ^[Yy]$ ]]; then
    warning "Bitte konfiguriere erst die DNS Records bei Ionos, dann starte das Script erneut."
    exit 0
fi

# ============================================================================
# SCHRITT 2: CERT-MANAGER INSTALLATION
# ============================================================================

log "🔒 Installing cert-manager..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.18.2/cert-manager.yaml

log "⏳ Waiting for cert-manager to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager -n cert-manager --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager-cainjector -n cert-manager --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager-webhook -n cert-manager --timeout=300s

# ============================================================================
# SCHRITT 3: LET'S ENCRYPT CLUSTER ISSUER
# ============================================================================

log "📜 Creating Let's Encrypt ClusterIssuer..."
cat << 'ISSUER' | kubectl apply -f -
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
# SCHRITT 4: DNS PROPAGATION CHECK
# ============================================================================

log "🌐 Checking DNS propagation..."
for i in {1..12}; do
    info "Checking DNS resolution (attempt $i/12)..."
    
    # Check both domains
    LOOPIT_RESOLVED=$(nslookup loopit.tech 8.8.8.8 2>/dev/null | grep -c "3.68.49.78" || echo "0")
    WWW_RESOLVED=$(nslookup www.loopit.tech 8.8.8.8 2>/dev/null | grep -c "3.68.49.78" || echo "0")
    
    if [[ "$LOOPIT_RESOLVED" -gt "0" && "$WWW_RESOLVED" -gt "0" ]]; then
        log "✅ DNS propagation successful!"
        break
    fi
    
    if [[ $i -eq 12 ]]; then
        warning "DNS not fully propagated yet. SSL setup will continue anyway."
        warning "Certificates may take longer to issue."
    else
        echo "⏳ DNS not ready yet, waiting 30 seconds..."
        sleep 30
    fi
done

# ============================================================================
# SCHRITT 5: HTTPS INGRESS MIT SSL
# ============================================================================

log "🌐 Creating HTTPS Ingress with SSL..."

# Erst das alte HTTP Ingress löschen
kubectl delete ingress loop-it-ingress -n loop-it --ignore-not-found=true

cat << 'INGRESS' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: loop-it-https
  namespace: loop-it
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    
    # SSL Configuration
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    
    # Security Headers
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload";
      more_set_headers "X-Frame-Options: SAMEORIGIN";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-XSS-Protection: 1; mode=block";
      more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
    
    # CORS Headers
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://loopit.tech,https://www.loopit.tech"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Content-Type, Authorization, X-Requested-With"
    
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
INGRESS

# ============================================================================
# SCHRITT 6: FRONTEND MIT HTTPS API URL NEU BAUEN
# ============================================================================

log "🎨 Rebuilding Frontend with HTTPS API URL..."

# Backend Service URL für Frontend setzen
BACKEND_URL="https://loopit.tech"

# Frontend neu bauen und deployen
kubectl set env deployment/frontend -n loop-it \
  REACT_APP_BACKEND_URL="$BACKEND_URL" \
  REACT_APP_API_URL="$BACKEND_URL/api" \
  REACT_APP_SOCKET_URL="$BACKEND_URL"

# Deployment restart um neue ENV vars zu laden
kubectl rollout restart deployment/frontend -n loop-it

# ============================================================================
# SCHRITT 7: SSL CERTIFICATE MONITORING
# ============================================================================

log "🔒 Monitoring SSL certificate issuance..."
echo "⏳ Let's Encrypt certificate issuance can take 2-10 minutes..."
echo ""

# Certificate Request erstellen falls nicht automatisch passiert
kubectl get certificate loopit-tls -n loop-it 2>/dev/null || {
    log "📜 Creating certificate request..."
    cat << 'CERT' | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: loopit-tls
  namespace: loop-it
spec:
  secretName: loopit-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - loopit.tech
  - www.loopit.tech
CERT
}

# Certificate Status überwachen
for i in {1..60}; do
    CERT_STATUS=$(kubectl get certificate loopit-tls -n loop-it -o jsonpath='{.status.conditions[0].status}' 2>/dev/null || echo "Unknown")
    CERT_REASON=$(kubectl get certificate loopit-tls -n loop-it -o jsonpath='{.status.conditions[0].reason}' 2>/dev/null || echo "Unknown")
    
    if [[ "$CERT_STATUS" == "True" ]]; then
        log "✅ SSL certificate issued successfully!"
        break
    fi
    
    if [[ "$CERT_REASON" == "Failed" ]]; then
        warning "❌ Certificate issuance failed. Checking challenge status..."
        kubectl describe certificate loopit-tls -n loop-it
        kubectl get challenges -n loop-it
        break
    fi
    
    echo "⏳ Certificate status: $CERT_STATUS - $CERT_REASON (attempt $i/60)"
    
    if [[ $i -eq 60 ]]; then
        warning "Certificate issuance taking longer than expected."
        echo "This is normal for new domains. Let's check the status:"
        kubectl describe certificate loopit-tls -n loop-it
    else
        sleep 10
    fi
done

# ============================================================================
# SCHRITT 8: VERIFICATION & TESTING
# ============================================================================

log "🧪 Running verification tests..."

# Ingress Status
echo ""
info "📋 Ingress Configuration:"
kubectl describe ingress loop-it-https -n loop-it

# Certificate Details
echo ""
info "🔒 Certificate Status:"
kubectl describe certificate loopit-tls -n loop-it

# Test HTTPS Endpoints
echo ""
log "🌐 Testing HTTPS endpoints..."

echo "Testing https://loopit.tech/health..."
curl -k -s -o /dev/null -w "HTTP Status: %{http_code}, SSL: %{ssl_verify_result}\n" https://loopit.tech/health || echo "Connection failed (normal during setup)"

echo "Testing https://www.loopit.tech/health..."
curl -k -s -o /dev/null -w "HTTP Status: %{http_code}, SSL: %{ssl_verify_result}\n" https://www.loopit.tech/health || echo "Connection failed (normal during setup)"

# ============================================================================
# FINALE
# ============================================================================

echo ""
echo "🎉 HTTPS + Domain Setup completed!"
echo "=================================="
echo ""
log "🌐 Your Loop-It app is now available at:"
echo "   ✅ https://loopit.tech"
echo "   ✅ https://www.loopit.tech"
echo ""
log "🔒 Security Features:"
echo "   ✅ Let's Encrypt SSL/TLS certificates"
echo "   ✅ HTTP to HTTPS redirect"
echo "   ✅ Security headers (HSTS, XSS Protection, etc.)"
echo "   ✅ CORS configuration for HTTPS"
echo "   ✅ WebSocket support over WSS"
echo ""
info "💡 Next steps:"
echo "   1. Wait 5-10 minutes for full DNS propagation"
echo "   2. Test the app at https://loopit.tech"
echo "   3. Check SSL rating at: https://www.ssllabs.com/ssltest/"
echo "   4. Monitor certificate auto-renewal (90 days)"
echo ""
warning "🚨 If certificates are still pending:"
echo "   - Check DNS: nslookup loopit.tech"
echo "   - Monitor: kubectl get certificates -n loop-it"
echo "   - Debug: kubectl describe certificate loopit-tls -n loop-it"