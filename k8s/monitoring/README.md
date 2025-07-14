# Loop-It Kubernetes Monitoring Stack

Ein vollständiger Observability-Stack für Loop-It auf Kubernetes mit Prometheus, Grafana, Loki und Promtail.

## 🚀 Quick Start

```bash
# 1. Stelle sicher, dass Loop-It läuft
./k8s/deploy.sh

# 2. Deploye Monitoring-Stack
./k8s/monitoring/deploy-monitoring.sh

# 3. Öffne Grafana
open http://localhost/monitoring/
# Login: admin / admin
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

## 🏗️ Komponenten

### Prometheus (Metriken-Sammlung)
- **Port**: 9090
- **Namespace**: monitoring
- **Storage**: 10Gi PVC
- **Retention**: 7 Tage
- **Scraping**: Kubernetes Service Discovery

### Grafana (Visualisierung)
- **Port**: 3000 (über Ingress)
- **URL**: http://localhost/monitoring/
- **Login**: admin / admin
- **Storage**: 2Gi PVC
- **Data Sources**: Prometheus + Loki

### Loki (Log-Aggregation)
- **Port**: 3100
- **Storage**: 5Gi PVC
- **Retention**: 7 Tage
- **Schema**: v13 mit TSDB

### Promtail (Log-Sammlung)
- **Deployment**: DaemonSet
- **Sources**: Kubernetes Pod Logs
- **Processing**: CRI + JSON parsing

## 🛠️ Deployment

### Voraussetzungen
- Kubernetes Cluster (Docker Desktop)
- NGINX Ingress Controller
- Loop-It Backend läuft

### Installation
```bash
# 1. Loop-It deployen (falls noch nicht geschehen)
./k8s/deploy.sh

# 2. Monitoring-Stack deployen
cd k8s/monitoring
./deploy-monitoring.sh
```

### Manuelle Installation
```bash
# Namespace
kubectl apply -f k8s/monitoring/namespace.yaml

# Prometheus
kubectl apply -f k8s/monitoring/prometheus.yaml

# Loki
kubectl apply -f k8s/monitoring/loki.yaml

# Grafana
kubectl apply -f k8s/monitoring/grafana.yaml

# Promtail
kubectl apply -f k8s/monitoring/promtail.yaml

# Ingress
kubectl apply -f k8s/monitoring/ingress.yaml
```

## 🔧 Konfiguration

### Backend-Metrics aktivieren

Das Backend muss einen `/metrics` Endpoint implementieren:

```typescript
// src/middleware/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode.toString()
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route: route
    }, duration);
  });
  
  next();
};

export const getMetrics = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
```

```typescript
// src/server.ts
import { metricsMiddleware, getMetrics } from './middleware/metrics';

app.use(metricsMiddleware);
app.get('/metrics', getMetrics);
app.get('/api/ready', (req, res) => res.status(200).json({ status: 'ready' }));
```

### Erweiterte Backend-Konfiguration
```bash
# Backend mit Monitoring-Support aktualisieren
kubectl apply -f k8s/backend-monitoring-update.yaml
```

## 🌐 Zugriff

### URLs
| Service | URL | Beschreibung |
|---------|-----|--------------|
| Grafana | http://localhost/monitoring/ | Dashboards und Visualisierung |
| Prometheus | http://localhost/prometheus/ | Metriken und Alerting |
| Loki | http://localhost/loki/ | Log-Aggregation API |
| Backend Metrics | http://localhost/api/metrics | Backend Prometheus Metriken |

### Alternative URLs (mit monitoring.localhost)
```bash
# /etc/hosts hinzufügen:
127.0.0.1 monitoring.localhost

# URLs:
http://monitoring.localhost/          # Grafana
http://monitoring.localhost/prometheus/  # Prometheus
```

## 📊 Verfügbare Metriken

### System-Metriken (automatisch)
- `process_cpu_user_seconds_total` - CPU-Zeit (User)
- `process_resident_memory_bytes` - RAM-Verbrauch
- `nodejs_heap_size_used_bytes` - Node.js Heap
- `nodejs_eventloop_lag_seconds` - Event Loop Latenz

### HTTP-Metriken (Backend)
- `http_requests_total` - Anzahl HTTP-Requests
- `http_request_duration_seconds` - Response-Zeit-Histogramm

### Kubernetes-Metriken
- API Server Metriken
- Node Metriken
- Pod Metriken

## 📝 Log-Management

### Log-Streams
- **Backend**: HTTP-Requests, Anwendungs-Logs
- **Kubernetes**: Pod-Events, System-Logs
- **Prometheus**: Scraping-Aktivität
- **Grafana**: User-Sessions, Plugin-Updates

### Log-Labels
- `namespace` - Kubernetes Namespace
- `pod` - Pod-Name
- `container` - Container-Name
- `app` - App-Label
- `level` - Log-Level (info, warn, error)

### Loki-Queries (Beispiele)
```bash
# Backend HTTP-Requests
{namespace="loopit-dev", app="backend"}

# Error-Logs
{namespace="loopit-dev"} |= "error" or |= "ERROR"

# JSON-Parsing
{app="backend"} | json | level="error"

# Zeitbereich
{app="backend"}[1h]
```

## 🎯 Prometheus-Queries

### Performance-Monitoring
```promql
# Request Rate
rate(http_requests_total[5m])

