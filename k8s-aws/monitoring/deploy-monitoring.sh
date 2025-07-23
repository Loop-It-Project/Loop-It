#!/bin/bash

echo "🚀 Loop-It Monitoring - Production-Ready Deployment"
echo "=================================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Prüfe ob Kubernetes läuft
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Kubernetes cluster ist nicht erreichbar!${NC}"
    echo "Starte Docker Desktop oder minikube"
    exit 1
fi

echo -e "${GREEN}✅ Kubernetes Cluster ist bereit${NC}"

# Lade .env.monitoring falls vorhanden
if [ -f "k8s/monitoring/.env.monitoring" ]; then
    echo -e "${BLUE}📂 Lade k8s/monitoring/.env.monitoring...${NC}"
    source k8s/monitoring/.env.monitoring
    echo -e "${GREEN}✅ Environment-Variablen geladen${NC}"
elif [ -f ".env.monitoring" ]; then
    echo -e "${BLUE}📂 Lade .env.monitoring...${NC}"
    source .env.monitoring
    echo -e "${GREEN}✅ Environment-Variablen geladen${NC}"
else
    echo -e "${YELLOW}⚠️  .env.monitoring nicht gefunden, verwende Defaults${NC}"
    export GRAFANA_ADMIN_USER="admin"
    export GRAFANA_ADMIN_PASSWORD="monitoring123"
    export GRAFANA_SECRET_KEY="$(openssl rand -base64 32 2>/dev/null || echo 'default-secret-key-change-me-please')"
    export PROMETHEUS_RETENTION_TIME="7d"
fi

# Validiere kritische Variablen
echo -e "${BLUE}🔍 Validiere Environment-Variablen...${NC}"
echo -e "  Grafana User: ${GRAFANA_ADMIN_USER:-admin}"
echo -e "  Grafana Password: $(echo ${GRAFANA_ADMIN_PASSWORD:-monitoring123} | cut -c1-3)***$(echo ${GRAFANA_ADMIN_PASSWORD:-monitoring123} | tail -c3)"
echo -e "  Prometheus Retention: ${PROMETHEUS_RETENTION_TIME:-7d}"

# Stoppe alle Port-Forwards
echo -e "${BLUE}🔌 Stoppe alte Port-Forwards...${NC}"
pkill -f "kubectl port-forward" 2>/dev/null || true

# Prüfe NGINX Ingress Controller
echo -e "${BLUE}🔍 Prüfe NGINX Ingress Controller...${NC}"
if ! kubectl get pods -n ingress-nginx | grep -q "ingress-nginx-controller.*Running"; then
    echo -e "${YELLOW}⚠️  NGINX Ingress Controller nicht gefunden${NC}"
    echo -e "${BLUE}📦 Installiere NGINX Ingress Controller...${NC}"
    
    # Für Docker Desktop
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
    
    echo -e "${YELLOW}⏳ Warte auf NGINX Ingress Controller...${NC}"
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
fi

echo -e "${GREEN}✅ NGINX Ingress Controller läuft${NC}"

# Namespace erstellen
echo -e "${BLUE}📁 Erstelle monitoring Namespace...${NC}"
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Bereinige altes Monitoring falls vorhanden
echo -e "${BLUE}🧹 Bereinige eventuell vorhandenes altes Monitoring...${NC}"
kubectl delete deployment,service,configmap,ingress,secret -n monitoring --all --ignore-not-found=true --timeout=30s

# Erstelle Secrets
echo -e "${BLUE}🔐 Erstelle Secrets...${NC}"
kubectl create secret generic grafana-secrets -n monitoring \
    --from-literal=admin-user="${GRAFANA_ADMIN_USER:-admin}" \
    --from-literal=admin-password="${GRAFANA_ADMIN_PASSWORD:-monitoring123}" \
    --from-literal=secret-key="${GRAFANA_SECRET_KEY:-default-secret-key}" \
    --dry-run=client -o yaml | kubectl apply -f -

# Deploye Prometheus
echo -e "${BLUE}📊 Deploye Prometheus...${NC}"
kubectl apply -f k8s/monitoring/prometheus.yaml

# Deploye Loki
echo -e "${BLUE}📋 Deploye Loki...${NC}"
cat << 'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: loki
  template:
    metadata:
      labels:
        app: loki
    spec:
      containers:
      - name: loki
        image: grafana/loki:2.9.0
        args:
          - -config.file=/etc/loki/local-config.yaml
        ports:
        - containerPort: 3100
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"

---
apiVersion: v1
kind: Service
metadata:
  name: loki
  namespace: monitoring
spec:
  selector:
    app: loki
  ports:
  - port: 3100
    targetPort: 3100
EOF

# Deploye Grafana (Production-Ready)
echo -e "${BLUE}📈 Deploye Grafana (Production-Ready)...${NC}"
cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: monitoring
  labels:
    app: grafana
    component: monitoring
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        access: proxy
        url: http://prometheus.monitoring.svc.cluster.local:9090
        isDefault: true
        editable: true
        jsonData:
          httpMethod: POST
          manageAlerts: true
          prometheusType: Prometheus
          prometheusVersion: 2.40.0
      - name: Loki
        type: loki
        access: proxy
        url: http://loki.monitoring.svc.cluster.local:3100
        isDefault: false
        editable: true

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
  namespace: monitoring
  labels:
    app: grafana
    component: monitoring
