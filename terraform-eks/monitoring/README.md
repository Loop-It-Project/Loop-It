# Monitoring Stack Architektur – Dokumentation

## Überblick

Das Monitoring-System ist ein modularer Terraform-Stack und bietet vollständige Observability für das Loop-It EKS-Projekt.

---

## Architektur-Entscheidungen

### 1. Modulare Struktur statt Monolith

```text
terraform-eks/
├── monitoring/              # Separates Monitoring-Modul
│   ├── main.tf             # Namespace + Shared Resources
│   ├── prometheus.tf       # Metrics Collection
│   ├── grafana.tf          # Dashboards + Visualization
│   ├── loki.tf             # Log Aggregation
│   ├── ingress.tf          # Routing + URLs
│   ├── variables.tf        # Configuration
│   └── outputs.tf          # Status + URLs
└── monitoring-module.tf    # Module Integration
```

**Warum modular?**

- Wartbarkeit: Max 250 Zeilen pro Datei statt 1100+ Zeilen Monolith
- Team-Kollaboration: Keine Merge-Konflikte bei paralleler Entwicklung
- Separation of Concerns: Jeder Service in eigener Datei
- Wiederverwendbarkeit: Monitoring-Modul für andere Projekte nutzbar

### 2. Namespace-Separation

```text
EKS Cluster: loop-it-cluster
├── namespace: loop-it          # Applications
│   ├── backend                 # Node.js API
│   ├── frontend                # React App
│   └── postgres                # Database
└── namespace: monitoring       # Observability Stack
    ├── prometheus              # Metrics
    ├── grafana                 # Dashboards
    ├── loki                    # Logs
    └── promtail                # Log Collector
```

**Vorteile:**

- Security: RBAC-Isolation zwischen Apps und Monitoring
- Resource Management: Separate Limits/Quotas
- Lifecycle: Monitoring Updates unabhängig von Apps
- Clean URLs: monitoring.localhost, prometheus.localhost

---

## Stack-Komponenten im Detail

### 3. Prometheus (Metrics Collection)

**Datei:** `monitoring/prometheus.tf`

- Service Discovery für Backend
- Cross-Namespace Scraping (loop-it → monitoring)
- RBAC: ClusterRole für Kubernetes API Access
- Persistent Storage: 10Gi GP3 EBS
- Retention: 7 Tage

**Service Discovery Konfiguration:**

```yaml
scrape_configs:
  - job_name: "loop-it-backend-direct"
    static_configs:
      - targets: ["backend.loop-it.svc.cluster.local:3000"]

  - job_name: "kubernetes-services"
    kubernetes_sd_configs:
      - role: service
        namespaces: [loop-it, default]
```

### 4. Grafana (Visualization)

**Datei:** `monitoring/grafana.tf`

- Auto-Datasource: Prometheus + Loki
- Admin-Credentials via Kubernetes Secrets
- Clean URLs: monitoring.localhost
- Persistent Dashboards: 2Gi Storage
- Security: Non-root container, dropped capabilities

**Automatische Datasource-Konfiguration:**

```yaml
datasources:
  - name: Prometheus
    url: http://prometheus.monitoring.svc.cluster.local:9090
    isDefault: true
  - name: Loki
    url: http://loki.monitoring.svc.cluster.local:3100
```

### 5. Loki + Promtail (Log Aggregation)

**Datei:** `monitoring/loki.tf`

- Log Storage: 5Gi GP3 EBS, 7 Tage Retention
- Schema v13 mit TSDB für Performance
- JSON Log Parsing für Backend-Logs
- Promtail DaemonSet für Pod-Log-Collection

**Backend-spezifisches Log-Parsing:**

```yaml
pipeline_stages:
  - cri: {}
  - match:
      selector: '{app="backend"}'
      stages:
        - json:
            expressions:
              level: level
              method: method
              status: status
```

### 6. Ingress + Routing

**Datei:** `monitoring/ingress.tf`

- Clean URLs ohne Port-Forwarding
- NGINX Ingress Integration
- CORS + Backend-Protocol Configuration

