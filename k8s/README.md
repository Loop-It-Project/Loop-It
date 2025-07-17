# Loop-It Kubernetes Setup

Ein vollständiges production-ready Kubernetes-Setup für die Loop-It Anwendung mit Docker Desktop, NGINX Ingress Controller, Horizontal Pod Autoscaling und automatisiertem Deployment.

## 🚀 Quick Start

```bash
# 1. Repository clonen
git clone https://github.com/Loop-It-Project/Loop-It
cd Loop-It

# 2. Docker Desktop mit Kubernetes starten
# Settings → Kubernetes → Enable Kubernetes

# 3. Loop-It mit Production-Features deployen
./k8s/deploy.sh

# 4. Im Browser öffnen
open http://localhost
```

## 📋 Voraussetzungen

- **Docker Desktop** mit aktiviertem Kubernetes
- **Git Bash** oder Terminal
- **curl** für API-Tests
- **Mindestens 6GB RAM** für alle Services inkl. Auto-Scaling
- **Artillery** für Load Testing (optional): `npm install -g artillery`

### Docker Desktop Setup
1. Docker Desktop installieren
2. Settings → Kubernetes → "Enable Kubernetes" aktivieren
3. Warten bis Kubernetes läuft (grüner Punkt)

## 🏗️ Production-Ready Architektur

```
Internet → localhost:80
    ↓
NGINX Ingress Controller (Load Balancer)
    ↓
┌─────────────────────────────────────────────────┐
│              Kubernetes Cluster                │
│  ┌─────────────────┬─────────────────────────┐  │
│  │   Frontend      │       Backend           │  │
│  │   (React/Vite)  │      (Node.js)          │  │
│  │   2-10 Pods     │      2-20 Pods          │  │
│  │   Auto-Scaling  │      Auto-Scaling       │  │
│  │   Port 80       │      Port 3000          │  │
│  └─────────────────┴─────────────────────────┘  │
│              ↓                                  │
│         PostgreSQL                              │
│         Port 5432                               │
│         (Persistent Storage + PDB)              │
└─────────────────────────────────────────────────┘
```

### Production Services
- **Frontend**: React/Vite App (NGINX Container) mit HPA
- **Backend**: Node.js API Server mit HPA und Health Checks
- **PostgreSQL**: Datenbank mit persistentem Storage und Pod Disruption Budget
- **NGINX Ingress**: Production Load Balancer & Reverse Proxy
- **HPA**: Horizontal Pod Autoscaler für automatische Skalierung
- **PDB**: Pod Disruption Budgets für Zero-Downtime Updates

## 🚀 Production Features

### Horizontal Pod Autoscaling (HPA)
- **Backend**: Skaliert von 2-20 Pods basierend auf CPU (70%) und Memory (80%)
- **Frontend**: Skaliert von 2-10 Pods basierend auf CPU (60%) und Memory (70%)
- **Automatische Load-Verteilung** bei Traffic-Spitzen
- **Validiert mit Artillery Load Testing** bis 622 RPS

### Health Checks & Self-Healing
- **Startup Probes**: Optimierte Container-Startzeiten (60s statt 120s)
- **Liveness Probes**: Automatische Container-Restarts bei Problemen
- **Readiness Probes**: Traffic-Kontrolle für healthy Pods
- **Graceful Shutdown**: 30s Termination Grace Period

### Zero-Downtime Operations
- **Pod Disruption Budgets**: Garantierte 50% Backend-Verfügbarkeit während Updates
- **Rolling Updates**: Sanfte Deployments ohne Service-Unterbrechung
- **Load Balancer Integration**: Automatische healthy Pod-Erkennung

## 🗃️ Datenpersistenz & Storage

Die PostgreSQL-Datenbank speichert ihre Daten **persistent** mit einem `PersistentVolumeClaim`. Dadurch bleiben alle Nutzerdaten auch nach Pod-Restarts erhalten.

