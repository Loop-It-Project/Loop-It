# Loop-It Kubernetes Setup

Ein vollständiges Kubernetes-Setup für die Loop-It Anwendung mit Docker Desktop, NGINX Ingress Controller und automatisiertem Deployment.

## 🚀 Quick Start

```bash
# 1. Repository clonen
git clone https://github.com/Loop-It-Project/Loop-It
cd Loop-It

# 2. Docker Desktop mit Kubernetes starten
# Settings → Kubernetes → Enable Kubernetes

# 3. Loop-It deployen
./k8s/deploy.sh

# 4. Im Browser öffnen
open http://localhost
```

## 📋 Voraussetzungen

- **Docker Desktop** mit aktiviertem Kubernetes
- **Git Bash** oder Terminal
- **curl** für API-Tests
- **Mindestens 4GB RAM** für alle Services

### Docker Desktop Setup
1. Docker Desktop installieren
2. Settings → Kubernetes → "Enable Kubernetes" aktivieren
3. Warten bis Kubernetes läuft (grüner Punkt)

## 🏗️ Architektur

```
Internet → localhost:80
    ↓
NGINX Ingress Controller
    ↓
┌─────────────────┬─────────────────┐
│   Frontend      │   Backend       │
│   (React/Vite)  │   (Node.js)     │
│   Port 80       │   Port 3000     │
└─────────────────┴─────────────────┘
                      ↓
                 PostgreSQL
                 Port 5432
```

### Services
- **Frontend**: React/Vite App (NGINX Container)
- **Backend**: Node.js API Server
- **PostgreSQL**: Datenbank
- **NGINX Ingress**: Load Balancer & Reverse Proxy

## 🔧 Deployment

### Automatisches Deployment
```bash
# Komplett-Deployment (empfohlen)
./k8s/deploy.sh
```

**Was passiert beim Deployment:**
1. ✅ NGINX Ingress Controller installieren
2. 🔨 Docker Images bauen
3. 🧹 Alte Deployments löschen
4. 📦 Namespace erstellen
5. 🔐 Secrets generieren
6. 📋 Services deployen
7. ⏳ Auf alle Pods warten
8. 📊 Status anzeigen

### Manuelles Deployment
```bash
# Einzelne Schritte
kubectl create namespace loopit-dev
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

## 🌐 Zugriff

| Service | URL | Beschreibung |
|---------|-----|--------------|
| Frontend | http://localhost/ | React App |
| Backend Health | http://localhost/api/health | API Health Check |
| Backend APIs | http://localhost/api/* | Alle API Endpoints |

### API Beispiele
```bash
# Health Check
curl http://localhost/api/health

# Weitere APIs (je nach Backend)
curl http://localhost/api/universes/user/owned
curl http://localhost/api/auth/status
```

## 📊 Monitoring & Debugging

### Status prüfen
```bash
# Alle Pods anzeigen
kubectl get pods -n loopit-dev

# Services anzeigen
kubectl get services -n loopit-dev

# Ingress Status
kubectl get ingress -n loopit-dev

# Detaillierte Informationen
kubectl describe ingress loopit-ingress -n loopit-dev
```

### Logs anzeigen
```bash
# Backend Logs
kubectl logs -l app=backend -n loopit-dev

# Frontend Logs
kubectl logs -l app=frontend -n loopit-dev

# PostgreSQL Logs
kubectl logs -l app=postgres -n loopit-dev

# NGINX Ingress Logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Logs verfolgen (Live)
kubectl logs -f -l app=backend -n loopit-dev
```

### Pod Details
```bash
# In Pod einsteigen
kubectl exec -it deployment/backend -n loopit-dev -- /bin/sh

# PostgreSQL Verbindung testen
kubectl exec -it deployment/postgres -n loopit-dev -- psql -U loop_user -d loop-it

# Port-Forward für direkten Zugriff
kubectl port-forward service/backend 3000:3000 -n loopit-dev
```

## 🧹 Cleanup

```bash
# Vollständiges Cleanup
./k8s/cleanup.sh

# Oder manuell
kubectl delete namespace loopit-dev
```

**Was wird gelöscht:**
- Alle Loop-It Services und Pods
- Generierte Secrets
- Docker Images (optional)
- NGINX Ingress Controller (optional)

## 🔐 Secrets Management

Secrets werden automatisch generiert:
- **PostgreSQL Password**: 16-stelliger Hex-String
- **JWT Secret**: 32-stelliger Hex-String
- **JWT Refresh Secret**: 32-stelliger Hex-String

```bash
# Secrets anzeigen
kubectl get secrets -n loopit-dev

