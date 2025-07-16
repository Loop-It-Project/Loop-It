# Loop-It GitOps Setup

Ein vollständiges GitOps-Setup für Loop-It mit ArgoCD, Kustomize und automatisiertem Deployment.

## 🎯 Überblick

Dieses Setup implementiert GitOps Best Practices für die Loop-It Anwendung:
- **ArgoCD** für kontinuierliche Deployments
- **Kustomize** für umgebungsspezifische Konfigurationen
- **DockerHub** als Container Registry
- **Kubernetes** als Deployment-Plattform

## 📁 Repository Struktur

```
gitops/
├── README.md                    # Diese Dokumentation
├── argocd/                      # ArgoCD Anwendungs-Definitionen
│   ├── projects/               # ArgoCD Projects
│   └── applications/           # ArgoCD Applications
├── base/                       # Basis Kubernetes Manifests
│   ├── backend/               # Backend Service & Deployment
│   ├── frontend/              # Frontend Service & Deployment
│   ├── database/              # PostgreSQL Manifests
│   └── ingress/               # NGINX Ingress Konfiguration
├── environments/              # Umgebungsspezifische Konfigurationen
│   ├── development/           # Development Environment
│   ├── staging/               # Staging Environment
│   └── production/            # Production Environment
└── secrets/                   # Secret Management Templates
    ├── external-secrets/      # External Secrets Operator
    └── sealed-secrets/        # Sealed Secrets (für später)
```

## 🏗️ Architektur

### GitOps Workflow
```
Developer → Git Push → GitHub Actions → Docker Registry → Git Manifest Update → ArgoCD → Kubernetes
```

### Komponenten
- **Frontend**: React/Vite App (Port 80)
- **Backend**: Node.js API (Port 3000)
- **Database**: PostgreSQL (Port 5432)
- **Ingress**: NGINX Ingress Controller

## 🚀 Quick Start

### Voraussetzungen
- Docker Desktop mit Kubernetes aktiviert
- kubectl konfiguriert
- ArgoCD installiert

### 1. ArgoCD Installation
```bash
# ArgoCD Namespace erstellen
kubectl create namespace argocd

# ArgoCD installieren
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# ArgoCD UI zugänglich machen
kubectl patch svc argocd-server -n argocd -p '{"spec":{"type":"LoadBalancer"}}'

# Admin Password abrufen
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### 2. Loop-It Application erstellen
```bash
# ArgoCD Application deployen
kubectl apply -f - << 'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: loop-it-development
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Loop-It-Project/Loop-It
    targetRevision: main
    path: gitops/environments/development
  destination:
    server: https://kubernetes.default.svc
    namespace: loopit-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF
```

### 3. Zugriff
- **Frontend**: http://localhost/
- **Backend API**: http://localhost/api/health
- **ArgoCD UI**: http://localhost:8080 (mit Port-Forward)

## 🔧 Entwickler Workflow

### Code-Änderungen deployen
1. **Code ändern** in `backend/` oder `frontend/`
2. **Git Push** zu main branch
3. **GitHub Actions** baut Images und pushed zu DockerHub
4. **GitHub Actions** updated GitOps Manifests mit neuen Image Tags
5. **ArgoCD** erkennt Änderungen und deployed automatisch

### Manuelle Sync
```bash
# ArgoCD Application manuell synchronisieren
kubectl patch application loop-it-development -n argocd --type merge -p '{"operation":{"sync":{"revision":"main"}}}'

# Status prüfen
kubectl get application loop-it-development -n argocd
```

## 📊 Monitoring & Debugging

### ArgoCD Status
```bash
# Application Status
kubectl get applications -n argocd

# Detailed Status
kubectl describe application loop-it-development -n argocd
```

### Kubernetes Resources
```bash
# Pods Status
kubectl get pods -n loopit-dev

# Services & Endpoints
kubectl get svc,endpoints -n loopit-dev

# Ingress Status
kubectl get ingress -n loopit-dev
```

### Logs
```bash
# Backend Logs
kubectl logs -l app=backend -n loopit-dev

# Frontend Logs
kubectl logs -l app=frontend -n loopit-dev

# ArgoCD Logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server
```

## 🔐 Secret Management

### Development Secrets
Aktuell in `environments/development/secrets.yaml` als Kubernetes Secret:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: loop-it-secrets
  namespace: loopit-dev
type: Opaque
stringData:
  postgres-password: "your-postgres-password"
  jwt-secret: "your-jwt-secret"
  jwt-refresh-secret: "your-jwt-refresh-secret"
```

