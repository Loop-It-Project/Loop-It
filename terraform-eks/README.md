# 🚀 Loop-It EKS Deployment

**Production-Ready Kubernetes Infrastructure auf AWS EKS**

## 📋 Inhaltsverzeichnis

- [Überblick](#-überblick)
- [Architektur](#-architektur)
- [Voraussetzungen](#-voraussetzungen)
- [Deployment Guide](#-deployment-guide)
- [Konfiguration](#-konfiguration)
- [Troubleshooting](#-troubleshooting)
- [Betrieb & Wartung](#-betrieb--wartung)
- [Kosten](#-kosten)

---

## 🌟 Überblick

Diese Terraform-Konfiguration deployt eine **vollständige Loop-It Social Media Plattform** auf AWS EKS mit folgenden Komponenten:

### **✅ Was funktioniert:**
- **EKS Cluster** (Kubernetes 1.33) mit managed Node Groups
- **PostgreSQL 17** Database mit persistentem EBS Storage
- **Node.js Backend API** mit Health Monitoring & JWT Authentication
- **React Frontend** mit Vite Build System
- **NGINX Ingress Controller** mit AWS Network Load Balancer
- **Automatische Database Migrations** via Kubernetes Jobs
- **Secure Secret Management** via Kubernetes Secrets
- **Container Registry** via Amazon ECR

### **🎯 Production Features:**
- **Health Checks**: Liveness/Readiness Probes
- **Auto-Scaling**: Horizontal Pod Autoscaler ready
- **Security**: Non-root containers, Security Contexts
- **Monitoring**: Prometheus metrics endpoints
- **Logging**: Structured JSON logs
- **CORS**: Cross-Origin Resource Sharing configured

---

## 🏗️ Architektur

```
Internet
    ↓
AWS Network Load Balancer (ELB)
    ↓
NGINX Ingress Controller
    ↓
┌─────────────────────────────────────────┐
│           Kubernetes Cluster            │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  Frontend   │  │     Backend      │  │
│  │   (React)   │  │   (Node.js)      │  │
│  │             │  │                  │  │
│  │ Port: 8080  │  │   Port: 3000     │  │
│  └─────────────┘  └──────────────────┘  │
│                           │              │
│                           ↓              │
│                  ┌─────────────────┐     │
│                  │   PostgreSQL    │     │
│                  │  (Port: 5432)   │     │
│                  │   EBS Storage   │     │
│                  └─────────────────┘     │
└─────────────────────────────────────────┘
```

### **Routing:**
- `/*` → Frontend (React App)
- `/api/*` → Backend (Node.js API)
- `/health` → Backend Health Check
- `/metrics` → Backend Prometheus Metrics

### **Networking:**
- **VPC**: Dedicated VPC mit öffentlichen & privaten Subnets
- **Security Groups**: Restrictive Firewall Rules
- **Load Balancer**: AWS NLB mit SSL-Termination Support
- **Ingress**: NGINX mit CORS & WebSocket Support

---

## 🛠️ Voraussetzungen

### **Software Requirements:**
```bash
# AWS CLI v2.x
aws --version
# aws-cli/2.x.x

# Terraform v1.0+
terraform version
# Terraform v1.x.x

# kubectl v1.28+
kubectl version --client
# Client Version: v1.28.x

# Docker Engine
docker --version
# Docker version 24.x.x
```

### **AWS Permissions:**
Ihr Account benötigt folgende AWS Services:
- **EKS**: Cluster Management (`AmazonEKSClusterPolicy`)
- **EC2**: VPC/Subnet/Security Groups (`AmazonVPCFullAccess`)
- **IAM**: Rollen für EKS Nodes (`IAMFullAccess`)
- **ECR**: Container Registry (`AmazonEC2ContainerRegistryFullAccess`)
- **EBS**: Persistent Storage (`AmazonEBSCSIDriverPolicy`)

### **AWS Configuration:**
```bash
# Option 1: AWS Access Keys
aws configure

# Option 2: AWS SSO (empfohlen)
aws sso login --profile your-profile
export AWS_PROFILE=your-profile
```

---

## 🚀 Deployment Guide

### **1. Repository Setup**

```bash
git clone <your-loop-it-repo>
cd terraform-eks

# Verzeichnisstruktur prüfen
ls -la
# Sollte enthalten:
# ├── provider.tf          # AWS & Kubernetes Provider
# ├── variables.tf         # Alle konfigurierbaren Variablen
# ├── main.tf             # EKS Cluster & ECR Repositories
# ├── k8s-apps.tf         # Kubernetes Applications
# ├── storage-classes.tf  # EBS Storage Classes
# ├── outputs.tf          # Cluster URLs & Connection Info
# └── terraform.tfvars    # Umgebungsconfig (zu erstellen)
```

### **2. Konfiguration**

#### **terraform.tfvars erstellen:**
```hcl
# Project & AWS Configuration
project_name          = "loop-it"
environment           = "production"
aws_region            = "eu-central-1"
cluster_name          = "loop-it-cluster"

# Node Configuration
node_instance_types   = ["t3.small"]        # Kosteneffizient für Start
node_desired_capacity = 1                   # Kann später skaliert werden
node_max_capacity     = 3
node_min_capacity     = 1
enable_spot_instances = false               # Für Produktionsstabilität

# Application Settings  
deploy_applications   = true
backend_replicas      = 1
frontend_replicas     = 1
postgres_storage_size = "2Gi"              # EBS GP3 Volume

# Cost Optimization
cost_optimization = {
  single_nat_gateway = true                # Reduziert NAT Gateway Kosten
  gp3_storage       = true                 # Günstigerer Storage
  spot_instances    = false                # Spot = billiger aber instabil
}
```

#### **secrets.tfvars erstellen (🚨 NICHT in Git committen!):**
```hcl
# Database Credentials
postgres_user     = "loop_user"
postgres_password = "SecureLoopItPassword2025!"

# JWT Secrets (mindestens 32 Zeichen!)
jwt_secret         = "your-super-secure-jwt-secret-key-32chars-minimum-length"
jwt_refresh_secret = "your-super-secure-refresh-secret-key-32chars-minimum-length"

# Database Connection für Backend
database_url = "postgresql://loop_user:SecureLoopItPassword2025!@postgres:5432/loop-it"
```

```bash
# WICHTIG: Secrets aus Git ausschließen
echo "secrets.tfvars" >> .gitignore
```

### **3. Infrastructure Deployment**

#### **Phase 1: EKS Cluster erstellen**
```bash
# Terraform initialisieren
terraform init

# Deployment Plan prüfen
terraform plan -var="deploy_applications=false" -var-file="secrets.tfvars"

# Infrastructure deployen (ohne Apps)
terraform apply -var="deploy_applications=false" -var-file="secrets.tfvars"
# Input: yes

# Output sollte zeigen:
# ✅ EKS Cluster: loop-it-cluster
# ✅ VPC & Subnets
# ✅ ECR Repositories
# ✅ IAM Roles
```

#### **Phase 2: Kubernetes Access konfigurieren**
```bash
# kubectl für EKS konfigurieren
aws eks update-kubeconfig --region eu-central-1 --name loop-it-cluster

# Cluster Test
kubectl get nodes
# Expected Output:
# NAME                                          STATUS   ROLES    AGE   VERSION
# ip-10-0-x-xxx.eu-central-1.compute.internal   Ready    <none>   5m    v1.33.0-eks-xxxxx

# 🚨 WICHTIG für AWS SSO User:
# Falls kubectl Permission Fehler, in AWS Console:
# EKS → loop-it-cluster → Access → Create Access Entry
# Principal: Dein SSO User/Role
# Policy: AmazonEKSClusterAdminPolicy
```

#### **Phase 3: NGINX Ingress installieren**
```bash
# NGINX Ingress Controller deployen
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.13.0/deploy/static/provider/aws/deploy.yaml

# Installation überwachen
kubectl get pods -n ingress-nginx -w
# Warten bis alle Pods "Running" sind

# Load Balancer Ready Check
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

# External URL abrufen (dauert 2-3 Minuten)
kubectl get svc -n ingress-nginx ingress-nginx-controller
# EXTERNAL-IP sollte AWS ELB URL anzeigen
```

### **4. Container Images bauen & pushen**

```bash
# ECR URLs aus Terraform abrufen
BACKEND_ECR_URL=$(terraform output -raw ecr_backend_repository_url)
FRONTEND_ECR_URL=$(terraform output -raw ecr_frontend_repository_url)
AWS_REGION=$(terraform output -raw aws_region)

# ECR Login
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(echo $BACKEND_ECR_URL | cut -d'/' -f1)

# Backend Image bauen & pushen
cd ../backend
docker build -t $BACKEND_ECR_URL:latest .
docker push $BACKEND_ECR_URL:latest

# Frontend Image bauen & pushen  
cd ../frontend
# LoadBalancer URL für Frontend API Configuration
LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

docker build --build-arg VITE_API_URL=http://$LB_URL -t $FRONTEND_ECR_URL:latest .
docker push $FRONTEND_ECR_URL:latest
```

### **5. Applications deployen**

```bash
cd ../terraform-eks

# Kubernetes Applications aktivieren
terraform apply -var="deploy_applications=true" -var-file="secrets.tfvars"

# Deployment Status überwachen
kubectl get pods -n loop-it -w

# Expected Final State:
# NAME                               READY   STATUS      RESTARTS   AGE
# backend-xxx-xxx                    1/1     Running     0          2m
# db-migration-xxx                   0/1     Completed   0          5m  
# frontend-xxx-xxx                   1/1     Running     0          2m
# postgres-xxx-xxx                   1/1     Running     0          5m
```

### **6. Deployment Verification**

```bash
# Load Balancer URL ermitteln
LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "🌐 Loop-It App: http://$LB_URL"

# Health Checks
curl "http://$LB_URL/api/health"
# Expected: {"status":"OK","timestamp":"2025-07-20T...","env":{"hasJwtSecret":true,"hasDbUrl":true,"port":"3000"}}

# Frontend Test
curl -I "http://$LB_URL/"
# Expected: HTTP/1.1 200 OK

# Backend API Test
curl -X POST "http://$LB_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"testuser","firstName":"Test","lastName":"User"}'
# Expected: {"success":true,"message":"User created successfully",...}
```

---

## ⚙️ Konfiguration

### **Wichtige Terraform Variables:**

| Variable | Beschreibung | Default | Empfehlung |
|----------|-------------|---------|------------|
| `node_instance_types` | EC2 Instance Typen | `["t3.small"]` | t3.medium für Production |
| `backend_replicas` | Backend Pod Anzahl | `1` | 2-3 für High Availability |
| `postgres_storage_size` | Database Storage | `"2Gi"` | 5-10Gi für Production |
| `enable_spot_instances` | Spot Instances nutzen | `false` | true für Development |
| `deploy_applications` | K8s Apps deployen | `true` | false für Infrastructure-only |

### **Kubernetes Resources:**

#### **Backend Configuration:**
- **Image**: Node.js 18 Alpine
- **Resources**: 100m CPU, 128Mi RAM (Request) / 300m CPU, 256Mi RAM (Limit)
- **Health Checks**: `/api/health` endpoint
- **Environment**: Production mit JWT Authentication

#### **Frontend Configuration:**
- **Image**: NGINX Alpine mit React Build
- **Resources**: 25m CPU, 32Mi RAM (Request) / 100m CPU, 64Mi RAM (Limit)
- **Port**: 8080 (non-root nginx)
- **Build Args**: `VITE_API_URL` für Backend Connection

#### **PostgreSQL Configuration:**
- **Image**: PostgreSQL 17 Alpine
- **Resources**: 100m CPU, 128Mi RAM (Request) / 200m CPU, 256Mi RAM (Limit)
- **Storage**: EBS GP3 mit 2Gi (erweiterbar)
- **Persistence**: Kubernetes PVC mit ReadWriteOnce

### **Ingress Configuration:**
```yaml
# Routing Rules
paths:
  - path: "/api"          # Backend API
    pathType: "Prefix"
    service: backend:3000
  
  - path: "/health"       # Health Endpoint
    pathType: "Exact"
    service: backend:3000
    
  - path: "/metrics"      # Prometheus Metrics
    pathType: "Exact"  
    service: backend:3000
    
  - path: "/"            # Frontend
    pathType: "Prefix"
    service: frontend:80
```

---

## 🔧 Troubleshooting

### **Häufige Probleme & Lösungen:**

#### **1. kubectl Permission Denied**
```bash
# Problem: "server has asked for the client to provide credentials"

# Lösung für AWS SSO:
# 1. AWS Console → EKS → loop-it-cluster → Access → Create Access Entry
# 2. Principal: Deine SSO Identity  
# 3. Policy: AmazonEKSClusterAdminPolicy

# kubeconfig neu generieren:
aws eks update-kubeconfig --region eu-central-1 --name loop-it-cluster
```

#### **2. Frontend zeigt "Verbindung zum Server fehlgeschlagen"**
```bash
# Problem: Frontend kann Backend nicht erreichen

# Debug:
kubectl logs -n loop-it -l app=frontend
kubectl logs -n loop-it -l app=backend

# Lösung: Frontend mit korrekter API URL neu bauen
LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
cd ../frontend
docker build --build-arg VITE_API_URL=http://$LB_URL -t $FRONTEND_ECR_URL:latest .
docker push $FRONTEND_ECR_URL:latest
kubectl rollout restart deployment/frontend -n loop-it
```

#### **3. Backend CrashLoopBackOff**
```bash
# Problem: Backend startet nicht

# Debug:
kubectl describe pod -n loop-it -l app=backend
kubectl logs -n loop-it -l app=backend --tail=50

# Häufige Ursachen:
# - DATABASE_URL falsch konfiguriert
# - JWT_SECRET fehlt oder zu kurz
# - PostgreSQL noch nicht ready

# Lösung: Secrets prüfen und neu erstellen
kubectl get secret loopit-secrets -n loop-it -o yaml
kubectl delete secret loopit-secrets -n loop-it
terraform apply -var-file="secrets.tfvars"
```

#### **4. PostgreSQL Timeout beim Start**
```bash
# Problem: wait_until_bound = true verursacht Timeouts

# Lösung in k8s-apps.tf:
resource "kubernetes_persistent_volume_claim" "postgres_pvc" {
  wait_until_bound = false  # ← WICHTIG!
}

# State bereinigen falls nötig:
terraform state rm 'kubernetes_persistent_volume_claim.postgres_pvc[0]'
terraform apply -var-file="secrets.tfvars"
```

#### **5. Ingress Controller hängt in Pending**
```bash
# Problem: LoadBalancer wird nicht erstellt

# Debug:
kubectl describe svc -n ingress-nginx ingress-nginx-controller
kubectl get events -n ingress-nginx

# Lösung: AWS Load Balancer Controller installieren falls nötig
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"
```

### **Debug Commands:**

```bash
# Cluster Gesamtstatus
kubectl get all -A

# Loop-It spezifische Resources
kubectl get all,ingress,secrets -n loop-it

# Pod Logs
kubectl logs -n loop-it -l app=backend -f
kubectl logs -n loop-it -l app=frontend -f  
kubectl logs -n loop-it -l app=postgres -f

# Resource Usage
kubectl top pods -n loop-it
kubectl top nodes

# Cluster Events
kubectl get events --sort-by='.lastTimestamp' | tail -20
```

---

## 🔄 Betrieb & Wartung

### **Daily Operations:**

#### **Health Monitoring:**
```bash
# Automated Health Check Script
#!/bin/bash
LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "🔍 Loop-It Health Check - $(date)"

# API Health
API_STATUS=$(curl -s "http://$LB_URL/api/health" | jq -r '.status' 2>/dev/null)
if [ "$API_STATUS" = "OK" ]; then
  echo "✅ API Status: $API_STATUS"
else
  echo "🚨 API Health Failed: $API_STATUS"
  exit 1
fi

# Database Health  
kubectl exec -n loop-it deployment/postgres -- pg_isready -U loop_user -d loop-it >/dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Database: Ready"
else
  echo "🚨 Database: Not Ready"
  exit 1
fi

# Pod Status
UNHEALTHY_PODS=$(kubectl get pods -n loop-it --no-headers | grep -v -E "(Running|Completed)" | wc -l)
if [ $UNHEALTHY_PODS -eq 0 ]; then
  echo "✅ All Pods: Healthy"
else
  echo "🚨 Unhealthy Pods: $UNHEALTHY_PODS"
  kubectl get pods -n loop-it | grep -v -E "(Running|Completed)"
  exit 1
fi

echo "✅ All Systems Operational"
```

#### **Log Management:**
```bash
# Application Logs
kubectl logs -n loop-it -l app=backend --tail=100 -f
kubectl logs -n loop-it -l app=frontend --tail=100 -f

# System Logs
kubectl logs -n kube-system -l k8s-app=aws-node --tail=50
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=50
```

#### **Backup Strategy:**
```bash
# Database Backup
kubectl exec -n loop-it deployment/postgres -- pg_dump -U loop_user loop-it > backup-$(date +%Y%m%d).sql

# Kubernetes Configuration Backup
kubectl get all,ingress,secrets,configmaps -n loop-it -o yaml > k8s-backup-$(date +%Y%m%d).yaml

# Terraform State Backup
cp terraform.tfstate terraform.tfstate.backup-$(date +%Y%m%d)
```

### **Scaling Operations:**

#### **Horizontales Scaling:**
```bash
# Backend Replicas erhöhen
kubectl scale deployment backend -n loop-it --replicas=3

# Via Terraform:
terraform apply -var="backend_replicas=3" -var-file="secrets.tfvars"
```

#### **Vertikales Scaling:**
```bash
# Node Instance Type upgraden
terraform apply -var="node_instance_types=[\"t3.medium\"]" -var-file="secrets.tfvars"

# Database Storage erweitern
terraform apply -var="postgres_storage_size=5Gi" -var-file="secrets.tfvars"
```

### **Updates & Deployments:**

#### **Application Updates:**
```bash
# Neue Images bauen & pushen
cd ../backend
docker build -t $BACKEND_ECR_URL:$(git rev-parse --short HEAD) .
docker push $BACKEND_ECR_URL:$(git rev-parse --short HEAD)

# Rolling Update
kubectl set image deployment/backend backend=$BACKEND_ECR_URL:$(git rev-parse --short HEAD) -n loop-it

# Rollback falls nötig
kubectl rollout undo deployment/backend -n loop-it
```

#### **Infrastructure Updates:**
```bash
# Terraform Plan vor Updates
terraform plan -var-file="secrets.tfvars"

# Staged Updates
terraform apply -target=module.eks -var-file="secrets.tfvars"
terraform apply -var-file="secrets.tfvars"
```

---

## 💰 Kosten

### **Aktuelle Konfiguration (~125 EUR/Monat):**

| Service | Kosten/Monat | Beschreibung |
|---------|--------------|--------------|
| **EKS Cluster** | ~73 EUR | Kubernetes Control Plane |
| **EC2 t3.small** | ~40 EUR | Worker Node (On-Demand) |
| **EBS GP3 2GB** | ~2 EUR | PostgreSQL Storage |
| **NAT Gateway** | ~8 EUR | Outbound Internet (single AZ) |
| **Network Load Balancer** | ~2 EUR | Ingress Traffic |
| **Total** | **~125 EUR** | |

### **Optimierungsoptionen:**

#### **Development Environment (60-80 EUR/Monat):**
```hcl
# terraform.tfvars für Development
enable_spot_instances = true           # -70% EC2 Kosten
node_instance_types  = ["t3.micro"]   # Kleinere Instances
postgres_storage_size = "1Gi"         # Weniger Storage
```

#### **Production Environment (200-300 EUR/Monat):**
```hcl
# terraform.tfvars für Production
node_instance_types   = ["t3.medium"]  # Mehr Performance
node_desired_capacity = 2               # High Availability
backend_replicas      = 3               # Load Distribution
postgres_storage_size = "10Gi"         # Mehr Database Storage

# + RDS PostgreSQL (managed) = +50 EUR
# + CloudWatch Logs/Metrics = +10 EUR  
# + S3 Backup Storage = +5 EUR
```

### **Cost Monitoring:**
```bash
# AWS Cost Explorer via CLI
aws ce get-cost-and-usage \
  --time-period Start=2025-07-01,End=2025-07-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Resource Usage Monitoring
kubectl top nodes
kubectl top pods -A --sort-by=memory
```

---

## 📚 Referenzen & Links

### **Terraform Modules:**
- [AWS EKS Module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest)
- [AWS VPC Module](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest)

### **Kubernetes Documentation:**
- [EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

### **Monitoring & Observability:**
- [Prometheus Kubernetes](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config)
- [AWS CloudWatch Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-setup-EKS.html)

### **Security & Best Practices:**
- [EKS Security Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Kubernetes Security Context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)

---

## 🆘 Support

### **Bei Problemen:**

1. **Debug Commands ausführen** (siehe Troubleshooting)
2. **Logs sammeln** mit den bereitgestellten Scripts
3. **AWS Support** für Infrastructure Issues
4. **Kubernetes Community** für App-spezifische Probleme

### **Useful Commands Cheatsheet:**
```bash
# Quick Aliases
alias k="kubectl"
alias kgp="kubectl get pods -n loop-it"
alias kgs="kubectl get svc -n loop-it"
alias kl="kubectl logs -n loop-it"

# Loop-It Specific
alias loop-status="kubectl get all -n loop-it"
alias loop-health="curl -s http://\$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')/api/health | jq ."
alias loop-url="echo http://\$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
```

---



*Erstellt: Juli 2025