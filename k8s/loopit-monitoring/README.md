# Loop-It Monitoring Helm Chart - Installation Guide

## 📁 Chart Structure

```
loopit-monitoring/
├── Chart.yaml                    # Chart metadata
├── values.yaml                   # Default configuration
├── templates/
│   ├── _helpers.tpl              # Template helpers
│   ├── namespace.yaml            # Namespace creation
│   ├── rbac.yaml                 # ServiceAccounts, ClusterRoles, Bindings
│   ├── prometheus.yaml           # Prometheus deployment, service, config
│   ├── grafana.yaml              # Grafana deployment, service, secrets
│   ├── loki.yaml                 # Loki deployment, service, config
│   ├── promtail.yaml             # Promtail DaemonSet
│   ├── ingress.yaml              # Ingress routing + backend annotation job
│   └── NOTES.txt                 # Post-install instructions
└── README.md                     # This guide
```

## 🚀 Quick Start

### 1. Setup Chart Directory

```bash
# Create chart directory structure
mkdir -p loopit-monitoring/templates

# Copy all chart files to respective locations
# Chart.yaml → loopit-monitoring/
# values.yaml → loopit-monitoring/
# templates/*.yaml → loopit-monitoring/templates/
```

### 2. Basic Installation

```bash
# Install with default values
helm install monitoring ./loopit-monitoring

# Install in specific namespace
helm install monitoring ./loopit-monitoring -n monitoring --create-namespace
```

### 3. Custom Installation

```bash
# Create custom values file
cp loopit-monitoring/values.yaml my-values.yaml

# Edit passwords and settings
nano my-values.yaml

# Install with custom values
helm install monitoring ./loopit-monitoring -f my-values.yaml
```

## 🔧 Configuration Options

### Basic Configuration

```yaml
# my-values.yaml
grafana:
  admin:
    password: "my-secure-password"
  server:
    domain: "grafana.my-domain.com"

prometheus:
  retention: "14d"
  storageSize: "20Gi"

ingress:
  hosts:
    grafana: "grafana.my-domain.com"
    prometheus: "prometheus.my-domain.com"
```

### Component Enable/Disable

```yaml
# Disable specific components
prometheus:
  enabled: true
grafana:
  enabled: true
loki:
  enabled: false  # Disable Loki
promtail:
  enabled: false  # Disable Promtail
```

### Backend Integration

```yaml
# Configure your backend services
backend:
  autoAnnotate: true
  services:
    - name: my-backend-service
      namespace: production
      port: 8080
      path: /metrics
```

### Storage Configuration

```yaml
persistence:
  enabled: true
  prometheus:
    size: "50Gi"
    storageClass: "fast-ssd"
  grafana:
    size: "5Gi"
```

## 📋 Installation Examples

### Development Environment

```bash
# Minimal setup for development
helm install dev-monitoring ./loopit-monitoring \
  --set grafana.admin.password=dev123 \
  --set prometheus.storageSize=5Gi \
  --set loki.storageSize=2Gi
```

### Production Environment

```bash
# Production-ready setup
helm install prod-monitoring ./loopit-monitoring \
  -f prod-values.yaml \
  --set grafana.admin.password="${GRAFANA_PASSWORD}" \
  --set ingress.hosts.grafana=grafana.company.com
```

### Testing/CI Environment

```bash
# Minimal resources for testing
helm install test-monitoring ./loopit-monitoring \
  --set persistence.enabled=false \
  --set prometheus.resources.limits.memory=512Mi \
  --set grafana.resources.limits.memory=256Mi
```

## 🔄 Upgrade & Management

### Upgrade Chart

```bash
# Upgrade with new values
helm upgrade monitoring ./loopit-monitoring -f my-values.yaml

# Upgrade specific setting
helm upgrade monitoring ./loopit-monitoring \
  --set grafana.admin.password=new-password
```

### Check Status

```bash
# Check deployment status
helm status monitoring

# List all releases
helm list

# Get values
helm get values monitoring
```

### Rollback