### Production Secrets (Geplant)
- External Secrets Operator für HashiCorp Vault
- AWS Secrets Manager Integration
- Sealed Secrets für Git-sichere Speicherung

## 🌍 Environments

### Development Environment
- **Path**: `gitops/environments/development/`
- **Namespace**: `loopit-dev`
- **Auto-Sync**: Aktiviert
- **Images**: `vinjust/loop-it-*:latest`

### Staging Environment (Geplant)
- **Path**: `gitops/environments/staging/`
- **Namespace**: `loopit-staging`
- **Auto-Sync**: Deaktiviert (manuell)
- **Images**: `vinjust/loop-it-*:stable`

### Production Environment (Geplant)
- **Path**: `gitops/environments/production/`
- **Namespace**: `loopit-prod`
- **Auto-Sync**: Deaktiviert (manuell mit Approval)
- **Images**: `vinjust/loop-it-*:v1.0.0`

## 🛠️ Kustomize Konfiguration

### Base Manifests
Gemeinsame Konfiguration für alle Environments in `base/`:
- Standard Resource Requests/Limits
- Basis Health Checks
- Container Ports und Service Definitionen

### Environment Overlays
Environment-spezifische Anpassungen:
- Replica Counts
- Environment Variables
- Image Tags
- Ingress Konfigurationen

### Beispiel Development Kustomization
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: loopit-dev

resources:
  - namespace.yaml
  - secrets.yaml
  - postgres.yaml
  - ingress.yaml
  - ../../base/backend
  - ../../base/frontend

images:
  - name: loop-it-backend
    newName: vinjust/loop-it-backend
    newTag: latest
  - name: loop-it-frontend
    newName: vinjust/loop-it-frontend
    newTag: latest

labels:
  - includeSelectors: true
    pairs:
      environment: development
      managed-by: argocd
```

## 🚨 Troubleshooting

### Häufige Probleme

**ArgoCD Application "OutOfSync"**
```bash
# Manuell synchronisieren
kubectl patch application loop-it-development -n argocd --type merge -p '{"operation":{"sync":{"revision":"main"}}}'
```

**Pods starten nicht**
```bash
# Events prüfen
kubectl get events -n loopit-dev --sort-by=.metadata.creationTimestamp

# Pod Details
kubectl describe pod <pod-name> -n loopit-dev
```

**Service Endpoints leer**
```bash
# Service Selector prüfen
kubectl get service <service-name> -n loopit-dev -o yaml | grep -A 5 selector

# Pod Labels prüfen
kubectl get pods -n loopit-dev --show-labels
```

**Ingress 503 Fehler**
```bash
# Ingress Controller Logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# Ingress Details
kubectl describe ingress -n loopit-dev
```

### Service Label Fixes
```bash
# Backend Service Selector vereinfachen
kubectl patch service backend -n loopit-dev --type='json' -p='[{"op": "replace", "path": "/spec/selector", "value": {"app":"backend"}}]'

# Frontend Service Selector vereinfachen
kubectl patch service frontend -n loopit-dev --type='json' -p='[{"op": "replace", "path": "/spec/selector", "value": {"app":"frontend"}}]'
```

## 🔄 CI/CD Integration

### GitHub Actions Integration
Die GitHub Actions Pipeline in `.github/workflows/docker-build.yml`:
1. **Build & Test** - Baut Docker Images und führt Tests aus
2. **Push Images** - Pushed Images zu DockerHub
3. **Update GitOps** - Updated Image Tags in GitOps Manifests
4. **ArgoCD Sync** - ArgoCD erkennt Änderungen und deployed

### Image Tagging Strategy
- **Development**: `latest` Tag für kontinuierliche Deployments
- **Staging**: `stable` Tag für getestete Builds
- **Production**: Semantic Versioning `v1.0.0`

## 🔮 Nächste Schritte

### Geplante Verbesserungen
1. **Multi-Environment Setup** - Staging und Production Environments
2. **External Secrets Operator** - Sichere Secret-Verwaltung
3. **Monitoring Integration** - Prometheus, Grafana, Loki
4. **Progressive Deployments** - Canary und Blue-Green Deployments
5. **Policy as Code** - OPA Gatekeeper für Security Policies

### Skalierung
- **Multi-Cluster Setup** für verschiedene Environments
- **ApplicationSets** für automatische Environment-Erstellung
- **Notification System** für Deployment-Status

## 📚 Referenzen

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kustomize Documentation](https://kustomize.io/)
- [GitOps Best Practices](https://www.gitops.tech/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---