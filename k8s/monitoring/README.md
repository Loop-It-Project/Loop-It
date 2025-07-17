# Loop-It Kubernetes Monitoring Stack

Ein vollständiger production-ready Observability-Stack für Loop-It auf Kubernetes mit Prometheus, Grafana, Loki und Promtail.

## 🚀 Quick Start

```bash
# 1. Stelle sicher, dass Loop-It läuft
./k8s/deploy.sh

# 2. Deploye Monitoring-Stack
./k8s/monitoring/deploy-monitoring.sh

# 3. Konfiguriere Hosts-Datei (einmalig)
echo "127.0.0.1 monitoring.localhost" >> /etc/hosts
echo "127.0.0.1 prometheus.localhost" >> /etc/hosts
echo "127.0.0.1 loki.localhost" >> /etc/hosts

# 4. Öffne Monitoring URLs
open http://monitoring.localhost/          # Grafana
open http://prometheus.localhost/          # Prometheus
open http://loki.localhost/                # Loki
```

## 📋 Architektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Loop-It       │    │   Prometheus    │    │    Grafana      │
│   Backend       │───▶│   (Metrics)     │───▶│ (Dashboards)    │
│   :3000/metrics │    │   :9090         │    │   :3000         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                            ▲
         │              ┌─────────────────┐          │
         └─────────────▶│      Loki       │──────────┘
                        │   (Logs)        │
                        │   :3100         │
                        └─────────────────┘
                                ▲
                        ┌─────────────────┐
                        │    Promtail     │
                        │ (Log Collector) │
                        │   DaemonSet     │
                        └─────────────────┘
```

## 🌐 Zugriff (Production-Ready URLs)

### Primäre URLs (ohne Port-Forwarding)
| Service | URL | Login |
|---------|-----|-------|
| Grafana | http://monitoring.localhost/ | admin / *aus .env* |
| Prometheus | http://prometheus.localhost/ | - |
| Loki | http://loki.localhost/ | - |

### Fallback URLs
| Service | URL | Beschreibung |
|---------|-----|--------------|
| Grafana | http://localhost/monitoring/ | Fallback wenn .localhost nicht funktioniert |
| Prometheus | http://localhost/prometheus/ | Fallback URL |
| Backend Metrics | http://localhost/api/metrics | Backend Prometheus Metriken |

## 🏗️ Komponenten

### Prometheus (Metriken-Sammlung)
- **URL**: prometheus.localhost
- **Namespace**: monitoring
- **Storage**: 10Gi PVC, 7 Tage Retention
- **Backend Scraping**: Automatisch über Service Discovery
- **RBAC**: Vollständige Kubernetes API Berechtigung

### Grafana (Visualisierung)
- **URL**: monitoring.localhost
- **Login**: admin / *aus k8s/monitoring/.env.monitoring*
- **Data Sources**: Prometheus + Loki (automatisch konfiguriert)
- **Domain**: monitoring.localhost (clean URLs)

### Loki (Log-Aggregation)
- **URL**: loki.localhost
- **Storage**: 5Gi PVC, 7 Tage Retention
- **Schema**: v13 mit TSDB

### Promtail (Log-Sammlung)
- **Deployment**: DaemonSet auf allen Nodes
- **Sources**: Kubernetes Pod Logs + Backend JSON-Parsing
- **Processing**: CRI + erweiterte Backend-Log-Strukturierung

## 🛠️ Deployment

### Voraussetzungen
- Kubernetes Cluster (Docker Desktop)
- NGINX Ingress Controller (wird automatisch installiert)
- Loop-It Backend läuft

### Installation
```bash
# 1. Environment-Datei erstellen (optional)
cp k8s/monitoring/.env.monitoring.example k8s/monitoring/.env.monitoring
# Passwörter anpassen

# 2. Monitoring-Stack deployen
./k8s/monitoring/deploy-monitoring.sh

# 3. Hosts-Datei konfigurieren (Windows als Administrator)
echo "127.0.0.1 monitoring.localhost" >> /c/Windows/System32/drivers/etc/hosts
echo "127.0.0.1 prometheus.localhost" >> /c/Windows/System32/drivers/etc/hosts
echo "127.0.0.1 loki.localhost" >> /c/Windows/System32/drivers/etc/hosts
```

### Automatische Features
- **Backend Service Discovery**: Findet automatisch backend/backend-service in default/loopit-dev
- **RBAC Setup**: ServiceAccount, ClusterRole, ClusterRoleBinding werden automatisch erstellt
- **Secret Management**: Grafana-Secrets aus .env.monitoring
- **Health Checks**: Liveness/Readiness Probes für alle Services
- **Ingress Configuration**: Saubere URLs ohne Redirect-Loops

## 🔧 Backend-Integration

### Metriken-Endpoint (bereits implementiert)
Das Backend stellt bereits einen `/metrics` Endpoint bereit:

```bash
# Test Backend-Metriken
curl http://localhost/api/metrics