```bash
# Rollback to previous version
helm rollback monitoring

# Rollback to specific revision
helm rollback monitoring 2
```

## 🧹 Cleanup

```bash
# Uninstall chart
helm uninstall monitoring

# Uninstall with namespace cleanup
helm uninstall monitoring -n monitoring
kubectl delete namespace monitoring
```

## 🔍 Troubleshooting

### Common Issues

**Chart validation errors:**
```bash
# Validate chart before install
helm lint ./loopit-monitoring

# Dry-run installation
helm install monitoring ./loopit-monitoring --dry-run --debug
```

**Values not applying:**
```bash
# Check computed values
helm get values monitoring --all

# Template debugging
helm template monitoring ./loopit-monitoring -f my-values.yaml
```

**Pods not starting:**
```bash
# Check pod status
kubectl get pods -n monitoring

# Check logs
kubectl logs -l app=prometheus -n monitoring
kubectl describe pod prometheus-xxx -n monitoring
```

### Debug Templates

```bash
# Generate manifests without installing
helm template monitoring ./loopit-monitoring -f my-values.yaml > debug.yaml

# Check specific template
helm template monitoring ./loopit-monitoring -s templates/prometheus.yaml
```

## 🔐 Security Best Practices

### Secret Management

```yaml
# Use external secrets
grafana:
  admin:
    existingSecret: "grafana-admin-secret"
    existingSecretPasswordKey: "password"
```

### RBAC Configuration

```yaml
# Minimal RBAC permissions
rbac:
  create: true
  prometheus:
    clusterRole:
      rules:
        - apiGroups: [""]
          resources: ["services", "endpoints", "pods"]
          verbs: ["get", "list", "watch"]
```

### Network Policies

```yaml
# Add network policies (not included in chart)
# Create separate NetworkPolicy resources
```

## 📊 Monitoring Integration

### Custom Dashboards

```bash
# Add dashboards to Grafana
kubectl create configmap custom-dashboard \
  --from-file=dashboard.json \
  -n monitoring

# Label for auto-discovery
kubectl label configmap custom-dashboard \
  grafana_dashboard=1 -n monitoring
```

### Backend Metrics Integration

```yaml
# Configure backend service for scraping
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
    prometheus.io/path: "/metrics"
```

## 🌐 Advanced Configurations

### Multi-Environment Setup

```bash
# Development
helm install dev-monitoring ./loopit-monitoring \
  -f values-dev.yaml -n monitoring-dev

# Staging  
helm install staging-monitoring ./loopit-monitoring \
  -f values-staging.yaml -n monitoring-staging

# Production
helm install prod-monitoring ./loopit-monitoring \
  -f values-prod.yaml -n monitoring-prod
```

### External Data Sources

```yaml
# Connect to external Prometheus
grafana:
  datasources:
    prometheus:
      url: "https://external-prometheus.company.com"
```

### Custom Ingress

```yaml
# Use existing ingress controller
ingress:
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  tls:
    - secretName: monitoring-tls
      hosts:
        - grafana.company.com
```

## 📚 Migration from Bash Scripts

### Convert Environment Variables

```bash
# Old .env.monitoring
GRAFANA_ADMIN_PASSWORD=secret123

# New values.yaml
grafana:
  admin:
    password: "secret123"
```

### Port Forward Replacement

```bash
# Old: Manual port forwarding
kubectl port-forward service/grafana 3000:3000

# New: Ingress access
# http://monitoring.localhost/
```

### Namespace Management

```bash
# Old: Manual namespace creation
kubectl create namespace monitoring

# New: Automatic via Helm
# Namespace created automatically
```

## 🎯 Best Practices

1. **Always use custom values files** for environment-specific configuration
2. **Version control your values files** alongside your application code
3. **Use secrets management** for sensitive data (passwords, tokens)
4. **Test chart changes** with `--dry-run` before applying
5. **Monitor resource usage** and adjust limits accordingly
6. **Regular backups** of persistent volumes
7. **Use specific image tags** instead of `latest` in production