### 🔐 Speicherort der Daten
```bash
Container: /var/lib/postgresql/data
PVC: postgres-pvc (1Gi, ReadWriteOnce)
```

### 📦 Storage-Konfiguration
```yaml
# Automatisch erstellt beim Deployment
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: loopit-dev
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

## 🔧 Production Deployment

### Automatisches Deployment
```bash
# Production-ready Deployment mit allen Features
./k8s/deploy.sh
```

**Was passiert beim Deployment:**
1. ✅ NGINX Ingress Controller v1.13.0 installieren
2. 🔨 Docker Images bauen (Backend + Frontend)
3. 🧹 Clean Deployment (alte Pods entfernen)
4. 📦 Namespace + Secrets erstellen
5. 🗄️ PostgreSQL mit Persistent Storage deployen
6. 🚀 Backend mit HPA + Health Checks deployen
7. 🎨 Frontend mit HPA deployen
8. 🌐 NGINX Ingress konfigurieren
9. 📊 Production-Status anzeigen

### Erwartete Deployment-Zeit
- **Clean Deployment**: ~3-5 Minuten
- **Backend Startup**: ~60 Sekunden (optimiert)
- **HPA Aktivierung**: ~30 Sekunden
- **Ingress Ready**: ~30 Sekunden

## 🌐 Zugriff & APIs

| Service | URL | Beschreibung |
|---------|-----|--------------|
| Frontend | http://localhost/ | React App |
| Backend Health | http://localhost/api/health | API Health Check |
| Backend Metrics | http://localhost/api/metrics | Prometheus Metrics |
| Backend APIs | http://localhost/api/* | Alle API Endpoints |

### API Beispiele
```bash
# Health Check mit Environment Info
curl http://localhost/api/health
# Response: {"status":"OK","hasJwtSecret":true,"hasDbUrl":true,"port":"3000"}

# Prometheus Metriken für Monitoring
curl http://localhost/api/metrics

# Weitere APIs (abhängig von Backend-Implementation)
curl http://localhost/api/universes/user/owned
curl http://localhost/api/auth/status
```

## 📊 Production Monitoring & Debugging

### Status prüfen
```bash
# HPA Auto-Scaling Status
kubectl get hpa -n loopit-dev

# Pod-Status mit Resource-Usage
kubectl get pods -n loopit-dev -o wide

# Pod Disruption Budgets
kubectl get pdb -n loopit-dev

# Service + Ingress Status
kubectl get services,ingress -n loopit-dev

# Storage Status
kubectl get pvc -n loopit-dev
```

### Live Monitoring
```bash
# HPA Scaling live verfolgen
kubectl get hpa -n loopit-dev -w

# Pod-Skalierung beobachten
kubectl get pods -n loopit-dev -w

# Resource Usage
kubectl top pods -n loopit-dev

# Scaling Events
kubectl get events -n loopit-dev --field-selector reason=SuccessfulRescale
```

### Logs & Debugging
```bash
# Application Logs
kubectl logs -l app=backend -n loopit-dev
kubectl logs -l app=frontend -n loopit-dev
kubectl logs -l app=postgres -n loopit-dev

# NGINX Ingress Logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Live Log-Verfolgung
kubectl logs -f -l app=backend -n loopit-dev

# Pod-Details bei Problemen
kubectl describe pod <pod-name> -n loopit-dev
```

## 🔥 Load Testing & Performance

### Artillery Load Testing Setup
```bash
# Artillery installieren
npm install -g artillery

# Load Test Config erstellen
mkdir -p k8s/load-testing
cat > k8s/load-testing/stress-test.yml << 'EOF'
config:
  target: 'http://localhost'
  phases:
    - duration: 60
      arrivalRate: 20
      rampTo: 100
      name: "Heavy Ramp"
    - duration: 120  
      arrivalRate: 150
      name: "Stress Load"