**URL-Schema:**

```
http://monitoring.localhost/   → Grafana
http://prometheus.localhost/   → Prometheus
http://loki.localhost/         → Loki
```

---

## Infrastructure as Code Integration

### 7. Module Integration

**Datei:** `monitoring-module.tf`

```hcl
module "monitoring" {
  source = "./monitoring"
  # Dependencies von Parent-Modul
  eks_cluster_name = module.eks.cluster_name
  kubernetes_namespace_loop_it = kubernetes_namespace.loop_it[0]
  # Configuration Variables
  enable_monitoring = var.enable_monitoring
  grafana_admin_password = var.grafana_admin_password
  # Storage + Retention Settings
  prometheus_storage_size = var.prometheus_storage_size
  prometheus_retention_time = var.prometheus_retention_time
}
```

### 8. Variable-Management

**Hauptkonfiguration via `terraform.tfvars`:**

```hcl
enable_monitoring = true
grafana_admin_password = "SecurePassword"
monitoring_domain = "monitoring.localhost"
```

**Secrets via `secrets.tfvars` (nicht in Git):**

```hcl
grafana_admin_user = "admin"
grafana_secret_key = "32-char-secret"
```

---

## Production-Ready Features

### 9. Security Context

Alle Container laufen non-root:

```hcl
security_context {
  run_as_non_root = true
  run_as_user = 472  # grafana
  allow_privilege_escalation = false
  capabilities { drop = ["ALL"] }
}
```

### 10. Resource Management

Definierte Limits für alle Services:

```hcl
resources {
  requests = { cpu = "100m", memory = "128Mi" }
  limits   = { cpu = "500m", memory = "512Mi" }
}
```

### 11. Health Checks

Liveness + Readiness Probes:

```hcl
liveness_probe {
  http_get { path = "/api/health", port = 3000 }
}
readiness_probe {
  http_get { path = "/-/ready", port = 9090 }
}
```

---

## Deployment-Workflow

### 12. Automated Deployment

Single Command Deployment:

```bash
terraform apply \
  -var="enable_monitoring=true" \
  -var-file="secrets.tfvars"
```

**Ergebnis:**

- ✅ EKS Cluster + Apps
- ✅ Complete Monitoring Stack
- ✅ Cross-Namespace Service Discovery
- ✅ Clean URLs ohne Port-Forwarding

### 13. Backend Integration

Automatische Prometheus Annotations:

```hcl
resource "kubernetes_annotations" "backend_prometheus" {
  api_version = "v1"
  kind        = "Service"
  metadata {
    name      = "backend"
    namespace = "loop-it"
  }
  annotations = {
    "prometheus.io/scrape" = "true"
    "prometheus.io/port"   = "3000"
    "prometheus.io/path"   = "/metrics"
  }
}
```

---

## Demo-Ready Features

### 14. Observability Stack

- **Metrics:** Prometheus scrapt Backend automatisch
- **Dashboards:** Grafana mit vorkonfigurierten Datasources
- **Logs:** Loki sammelt alle Pod-Logs mit JSON-Parsing
- **URLs:** Clean Browser-Access ohne kubectl port-forward

### 15. Load Testing Integration

Für Live-Demo vorbereitet:

```bash
artillery run stress-test.yml --target http://$(LB_URL)
# Monitoring zeigt Live-Metrics während Load Test
```

---

## Lessons Learned

### 16. Terraform Best Practices

- Modulare Struktur reduziert Komplexität erheblich
- Variable Management trennt Config von Secrets
- Dependencies via depends_on für korrektes Deployment
- Output Management für Demo + Debugging

### 17. Kubernetes Patterns

- Namespace-Separation für Security + Lifecycle
- Service Discovery für Cross-Namespace Communication
- RBAC mit minimalen Permissions
- Persistent Storage für Production-Daten

---

Die Lösung stellt einen **production-ready Observability-Stack** dar, der vollständig via Infrastructure as Code verwaltet wird und eine saubere Demo-Erfahrung bietet.