# Erwartete Metriken:
# - http_requests_total
# - process_resident_memory_bytes  
# - nodejs_heap_size_used_bytes
# - http_request_duration_seconds
```

### Service-Annotation (automatisch)
Das Deploy-Script annotiert automatisch den Backend-Service:
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000" 
  prometheus.io/path: "/metrics"
```

## 📊 Verfügbare Metriken

### Backend-Metriken (bereits verfügbar)
- `http_requests_total{method,route,status_code}` - HTTP-Request-Counter
- `http_request_duration_seconds` - Response-Zeit-Histogramm
- `process_resident_memory_bytes` - Memory-Verbrauch
- `nodejs_heap_size_used_bytes` - Node.js Heap-Größe

### Prometheus-Queries (Ready-to-Use)
```promql
# Request Rate (letzte 5 Minuten)
rate(http_requests_total[5m])

# Error Rate
rate(http_requests_total{status_code=~"4..|5.."}[5m])

# Memory Usage in MB
process_resident_memory_bytes / 1024 / 1024

# 95th Percentile Response Time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## 🎯 Prometheus Targets

Das Setup scrapt automatisch:
- **Backend Direct**: `backend-service.default.svc.cluster.local:3000/metrics`
- **Backend Discovery**: Alle Services mit `prometheus.io/scrape=true`
- **Kubernetes Pods**: Pods mit Scraping-Annotations
- **Prometheus Self**: Prometheus eigene Metriken

Status prüfen: http://prometheus.localhost/ → Status → Targets

## 📝 Log-Management

### Log-Streams (automatisch konfiguriert)
- **Backend Logs**: JSON-strukturiert mit level, method, status
- **Monitoring Stack**: Prometheus, Grafana, Loki Logs
- **Kubernetes**: System-Events und Pod-Logs

### Loki-Queries (Beispiele)
```bash
# Backend HTTP-Requests
{namespace="loopit-dev", app="backend"}

# Error-Logs
{namespace="loopit-dev"} |= "error"

# Backend JSON-Logs mit Level-Filtering
{app="backend"} | json | level="error"
```

## 🔍 Troubleshooting

### Status prüfen
```bash
# Monitoring-Stack Status
kubectl get pods -n monitoring

# Alle sollten "Running" sein:
# prometheus-xxx  1/1 Running
# grafana-xxx     1/1 Running  
# loki-xxx        1/1 Running
```

### URLs testen
```bash
# Teste alle URLs
curl -I http://monitoring.localhost/
curl -I http://prometheus.localhost/
curl -I http://loki.localhost/

# Backend-Metriken
curl http://localhost/api/metrics | head -20
```

### Prometheus Targets prüfen
1. Öffne http://prometheus.localhost/
2. Gehe zu Status → Targets
3. Alle Targets sollten "UP" sein:
   - prometheus (localhost:9090)
   - loop-it-backend-direct (backend-service.default:3000)

### Häufige Probleme

**URLs nicht erreichbar:**
```bash
# Hosts-Datei prüfen
cat /etc/hosts | grep localhost

# Ingress Status prüfen  
kubectl get ingress -n monitoring
```

**Backend nicht gescrapt:**
```bash
# Service-Annotations prüfen
kubectl get service backend -n loopit-dev -o yaml | grep prometheus

# Backend /metrics direkt testen
kubectl port-forward service/backend 3000:3000 -n loopit-dev
curl http://localhost:3000/metrics
```

## 🧹 Cleanup

```bash
# Vollständiger sauberer Cleanup
./k8s/monitoring/cleanup-monitoring.sh

# Features:
# - Stoppt Port-Forwards
# - Löscht Namespace und alle Resources  
# - Entfernt RBAC (ClusterRole, ClusterRoleBinding)
# - Optional: Docker Images cleanup
# - Backend Service Annotations cleanup
```

## 🔒 Sicherheit & Best Practices

### Implementierte Sicherheitsfeatures
- **RBAC**: Minimale Kubernetes API Permissions
- **Security Contexts**: Non-root User, Read-only Filesystems  
- **Secret Management**: Passwörter in Kubernetes Secrets
- **Resource Limits**: CPU/Memory Limits für alle Pods
- **Health Checks**: Liveness/Readiness Probes

### Secret Management
```bash
# Passwörter in .env.monitoring konfigurieren
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-password
GRAFANA_SECRET_KEY=your-secret-key
```

## 📈 Nächste Schritte

1. **Grafana Dashboards erstellen**
   - HTTP Request Rate Dashboard
   - Backend Performance Monitoring
   - Error Rate Tracking

2. **Alerting konfigurieren**
   - High Error Rate Alerts
   - Memory/CPU Threshold Alerts
   - Backend Downtime Alerts

3. **Log-Strukturierung verbessern**
   - Erweiterte JSON-Logging im Backend
   - Request ID Tracking
   - Performance-Logging

4. **Production-Optimierung**
   - Retention-Zeiten für Prod-Umgebung verlängern
   - Backup-Strategie für Persistent Volumes
   - Multi-Environment Setup (Dev/Staging/Prod)