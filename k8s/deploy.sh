#!/bin/bash

echo "🚀 Deploying Loop-It with Production-Ready Auto-Scaling..."

# Farben für bessere Übersicht
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Funktion für bessere Logs
log_step() {
    echo -e "${BLUE}$1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. NGINX Ingress Controller prüfen/installieren
log_step "🌐 Checking NGINX Ingress Controller..."
if ! kubectl get deployment ingress-nginx-controller -n ingress-nginx &> /dev/null; then
    log_step "Installing NGINX Ingress Controller v1.13.0..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.13.0/deploy/static/provider/cloud/deploy.yaml
    log_step "⏳ Waiting for NGINX Ingress Controller..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=120s
else
    log_success "NGINX Ingress Controller already running"
fi

# 2. Docker Images bauen
log_step "🔨 Building Docker images..."
docker build -t loopit/backend:latest ./backend
docker build --build-arg VITE_API_URL=http://localhost -t loopit/frontend:latest ./frontend
log_success "Docker images built"

# 3. Namespace erstellen
log_step "📦 Creating namespace..."
kubectl create namespace loopit-dev 2>/dev/null || echo "Namespace already exists"

# 4. Alte Deployments löschen (clean slate)
log_step "🧹 Cleaning up old deployments..."
kubectl delete deployment --all -n loopit-dev 2>/dev/null || true
kubectl delete hpa --all -n loopit-dev 2>/dev/null || true
kubectl delete pdb --all -n loopit-dev 2>/dev/null || true

# 5. Secrets generieren
log_step "🔐 Generating secrets..."
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

kubectl create secret generic loopit-secrets \
    --from-literal=postgres-user=loop_user \
    --from-literal=postgres-password=$POSTGRES_PASSWORD \
    --from-literal=jwt-secret=$JWT_SECRET \
    --from-literal=jwt-refresh-secret=$JWT_REFRESH_SECRET \
    --namespace=loopit-dev \
    --dry-run=client -o yaml | kubectl apply -f -

log_success "Secrets configured"

# 6. Custom Metrics Server für HPA (falls Monitoring läuft)
log_step "📊 Setting up Custom Metrics for HPA..."
if kubectl get namespace monitoring &> /dev/null; then
    log_step "Deploying Custom Metrics Server..."
    
    # Custom Metrics Server Configuration
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: custom-metrics-apiserver
  namespace: monitoring
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: custom-metrics-server-resources
rules:
- apiGroups: [""]
  resources: ["pods", "nodes", "nodes/stats"]
  verbs: ["get", "list"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["services", "endpoints"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: custom-metrics-resource-reader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: custom-metrics-server-resources
subjects:
- kind: ServiceAccount
  name: custom-metrics-apiserver
  namespace: monitoring
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: adapter-config
  namespace: monitoring
data:
  config.yaml: |
    rules:
    - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
      resources:
        overrides:
          namespace:
            resource: namespace
          pod:
            resource: pod
      name:
        matches: "^(.*)_total"
        as: "\${1}_per_second"
      metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'
    - seriesQuery: 'http_request_duration_seconds{namespace!="",pod!=""}'
      resources:
        overrides:
          namespace:
            resource: namespace
          pod:
            resource: pod
      name:
        matches: "^(.*)_seconds"
        as: "\${1}_p95_milliseconds"
      metricsQuery: 'histogram_quantile(0.95, sum(rate(<<.Series>>_bucket{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>, le)) * 1000'
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: custom-metrics-apiserver
  namespace: monitoring
  labels:
    app: custom-metrics-apiserver
spec:
  replicas: 1
  selector:
    matchLabels:
      app: custom-metrics-apiserver
  template:
    metadata:
      labels:
        app: custom-metrics-apiserver
    spec:
      serviceAccountName: custom-metrics-apiserver
      containers:
      - name: custom-metrics-apiserver
        image: k8s.gcr.io/prometheus-adapter/prometheus-adapter:v0.11.2
        args:
        - --secure-port=6443
        - --tls-cert-file=/var/run/serving-cert/tls.crt
        - --tls-private-key-file=/var/run/serving-cert/tls.key
        - --logtostderr=true
        - --prometheus-url=http://prometheus:9090/
        - --metrics-relist-interval=1m
        - --v=4
        - --config=/etc/adapter/config.yaml
        ports:
        - containerPort: 6443
          name: https
        volumeMounts:
        - mountPath: /var/run/serving-cert
          name: volume-serving-cert
          readOnly: true
        - mountPath: /etc/adapter/
          name: config
          readOnly: true
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 250m
            memory: 256Mi
      volumes:
      - name: volume-serving-cert
        secret:
          secretName: custom-metrics-apiserver-certs
      - name: config
        configMap:
          name: adapter-config
---
apiVersion: v1
kind: Service
metadata:
  name: custom-metrics-apiserver
  namespace: monitoring
spec:
  ports:
  - name: https
    port: 443
    targetPort: 6443
  selector:
    app: custom-metrics-apiserver
EOF

    log_success "Custom Metrics Server deployed"
else
    log_warning "Monitoring stack not found - HPA will use CPU/Memory only"
    log_warning "Deploy monitoring first: ./k8s/monitoring/deploy-monitoring.sh"
fi

# 7. Core Services deployen
log_step "🔧 Deploying core services..."

log_step "Deploying PostgreSQL..."
kubectl apply -f k8s/postgres.yaml
log_step "⏳ Waiting for PostgreSQL..."
kubectl wait --for=condition=available deployment/postgres -n loopit-dev --timeout=120s

log_step "Deploying Backend with HPA..."
kubectl apply -f k8s/backend.yaml
log_step "⏳ Waiting for Backend..."
kubectl wait --for=condition=available deployment/backend -n loopit-dev --timeout=180s

log_step "Deploying Frontend with HPA..."
kubectl apply -f k8s/frontend.yaml
log_step "⏳ Waiting for Frontend..."
kubectl wait --for=condition=available deployment/frontend -n loopit-dev --timeout=120s

log_step "Deploying Ingress..."
kubectl apply -f k8s/ingress.yaml

# 8. Status anzeigen
log_success "🎉 Loop-It Production Deployment Complete!"
echo ""
echo -e "${PURPLE}📊 Production Status:${NC}"
echo ""
echo "🚀 Services:"
kubectl get services -n loopit-dev
echo ""
echo "📦 Pods:"
kubectl get pods -n loopit-dev
echo ""
echo "📈 HPA Status:"
kubectl get hpa -n loopit-dev
echo ""
echo "🛡️ Pod Disruption Budgets:"
kubectl get pdb -n loopit-dev
echo ""
echo -e "${PURPLE}🌐 Access URLs:${NC}"
echo "Frontend: http://localhost/"
echo "Backend Health: http://localhost/api/health"
echo "Backend Metrics: http://localhost/api/metrics"
if kubectl get namespace monitoring &> /dev/null; then
    echo "Grafana: http://monitoring.localhost/"
    echo "Prometheus: http://prometheus.localhost/"
fi
echo ""
echo -e "${PURPLE}🔧 Useful Commands:${NC}"
echo "# Monitor HPA scaling:"
echo "kubectl get hpa -n loopit-dev -w"
echo ""
echo "# View pod scaling:"
echo "kubectl get pods -n loopit-dev -w"
echo ""
echo "# Load test (if available):"
echo "for i in {1..100}; do curl -s http://localhost/api/health > /dev/null; done"
echo ""
echo "# Check custom metrics (if monitoring deployed):"
echo "kubectl get --raw '/apis/custom.metrics.k8s.io/v1beta1' | jq ."

# 9. Gesundheitscheck
log_step "🏥 Health Check..."
sleep 10
if curl -s http://localhost/api/health > /dev/null; then
    log_success "Backend is healthy!"
else
    log_warning "Backend not yet accessible - may need a moment to start"
fi

log_success "Deployment script completed!"