# Secret Details (Base64 encoded)
kubectl get secret loopit-secrets -n loopit-dev -o yaml
```

## 🛠️ Entwicklung

### Hot Reload (Development)
```bash
# Frontend Development Server
cd frontend
npm run dev

# Backend Development Server
cd backend
npm run dev

# Gleichzeitig mit Kubernetes PostgreSQL
kubectl port-forward service/postgres 5432:5432 -n loopit-dev
```

### Frontend Build für Ingress
```bash
# Frontend wird mit korrekter API URL gebaut
docker build --build-arg VITE_API_URL=http://localhost -t loopit/frontend:latest ./frontend
```

## 🔧 Konfiguration

### Environment Variables

**Backend:**
```yaml
- PORT: "3000"
- NODE_ENV: "production"
- DB_HOST: "postgres"
- DB_PORT: "5432"
- POSTGRES_USER: "loop_user"
- POSTGRES_DB: "loop-it"
- FRONTEND_URL: "http://localhost"
- JWT_EXPIRES_IN: "7d"
```

**Frontend:**
```yaml
- VITE_API_URL: "http://localhost"
- VITE_APP_NAME: "Loop-It"
```

### Health Checks

**Backend:**
- **Startup Probe**: 30s initial delay, 10s interval, 12 failures = 2 minutes
- **Liveness Probe**: 60s initial delay, 30s interval, 3 failures = restart
- **Readiness Probe**: 45s initial delay, 10s interval, 2 failures = remove from service

**Frontend:**
- **Liveness Probe**: 10s initial delay, 10s interval
- **Readiness Probe**: 5s initial delay, 5s interval

**PostgreSQL:**
- **Liveness Probe**: `pg_isready` check
- **Readiness Probe**: `pg_isready` check

### Resource Management

| Service | Requests | Limits |
|---------|----------|---------|
| Backend | 300m CPU, 512Mi RAM | 1000m CPU, 1024Mi RAM |
| Frontend | 100m CPU, 128Mi RAM | 200m CPU, 256Mi RAM |
| PostgreSQL | 250m CPU, 512Mi RAM | 1000m CPU, 1024Mi RAM |

## 🚨 Troubleshooting

### Häufige Probleme

**Port 80 ist belegt:**
```bash
# Windows
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Linux/Mac
sudo lsof -i :80
sudo kill -9 <PID>
```

**Kubernetes läuft nicht:**
```bash
# Status prüfen
kubectl cluster-info

# Docker Desktop Settings → Kubernetes → Reset Kubernetes Cluster
```

**Pod startet nicht:**
```bash
# Pod Status prüfen
kubectl describe pod <pod-name> -n loopit-dev

# Events anzeigen
kubectl get events -n loopit-dev --sort-by=.metadata.creationTimestamp
```

**Ingress funktioniert nicht:**
```bash
# NGINX Ingress Controller Status
kubectl get pods -n ingress-nginx

# Ingress Details
kubectl describe ingress loopit-ingress -n loopit-dev
```

**Docker Images nicht gefunden:**
```bash
# Images neu bauen
docker build -t loopit/backend:latest ./backend
docker build -t loopit/frontend:latest ./frontend

# Images prüfen
docker images | grep loopit
```

### Netzwerk-Debugging
```bash
# DNS Resolution testen
kubectl exec -it deployment/backend -n loopit-dev -- nslookup postgres

# Service Connectivity testen
kubectl exec -it deployment/backend -n loopit-dev -- wget -qO- http://postgres:5432

# Ingress Connectivity testen
curl -v http://localhost/api/health
```

## 📁 Dateistruktur

```
k8s/
├── backend.yaml          # Backend Deployment & Service
├── frontend.yaml         # Frontend Deployment & Service
├── postgres.yaml         # PostgreSQL Deployment & Service
├── ingress.yaml          # NGINX Ingress Configuration
├── deploy.sh             # Automatisches Deployment
└── cleanup.sh            # Cleanup Script
```

## 🔄 Updates

### Anwendung aktualisieren
```bash
# Neue Version deployen
./k8s/deploy.sh

# Oder einzelne Services
kubectl rollout restart deployment/backend -n loopit-dev
kubectl rollout restart deployment/frontend -n loopit-dev
```

### Rollback
```bash
# Rollback auf vorherige Version
kubectl rollout undo deployment/backend -n loopit-dev

# Rollout Status prüfen
kubectl rollout status deployment/backend -n loopit-dev
```

## 📚 Weiterführende Informationen

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)

---