data:
  grafana.ini: |
    [server]
    domain = monitoring.localhost
    root_url = http://monitoring.localhost/
    serve_from_sub_path = false
    
    [security]
    admin_user = ${GF_SECURITY_ADMIN_USER}
    admin_password = ${GF_SECURITY_ADMIN_PASSWORD}
    
    [auth.anonymous]
    enabled = false
    
    [users]
    allow_sign_up = false
    
    [log]
    mode = console
    level = info

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
    component: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
        component: monitoring
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:10.2.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: GF_SECURITY_ADMIN_USER
          valueFrom:
            secretKeyRef:
              name: grafana-secrets
              key: admin-user
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-secrets
              key: admin-password
        - name: GF_INSTALL_PLUGINS
          value: "grafana-clock-panel,grafana-simple-json-datasource"
        volumeMounts:
        - name: grafana-storage
          mountPath: /var/lib/grafana
        - name: grafana-datasources
          mountPath: /etc/grafana/provisioning/datasources
          readOnly: true
        - name: grafana-config
          mountPath: /etc/grafana
          readOnly: true
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: grafana-storage
        emptyDir: {}
      - name: grafana-datasources
        configMap:
          name: grafana-datasources
      - name: grafana-config
        configMap:
          name: grafana-config

---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
    component: monitoring
spec:
  type: ClusterIP
  ports:
  - port: 3000
    targetPort: 3000
    name: http
  selector:
    app: grafana
EOF

# Deploye Ingress (Production-Ready)
echo -e "${BLUE}🌐 Deploye Production Ingress...${NC}"
cat << 'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: monitoring-ingress
  namespace: monitoring
  labels:
    app: monitoring
    component: ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "false"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
spec:
  ingressClassName: nginx
  rules:
  # Grafana auf monitoring.localhost
  - host: monitoring.localhost
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: grafana
            port:
              number: 3000
  
  # Prometheus auf prometheus.localhost
  - host: prometheus.localhost
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: prometheus
            port:
              number: 9090
  
  # Loki auf loki.localhost (für Debugging)
  - host: loki.localhost
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: loki
            port:
              number: 3100

  # Fallback auf localhost mit Pfad-basiertem Routing
  - host: localhost
    http:
      paths:
      - path: /monitoring
        pathType: Prefix
        backend:
          service:
            name: grafana
            port:
              number: 3000
      - path: /prometheus
        pathType: Prefix
        backend:
          service:
            name: prometheus
            port:
              number: 9090
      - path: /loki
        pathType: Prefix
        backend:
          service:
            name: loki
            port:
              number: 3100
EOF

# Backend Service für Prometheus annotieren (VERBESSERT)
echo -e "${BLUE}🔧 Konfiguriere Backend für Prometheus Scraping...${NC}"

# Prüfe alle möglichen Backend Services
BACKEND_FOUND=false

# 1. Versuche backend-service in default namespace
if kubectl get service backend-service -n default &> /dev/null; then
    kubectl patch service backend-service -n default -p '{"metadata":{"annotations":{"prometheus.io/scrape":"true","prometheus.io/port":"3000","prometheus.io/path":"/metrics"}}}'
    echo -e "${GREEN}✅ Backend Service (backend-service/default) für Monitoring konfiguriert${NC}"
    BACKEND_FOUND=true
fi

# 2. Versuche backend in default namespace  
if kubectl get service backend -n default &> /dev/null; then
    kubectl patch service backend -n default -p '{"metadata":{"annotations":{"prometheus.io/scrape":"true","prometheus.io/port":"3000","prometheus.io/path":"/metrics"}}}'
    echo -e "${GREEN}✅ Backend Service (backend/default) für Monitoring konfiguriert${NC}"
    BACKEND_FOUND=true
fi

# 3. Versuche backend-service in loopit-dev namespace
if kubectl get service backend-service -n loopit-dev &> /dev/null; then
    kubectl patch service backend-service -n loopit-dev -p '{"metadata":{"annotations":{"prometheus.io/scrape":"true","prometheus.io/port":"3000","prometheus.io/path":"/metrics"}}}'
    echo -e "${GREEN}✅ Backend Service (backend-service/loopit-dev) für Monitoring konfiguriert${NC}"
    BACKEND_FOUND=true
fi

# 4. Versuche backend in loopit-dev namespace
if kubectl get service backend -n loopit-dev &> /dev/null; then
    kubectl patch service backend -n loopit-dev -p '{"metadata":{"annotations":{"prometheus.io/scrape":"true","prometheus.io/port":"3000","prometheus.io/path":"/metrics"}}}'
    echo -e "${GREEN}✅ Backend Service (backend/loopit-dev) für Monitoring konfiguriert${NC}"
    BACKEND_FOUND=true
fi