## 🔄 Migration Guide from Bash Scripts

### Step 1: Backup Current Setup

```bash
# Export current configurations
kubectl get all -n monitoring -o yaml > backup-monitoring.yaml
kubectl get secrets,configmaps -n monitoring -o yaml > backup-configs.yaml
```

### Step 2: Extract Configuration

```bash
# Create values file from existing setup
cat > migration-values.yaml << 'EOF'
grafana:
  admin:
    password: "YOUR_CURRENT_PASSWORD"  # From existing secret
prometheus:
  retention: "7d"  # From current config
  storageSize: "10Gi"  # From current PVC
# ... other settings
EOF
```

### Step 3: Deploy Helm Chart

```bash
# Install chart alongside existing (different namespace for testing)
helm install monitoring-helm ./loopit-monitoring \
  -f migration-values.yaml \
  -n monitoring-helm --create-namespace

# Verify everything works
curl http://monitoring.localhost/
```

### Step 4: Data Migration (if needed)

```bash
# Backup Grafana dashboards
kubectl exec deployment/grafana -n monitoring -- \
  tar czf - /var/lib/grafana | kubectl exec -i deployment/monitoring-helm-grafana -n monitoring-helm -- \
  tar xzf - -C /

# Backup Prometheus data (optional - metrics will rebuild)
# Usually not necessary as data is time-series
```

### Step 5: Switch Over

```bash
# Remove old setup
./k8s/monitoring/cleanup-monitoring.sh

# Install in original namespace
helm install monitoring ./loopit-monitoring \
  -f migration-values.yaml \
  -n monitoring --create-namespace
```

## 🚨 Troubleshooting Guide

### Chart Validation Issues

```bash
# Problem: Template errors
# Solution: Validate chart structure
helm lint ./loopit-monitoring

# Problem: Values validation
# Solution: Check required values
helm template ./loopit-monitoring --debug
```

### Resource Issues

```bash
# Problem: Pods pending
kubectl describe pod prometheus-xxx -n monitoring
# Check: Resource requests, PVC availability, node capacity

# Problem: Out of disk space
kubectl get pvc -n monitoring
# Solution: Increase storage size in values.yaml
```

### Network Issues

```bash
# Problem: Ingress not working
kubectl get ingress -n monitoring
kubectl describe ingress monitoring-ingress -n monitoring

# Problem: Service discovery not working
# Check: RBAC permissions, service annotations
```

### Backend Integration Issues

```bash
# Problem: Backend not scraped by Prometheus
# Check: Service annotations
kubectl get service backend -o yaml | grep prometheus

# Problem: No metrics endpoint
curl http://backend-service:3000/metrics
```

## 📈 Scaling Considerations

### Horizontal Scaling

```yaml
# Scale Prometheus (not recommended - use federation)
prometheus:
  replicas: 1  # Keep at 1 for single-node

# Scale Grafana (session affinity needed)
grafana:
  replicas: 2
  sessionAffinity: true
```

### Vertical Scaling

```yaml
# Increase resources for large environments
prometheus:
  resources:
    requests:
      memory: "2Gi"
      cpu: "500m"
    limits:
      memory: "4Gi"
      cpu: "2000m"
  
  storageSize: "100Gi"
  retention: "30d"
```

### Storage Scaling

```yaml
# Use high-performance storage
persistence:
  prometheus:
    storageClass: "fast-ssd"
    size: "500Gi"
  
  # Enable backup/restore
  backup:
    enabled: true
    schedule: "0 2 * * *"
```

## 🎨 Customization Examples

### Custom Prometheus Rules

```yaml
# values.yaml
prometheus:
  additionalRules:
    - name: loop-it-alerts
      rules:
        - alert: HighErrorRate
          expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
          annotations:
            summary: "High error rate detected"
```

### Custom Grafana Plugins

```yaml
# values.yaml
grafana:
  plugins:
    install:
      - grafana-clock-panel
      - grafana-piechart-panel
      - grafana-worldmap-panel
```

### Custom Log Processing

