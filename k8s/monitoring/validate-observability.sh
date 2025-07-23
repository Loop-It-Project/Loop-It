#!/bin/bash

echo "🔍 Validating Observability Stack Integration"
echo "============================================"

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# 1. Backend Service Annotations prüfen
log_info "Checking Backend Service Annotations..."
PROMETHEUS_PATH=$(kubectl get service backend -n loopit-dev -o jsonpath='{.metadata.annotations.prometheus\.io/path}' 2>/dev/null)
if [ "$PROMETHEUS_PATH" = "/metrics" ]; then
    log_success "Backend Service Annotations korrekt"
else
    log_error "Backend Service Annotations falsch: $PROMETHEUS_PATH (sollte /metrics sein)"
fi

# 2. Backend Metrics Endpoint testen
log_info "Testing Backend Metrics Endpoint..."
kubectl port-forward service/backend 3000:3000 -n loopit-dev >/dev/null 2>&1 &
PORT_FORWARD_PID=$!
sleep 3

if curl -s http://localhost:3000/metrics | grep -q "http_requests_total"; then
    log_success "Backend Metrics Endpoint funktioniert"
else
    log_error "Backend Metrics Endpoint nicht erreichbar"
fi

kill $PORT_FORWARD_PID 2>/dev/null

# 3. Prometheus Targets prüfen
log_info "Checking Prometheus Targets..."
TARGETS_UP=$(kubectl exec -n monitoring deployment/prometheus -- \
    wget -qO- "http://localhost:9090/api/v1/targets" 2>/dev/null | \
    grep -o '"health":"up"' | wc -l)

if [ "$TARGETS_UP" -gt 0 ]; then
    log_success "Prometheus hat $TARGETS_UP aktive Targets"
else
    log_warning "Prometheus Targets nicht verfügbar"
fi

# 4. Custom Metrics API prüfen
log_info "Checking Custom Metrics API..."
if kubectl get --raw '/apis/custom.metrics.k8s.io/v1beta1' >/dev/null 2>&1; then
    log_success "Custom Metrics API verfügbar"
    
    # Available Metrics auflisten
    CUSTOM_METRICS=$(kubectl get --raw '/apis/custom.metrics.k8s.io/v1beta1' 2>/dev/null | \
        grep -o '"name":"[^"]*"' | wc -l)
    log_info "Custom Metrics verfügbar: $CUSTOM_METRICS"
else
    log_warning "Custom Metrics API nicht verfügbar (HPA nutzt nur CPU/Memory)"
fi

# 5. HPA Status prüfen
log_info "Checking HPA Status..."
HPA_COUNT=$(kubectl get hpa -n loopit-dev --no-headers 2>/dev/null | wc -l)
if [ "$HPA_COUNT" -gt 0 ]; then
    log_success "HPA aktiv: $HPA_COUNT Autoscaler"
    kubectl get hpa -n loopit-dev
else
    log_error "Keine HPA gefunden"
fi

# 6. Monitoring Stack Health
log_info "Checking Monitoring Stack Health..."
MONITORING_PODS_READY=$(kubectl get pods -n monitoring --no-headers 2>/dev/null | \
    grep -c "1/1.*Running")
MONITORING_PODS_TOTAL=$(kubectl get pods -n monitoring --no-headers 2>/dev/null | wc -l)

if [ "$MONITORING_PODS_READY" -eq "$MONITORING_PODS_TOTAL" ] && [ "$MONITORING_PODS_TOTAL" -gt 0 ]; then
    log_success "Monitoring Stack healthy: $MONITORING_PODS_READY/$MONITORING_PODS_TOTAL Pods ready"
else
    log_warning "Monitoring Stack incomplete: $MONITORING_PODS_READY/$MONITORING_PODS_TOTAL Pods ready"
fi

echo ""
echo "🌐 Monitoring URLs:"
echo "  Grafana:    http://monitoring.localhost/"
echo "  Prometheus: http://prometheus.localhost/"
echo "  Backend:    http://localhost/api/health"
echo ""
echo "🔧 Test Commands:"
echo "  HPA Status: kubectl get hpa -n loopit-dev"
echo "  Load Test:  artillery run k8s/load-testing/stress-test.yml"
echo "  Metrics:    curl http://localhost:3000/metrics"

echo ""
if [ "$PROMETHEUS_PATH" = "/metrics" ] && [ "$HPA_COUNT" -gt 0 ] && [ "$MONITORING_PODS_READY" -gt 2 ]; then
    log_success "🎉 Observability Stack vollständig konfiguriert!"
else
    log_warning "⚠️  Observability Stack teilweise konfiguriert - siehe Details oben"
fi