# Falls kein Backend gefunden
if [ "$BACKEND_FOUND" = false ]; then
    echo -e "${YELLOW}⚠️  Kein Backend Service gefunden - überspringe Annotation${NC}"
    echo -e "${BLUE}📝 Verfügbare Services:${NC}"
    echo -e "${BLUE}   Default Namespace:${NC}"
    kubectl get services -n default 2>/dev/null | grep -v "kubernetes" || echo "     -> Keine Services"
    echo -e "${BLUE}   Loopit-Dev Namespace:${NC}"
    kubectl get services -n loopit-dev 2>/dev/null || echo "     -> Namespace nicht gefunden"
fi

# Warte auf Pods
echo -e "${YELLOW}⏳ Warte auf Monitoring-Pods...${NC}"

echo -e "  -> Warte auf Prometheus..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n monitoring

echo -e "  -> Warte auf Loki..."
kubectl wait --for=condition=available --timeout=300s deployment/loki -n monitoring

echo -e "  -> Warte auf Grafana..."
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n monitoring


# ✅ FIX: Custom Metrics Server für erweiterte HPA
log_step "🔧 Deploye Custom Metrics Server für HPA..."
if [ -f "k8s/monitoring/custom-metrics-server.yaml" ]; then
    # TLS Certificates für Custom Metrics Server erstellen
    log_step "🔐 Erstelle TLS Certificates..."
    # Temporäre Certificates erstellen
    openssl req -x509 -sha256 -new -nodes -days 365 -newkey rsa:2048 \
        -keyout /tmp/serving.key -out /tmp/serving.crt \
        -subj "/C=XX/ST=XX/L=XX/O=XX/OU=XX/CN=custom-metrics-apiserver.monitoring.svc" \
        2>/dev/null || log_warning "OpenSSL nicht verfügbar - Custom Metrics werden übersprungen"
    if [ -f "/tmp/serving.crt" ] && [ -f "/tmp/serving.key" ]; then
        # TLS Secret erstellen
        kubectl create secret tls custom-metrics-apiserver-certs \
            --cert=/tmp/serving.crt --key=/tmp/serving.key \
            -n monitoring --dry-run=client -o yaml | kubectl apply -f -
        # Custom Metrics Server deployen
        kubectl apply -f k8s/monitoring/custom-metrics-server.yaml
        log_step "⏳ Warte auf Custom Metrics Server..."
        kubectl wait --for=condition=available deployment/custom-metrics-apiserver \
            -n monitoring --timeout=120s 2>/dev/null || log_warning "Custom Metrics Server startup timeout"
        # Cleanup temporäre Files
        rm -f /tmp/serving.crt /tmp/serving.key
        log_success "Custom Metrics Server deployed"
    else
        log_warning "TLS Certificate creation failed - Custom Metrics disabled"
    fi
else
    log_warning "custom-metrics-server.yaml nicht gefunden - Custom Metrics disabled"
fi

# Status prüfen
echo -e "${BLUE}📊 Status-Check...${NC}"
echo "Pods in monitoring namespace:"
kubectl get pods -n monitoring -o wide

echo -e "\nServices in monitoring namespace:"
kubectl get services -n monitoring

echo -e "\nIngress Rules:"
kubectl get ingress -n monitoring -o wide

echo ""
echo -e "${GREEN}✅ Production Monitoring erfolgreich deployed!${NC}"
echo ""
echo -e "${BLUE}🌐 Verfügbare URLs:${NC}"
echo -e "  ${GREEN}Grafana:${NC}    http://monitoring.localhost/"
echo -e "  ${GREEN}Prometheus:${NC} http://prometheus.localhost/"
echo -e "  ${GREEN}Loki:${NC}       http://loki.localhost/"
echo ""
echo -e "${BLUE}📝 Fallback URLs (falls .localhost nicht funktioniert):${NC}"
echo -e "  ${GREEN}Grafana:${NC}    http://localhost/monitoring/"
echo -e "  ${GREEN}Prometheus:${NC} http://localhost/prometheus/"
echo -e "  ${GREEN}Backend:${NC}    http://localhost/backend/metrics"
echo ""
echo -e "${YELLOW}🔐 Login-Daten für Grafana:${NC}"
echo -e "  ${GREEN}Username:${NC} ${GRAFANA_ADMIN_USER:-admin}"
echo -e "  ${GREEN}Password:${NC} ${GRAFANA_ADMIN_PASSWORD:-monitoring123}"
echo ""
echo -e "${BLUE}📋 Hosts-Datei aktualisieren (einmalig):${NC}"
echo -e "  ${YELLOW}Windows:${NC} C:\\Windows\\System32\\drivers\\etc\\hosts (als Administrator)"
echo -e "  ${YELLOW}Linux/Mac:${NC} /etc/hosts (mit sudo)"
echo ""
echo -e "${GREEN}Füge hinzu:${NC}"
echo "127.0.0.1 monitoring.localhost"
echo "127.0.0.1 prometheus.localhost"
echo "127.0.0.1 loki.localhost"
echo "127.0.0.1 backend.localhost"
echo ""
echo -e "${GREEN}🎉 Kein Port-Forwarding mehr nötig!${NC}"