```yaml
# values.yaml
promtail:
  config:
    additionalPipelines:
      - name: custom-parsing
        stages:
          - regex:
              expression: '(?P<timestamp>\d{4}-\d{2}-\d{2}.*)'
          - timestamp:
              source: timestamp
              format: RFC3339
```

## 🔗 Integration Examples

### CI/CD Integration

```yaml
# .github/workflows/monitoring.yml
name: Deploy Monitoring
on:
  push:
    paths: ['monitoring/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Monitoring
        run: |
          helm upgrade --install monitoring ./loopit-monitoring \
            -f values-prod.yaml \
            --set grafana.admin.password="${{ secrets.GRAFANA_PASSWORD }}"
```

### GitOps Integration (ArgoCD)

```yaml
# application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: monitoring
spec:
  source:
    repoURL: https://github.com/Loop-It-Project/Loop-It
    path: k8s/helm-charts/loopit-monitoring
    helm:
      valueFiles:
        - values-prod.yaml
```

### Backup Integration

```yaml
# values.yaml
backup:
  enabled: true
  storage:
    type: s3
    s3:
      bucket: monitoring-backups
      region: us-west-2
  schedule: "0 2 * * *"
```

## 📊 Monitoring the Monitor

### Self-Monitoring

```yaml
# Monitor the monitoring stack itself
prometheus:
  selfMonitoring: true
  
grafana:
  serviceMonitor:
    enabled: true

# Create alerts for monitoring stack health
alerts:
  monitoring:
    - name: PrometheusDown
      expr: up{job="prometheus"} == 0
    - name: GrafanaDown  
      expr: up{job="grafana"} == 0
```

### Health Checks

```bash
# Automated health check script
#!/bin/bash
# health-check.sh

echo "Checking monitoring stack health..."

# Check all pods
kubectl get pods -n monitoring | grep -v Running && exit 1

# Check Prometheus targets
curl -s http://prometheus.localhost/api/v1/query?query=up | jq '.data.result[] | select(.value[1] == "0")'

# Check Grafana API
curl -s http://monitoring.localhost/api/health | jq '.database'

echo "All monitoring components healthy!"
```

## 🔧 Advanced Helm Features

### Hooks and Tests

```yaml
# templates/tests/
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "loopit-monitoring.fullname" . }}-test
  annotations:
    "helm.sh/hook": test
spec:
  containers:
  - name: test
    image: curlimages/curl
    command: ['curl']
    args: ['http://{{ include "loopit-monitoring.fullname" . }}-grafana:3000/api/health']
```

### Conditional Resources

```yaml
# Only create ingress if enabled
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
# ...
{{- end }}
```

### Subcharts

```yaml
# Chart.yaml dependencies
dependencies:
  - name: postgresql
    version: "11.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
```

## 📝 Chart Documentation

### Generating Documentation

```bash
# Use helm-docs to generate README
helm-docs ./loopit-monitoring

# Or create manually
cat > loopit-monitoring/README.md << 'EOF'
# Loop-It Monitoring Helm Chart
[Include all important information]
EOF
```

### Values Documentation

```yaml
# values.yaml with comments
## @section Global parameters
## Global Docker image parameters
global:
  ## @param global.imageRegistry Global Docker image registry
  imageRegistry: ""
  
## @section Prometheus configuration  
## Prometheus parameters
prometheus:
  ## @param prometheus.enabled Enable Prometheus
  enabled: true
```

This completes the comprehensive Helm chart conversion! The chart provides:

✅ **Full templatization** of your existing YAML files
✅ **Configurable values** replacing environment variables  
✅ **Proper RBAC** with service accounts and cluster roles
✅ **Automated backend annotation** via Helm hooks
✅ **Health checks and probes** templated from values
✅ **Resource management** and security contexts
✅ **Installation notes** with access URLs
✅ **Migration guide** from bash scripts

You can now deploy with:
```bash
helm install monitoring ./loopit-monitoring -f my-values.yaml
```

Instead of running bash scripts! 🚀