scenarios:
  - name: "Backend Load"
    weight: 60
    flow:
      - get:
          url: "/api/health"
      - get:
          url: "/api/metrics"
  - name: "Frontend Load"
    weight: 40
    flow:
      - get:
          url: "/"
EOF

# Stress Test starten
artillery run k8s/load-testing/stress-test.yml
```

### Validierte Performance
- **Getestet bis 622 RPS** ohne Service-Degradation
- **Auto-Scaling**: 2 → 14 Backend Pods bei 156% CPU Load
- **Recovery**: System normalisiert sich automatisch auf 3% CPU
- **Response Times**: P95 < 10ms unter normaler Last

## 🧹 Cleanup

```bash
# Vollständiges Cleanup (inkl. PVC-Daten)
./k8s/cleanup.sh

# Oder manuell (Pods + Services)
kubectl delete namespace loopit-dev

# NGINX Ingress Controller behalten
kubectl delete namespace loopit-dev --ignore-not-found
```

**Was wird gelöscht:**
- Alle Loop-It Services und Pods
- HPA und Pod Disruption Budgets
- Generierte Secrets
- PersistentVolumeClaim (⚠️ Daten gehen verloren!)
- Optional: Docker Images und NGINX Ingress Controller

## 🔐 Production Security

### Secrets Management
Secrets werden automatisch generiert und rotiert:
```bash
# Generierte Secrets
- PostgreSQL Password: 16-stelliger Hex-String
- JWT Secret: 32-stelliger Hex-String  
- JWT Refresh Secret: 32-stelliger Hex-String

# Secrets anzeigen
kubectl get secrets -n loopit-dev

# Secret-Details (Base64 encoded)
kubectl get secret loopit-secrets -n loopit-dev -o yaml
```

### Security Features
- **Non-root Container Users**: Alle Container laufen als unprivileged User
- **Security Contexts**: Dropped Capabilities und eingeschränkte Berechtigungen
- **Network Isolation**: Kubernetes NetworkPolicies-ready
- **Resource Limits**: CPU/Memory Limits gegen Resource Exhaustion
- **Graceful Shutdown**: Verhindert Data Loss bei Pod-Terminierung

## 🔧 Production Configuration

### Environment Variables

**Backend (Production-optimiert):**
```yaml
- PORT: "3000"
- NODE_ENV: "production"
- DB_HOST: "postgres"
- DB_PORT: "5432"
- DATABASE_URL: "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(POSTGRES_DB)"
- POSTGRES_USER: <from secret>
- POSTGRES_PASSWORD: <from secret>
- POSTGRES_DB: "loop-it"
- JWT_SECRET: <from secret>
- JWT_REFRESH_SECRET: <from secret>
- JWT_EXPIRES_IN: "7d"
- FRONTEND_URL: "http://localhost"
```

### Production Health Checks

**Backend (optimiert für schnelle Startups):**
```yaml
startupProbe:
  httpGet: {path: /api/health, port: 3000}
  initialDelaySeconds: 10    # Reduziert von 30s
  periodSeconds: 5
  failureThreshold: 20       # 100s total startup time

livenessProbe:
  httpGet: {path: /api/health, port: 3000}
  periodSeconds: 30          # Weniger häufig nach Startup
  failureThreshold: 3

readinessProbe:
  httpGet: {path: /api/health, port: 3000}
  periodSeconds: 5           # Schnelle Traffic-Reaktion
  failureThreshold: 2
```

### Resource Management (Production-tuned)

| Service | Requests | Limits | HPA Range |
|---------|----------|---------|-----------|
| Backend | 200m CPU, 256Mi RAM | 1000m CPU, 512Mi RAM | 2-20 Pods |
| Frontend | 50m CPU, 64Mi RAM | 200m CPU, 128Mi RAM | 2-10 Pods |
| PostgreSQL | 250m CPU, 512Mi RAM | 1000m CPU, 1024Mi RAM | 1 Pod (StatefulSet) |

## 🚨 Production Troubleshooting

### HPA nicht skalierend
```bash
# HPA Status und Metriken prüfen
kubectl describe hpa backend-hpa -n loopit-dev