# Error Rate
rate(http_requests_total{status_code=~"4..|5.."}[5m])

# Response Time (95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Memory Usage
process_resident_memory_bytes / 1024 / 1024

# CPU Usage
rate(process_cpu_user_seconds_total[5m]) * 100
```

### Kubernetes-Monitoring
```promql
# Pod Restart Count
increase(kube_pod_container_status_restarts_total[1h])

# Node CPU Usage
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Node Memory Usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

## 📈 Grafana Dashboards

### Standard-Dashboards
1. **HTTP Overview** - Request Rate, Errors, Latenz
2. **System Resources** - CPU, Memory, Storage
3. **Kubernetes Overview** - Pods, Services, Ingress
4. **Logs Dashboard** - Live-Logs mit Filtering

### Dashboard-Import
```bash
# Kubernetes Dashboards (empfohlen)
# Dashboard ID 315 - Kubernetes cluster monitoring (via Prometheus)
# Dashboard ID 6417 - Kubernetes cluster monitoring (via Prometheus)
# Dashboard ID 1860 - Node Exporter Full
```

### Custom Dashboard Beispiel
```json
{
  "dashboard": {
    "title": "Loop-It Backend Monitoring",
    "panels": [
      {
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method)"
          }
        ]
      }
    ]
  }
}
```

## 🔍 Troubleshooting

### Status prüfen
```bash
# Alle Monitoring-Services
kubectl get all -n monitoring

# Pod-Logs anzeigen
kubectl logs -l app=prometheus -n monitoring
kubectl logs -l app=grafana -n monitoring
kubectl logs -l app=loki -n monitoring
kubectl logs -l app=promtail -n monitoring

# Ingress-Status
kubectl describe ingress monitoring-ingress -n monitoring
```

### Prometheus-Debugging
```bash
# Targets prüfen
kubectl port-forward service/prometheus 9090:9090 -n monitoring
curl http://localhost:9090/api/v1/targets

# Config reload
kubectl exec -it deployment/prometheus -n monitoring -- curl -X POST http://localhost:9090/-/reload
```

### Backend-Metrics prüfen
```bash
# Direkt vom Backend
kubectl port-forward service/backend 3000:3000 -n loopit-dev
curl http://localhost:3000/metrics

# Health Check
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready
```

### Häufige Probleme

**Prometheus kann Backend nicht scrapen:**
```bash
# Backend Service Annotations prüfen
kubectl get service backend -n loopit-dev -o yaml

# Backend /metrics Endpoint testen
kubectl exec -it deployment/backend -n loopit-dev -- curl http://localhost:3000/metrics
```

**Grafana zeigt keine Daten:**
```bash
# Prometheus Data Source testen
kubectl port-forward service/grafana 3001:3000 -n monitoring
# In Grafana: Configuration → Data Sources → Prometheus → Test
```

**Loki erhält keine Logs:**
```bash
# Promtail Status prüfen
kubectl logs -l app=promtail -n monitoring

# Loki API testen
kubectl port-forward service/loki 3100:3100 -n monitoring
curl http://localhost:3100/ready
```

## 🧹 Cleanup

```bash
# Vollständiger Cleanup
./k8s/monitoring/cleanup-monitoring.sh

# Oder manuell
kubectl delete namespace monitoring
kubectl delete clusterrole prometheus promtail
kubectl delete clusterrolebinding prometheus promtail
```

## 🔒 Sicherheit

### Best Practices
- **RBAC**: Minimale Permissions für Services
- **Network Policies**: Eingeschränkte Netzwerk-Kommunikation
- **Security Contexts**: Non-root User, Read-only Filesystems
- **Secrets Management**: Sichere Passwort-Verwaltung

### Produktions-Härtung
```bash
# Basic Auth für Monitoring (optional)
kubectl create secret generic monitoring-basic-auth \
  --from-literal=auth=$(htpasswd -nb monitoring secure_password) \
  -n monitoring

# TLS-Zertifikate für HTTPS
kubectl create secret tls monitoring-tls \
  --cert=monitoring.crt \
  --key=monitoring.key \
  -n monitoring
```

## 📚 Weiterführende Ressourcen

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Kubernetes Monitoring Guide](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-monitoring/)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## 🎯 Nächste Schritte

1. **Backend /metrics implementieren** - Prometheus-Metriken
2. **Custom Dashboards erstellen** - Business-spezifische Visualisierungen
3. **Alerting konfigurieren** - Kritische Schwellwerte definieren
4. **Log-Strukturierung** - JSON-Logging für bessere Auswertung
5. **Performance-Optimierung** - Resource-Limits anpassen
6. **Backup-Strategie** - Persistent Volume Backup
7. **Multi-Environment Setup** - Development/Staging/Production

## 💡 Tipps

- **Retention anpassen**: Verlängere Speicher-Dauer für Produktionsumgebung
- **Dashboard-Templates**: Nutze Community-Dashboards als Ausgangspunkt
- **Alerting-Regeln**: Starte mit einfachen Regeln und verfeinere sukzessive
- **Log-Aggregation**: Strukturiere Logs für bessere Suchbarkeit
- **Resource-Monitoring**: Überwache CPU/Memory-Verbrauch regelmäßig