# Resource Usage prüfen
kubectl top pods -n loopit-dev

# Load Test für Skalierung
artillery run k8s/load-testing/stress-test.yml
```

### Pod CrashLoopBackOff
```bash
# Häufigste Ursachen bereits behoben:
# ✅ DATABASE_URL für Drizzle ORM
# ✅ Upload-Verzeichnis Volume Mounts
# ✅ NGINX Filesystem-Berechtigungen

# Debugging
kubectl logs <pod-name> -n loopit-dev --previous
kubectl describe pod <pod-name> -n loopit-dev
```

### Ingress nicht erreichbar
```bash
# NGINX Ingress Controller Status
kubectl get pods -n ingress-nginx

# Ingress-Konfiguration prüfen
kubectl describe ingress loopit-ingress -n loopit-dev

# Manuelle NGINX Ingress Installation (falls nötig)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.13.0/deploy/static/provider/cloud/deploy.yaml
```

### Performance-Probleme
```bash
# Resource Bottlenecks identifizieren
kubectl top nodes
kubectl top pods -n loopit-dev

# HPA Scaling-Events prüfen
kubectl get events -n loopit-dev | grep -i scale

# Load Testing für Performance-Baselines
artillery run k8s/load-testing/stress-test.yml
```

## 📁 Dateistruktur

```
k8s/
├── backend.yaml              # Backend Deployment + Service + HPA + PDB
├── frontend.yaml             # Frontend Deployment + Service + HPA + PDB  
├── postgres.yaml             # PostgreSQL Deployment + Service + PVC + PDB
├── ingress.yaml              # NGINX Ingress Configuration
├── deploy.sh                 # Production Deployment Script
├── cleanup.sh                # Cleanup Script
├── load-testing/             # Artillery Load Testing Configs
│   ├── stress-test.yml       # High-Load Test (150 RPS)
│   └── quick-test.yml        # Basic Load Test (40 RPS)
└── README.md                 # Diese Dokumentation
```

## 🔄 Production Updates & Rollbacks

### Zero-Downtime Updates
```bash
# Automatisches Rolling Update
./k8s/deploy.sh

# Manuelles Rolling Update einzelner Services
kubectl rollout restart deployment/backend -n loopit-dev
kubectl rollout restart deployment/frontend -n loopit-dev

# Update-Status verfolgen
kubectl rollout status deployment/backend -n loopit-dev
```

### Rollback-Strategien
```bash
# Rollback auf vorherige Version
kubectl rollout undo deployment/backend -n loopit-dev

# Spezifische Revision
kubectl rollout history deployment/backend -n loopit-dev
kubectl rollout undo deployment/backend --to-revision=2 -n loopit-dev

# Rollback-Status prüfen
kubectl rollout status deployment/backend -n loopit-dev
```

## 🚀 Next Steps: Enterprise Features

### Monitoring Stack (empfohlen)
```bash
# Prometheus + Grafana für Custom Metrics HPA
./k8s/monitoring/deploy-monitoring.sh

# Custom Metrics für Request Rate / Response Time basiertes Scaling
# Grafana Dashboards für Application Performance Monitoring
```

### GitOps mit ArgoCD
```bash
# Automatische Deployments über Git
# Declarative Configuration Management
# Multi-Environment Support (Dev/Staging/Prod)
```

### Cloud Migration (AWS EKS)
```bash
# AWS EKS-optimierte Konfigurationen
# ALB Ingress Controller
# EFS/EBS Storage Classes
# IAM Roles for Service Accounts (IRSA)
```

## 📚 Weiterführende Informationen

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Pod Disruption Budgets](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
- [Artillery Load Testing](https://artillery.io/)

---
 
**Auto-Scaling: Validiert bis 622 RPS** 🚀  
**Zero-Downtime Updates: Implemented** 🛡️