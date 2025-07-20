# 🚀 Loop-It EKS Deployment Guide

**Production-Ready Kubernetes Infrastructure auf AWS EKS**

## 📋 Inhaltsverzeichnis

- [Überblick](#überblick)
- [Voraussetzungen](#voraussetzungen)
- [Schritt-für-Schritt Deployment](#schritt-für-schritt-deployment)
- [Troubleshooting](#troubleshooting)
- [Betrieb & Monitoring](#betrieb--monitoring)
- [Nächste Schritte](#nächste-schritte)

---

## 🌟 Überblick

### **Was wird deployed:**
- **EKS Cluster** (Kubernetes 1.33) mit t3.small Nodes
- **PostgreSQL 17** Database mit persistentem EBS Storage
- **Node.js Backend API** mit Health Endpoints
- **NGINX Ingress Controller** mit AWS Load Balancer
- **Secure Secret Management** via Kubernetes Secrets
- **Automated Database Migrations** via Kubernetes Jobs

### **Architektur:**
```
Internet → AWS NLB → NGINX Ingress → Backend Service → PostgreSQL
                          ↓
                    API Endpoints:
                    - /health
                    - /api/health  
                    - /api/*
```

### **Kosten:**
- **~125 EUR/Monat** für Production-Setup
- **~95 EUR/Monat** mit Spot Instances (weniger stabil)

---

## 🛠️ Voraussetzungen

### **Software Requirements:**
```bash
# AWS CLI v2+
aws --version
# aws-cli/2.x.x Python/3.x.x

# Terraform v1.0+
terraform version
# Terraform v1.x.x

# kubectl v1.28+
kubectl version --client
# Client Version: v1.28.x

# Git
git --version
```

### **AWS Setup:**
```bash
# AWS Credentials konfigurieren
aws configure
# ODER AWS SSO verwenden:
aws sso login --profile your-profile
```

### **Permissions Required:**
- **EKS**: `AmazonEKSClusterPolicy`, EKS Cluster Management
- **EC2**: VPC/Subnet/Security Group Management
- **IAM**: Role/Policy Management für EKS
- **ECR**: Container Registry Access

---

## 🚀 Schritt-für-Schritt Deployment

### **1. Repository Setup**

```bash
# Repository klonen
git clone <your-loop-it-repo>
cd terraform-eks

# Project Structure verificieren
ls -la
# Sollte enthalten:
# - provider.tf
# - variables.tf  
# - main.tf
# - k8s-apps.tf
# - storage-classes.tf
# - outputs.tf
```

### **2. Terraform Configuration**

#### **terraform.tfvars erstellen:**
```bash
cat > terraform.tfvars << 'EOF'
# Project & AWS Basics
project_name          = "loop-it"
environment           = "production"
aws_region            = "eu-central-1"
cluster_name          = "loop-it-cluster"

# Node Configuration
node_instance_types   = ["t3.small"]     # Kostengünstig für Start
node_desired_capacity = 1
node_max_capacity     = 1
node_min_capacity     = 1
enable_spot_instances = false             # Für Stabilität

# Application Settings
deploy_applications   = true
backend_replicas      = 1
postgres_storage_size = "2Gi"
enable_monitoring     = false
EOF
```

#### **secrets.tfvars erstellen (NICHT in Git!):**
```bash
cat > secrets.tfvars << 'EOF'
# Database Credentials
postgres_user     = "loop_user"
postgres_password = "SecureLoopItPassword2025!"

# JWT Secrets (mindestens 32 Zeichen!)
jwt_secret         = "your-super-secure-jwt-secret-key-32chars-minimum-length"
jwt_refresh_secret = "your-super-secure-refresh-secret-key-32chars-minimum-length"

# Database URL (für Drizzle ORM)
database_url = "postgresql://loop_user:SecureLoopItPassword2025!@postgres:5432/loop-it"
EOF

# WICHTIG: Aus Git ausschließen
echo "secrets.tfvars" >> .gitignore
```

### **3. Infrastructure Deployment**

#### **Phase 1: Nur Infrastructure (ohne Apps):**
```bash
# Terraform initialisieren
terraform init

# Plan prüfen
terraform plan -var="deploy_applications=false" -var-file="secrets.tfvars"

# Infrastructure deployen
terraform apply -var="deploy_applications=false" -var-file="secrets.tfvars"
# Eingabe: yes
```

#### **Phase 2: Kubectl Access Setup**

```bash
# Kubectl für EKS konfigurieren
aws eks update-kubeconfig --region eu-central-1 --name loop-it-cluster

# Cluster Status testen
kubectl get nodes
# NAME                                          STATUS   ROLES    AGE   VERSION
# ip-10-0-x-xxx.eu-central-1.compute.internal   Ready    <none>   5m    v1.33.0-eks-xxxxx

# WICHTIGER SCHRITT: EKS Access Entry für SSO User
# Falls du AWS SSO verwendest, über AWS Console:
# 1. Gehe zu EKS Console → loop-it-cluster → Access
# 2. "Create access entry" 
# 3. Principal: Deine aktuelle SSO Session
# 4. Policy: AmazonEKSClusterAdminPolicy
# 5. Access scope: Cluster

# Test ob kubectl funktioniert
kubectl get namespaces
```

#### **Phase 3: NGINX Ingress Installation**

```bash
# NGINX Ingress Controller installieren
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.13.0/deploy/static/provider/aws/deploy.yaml

# Status überwachen
kubectl get pods -n ingress-nginx -w
# Warten bis alle Pods "Running"

# Load Balancer Ready Check
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

# Load Balancer URL abrufen
kubectl get svc -n ingress-nginx ingress-nginx-controller
# EXTERNAL-IP sollte AWS ELB URL zeigen
```

#### **Phase 4: Applications Deployment**

```bash
# Applications aktivieren
terraform apply -var="deploy_applications=true" -var-file="secrets.tfvars"

# Deployment Status überwachen
kubectl get pods -n loop-it -w

# Expected Final State:
# NAME                               READY   STATUS      RESTARTS   AGE
# backend-xxx-xxx                    1/1     Running     0          2m
# db-migration-xxx                   0/1     Completed   0          5m  
# postgres-xxx-xxx                   1/1     Running     0          5m
```

### **4. Deployment Verification**

```bash
# Load Balancer URL ermitteln
LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Load Balancer: http://$LB_URL"

# Health Check Tests
curl -v "http://$LB_URL/health"
curl -v "http://$LB_URL/api/health"

# Expected Response:
# {
#   "status": "OK",
#   "timestamp": "2025-07-19T18:05:37.258Z",
#   "env": {
#     "hasJwtSecret": true,
#     "hasDbUrl": true, 
#     "port": "3000"
#   }
# }

# Alle Services Status
kubectl get all -n loop-it
kubectl get ingress -n loop-it
```

---

## 🔧 Troubleshooting

### **Häufige Probleme & Lösungen**

#### **1. kubectl Authentication Fehler**
```bash
# Problem: "server has asked for the client to provide credentials"

# Lösung für AWS SSO User:
# 1. AWS Console → EKS → loop-it-cluster → Access
# 2. Create Access Entry für deine SSO Role
# 3. Policy: AmazonEKSClusterAdminPolicy

# Kubeconfig neu generieren:
rm -f ~/.kube/config
aws eks update-kubeconfig --region eu-central-1 --name loop-it-cluster
```

#### **2. PVC Timeout Errors**
```bash
# Problem: "client rate limiter Wait returned an error: context deadline exceeded"

# Lösung: wait_until_bound = false in k8s-apps.tf
resource "kubernetes_persistent_volume_claim" "postgres_pvc" {
  # ... configuration
  wait_until_bound = false  # ← WICHTIG!
}

# State bereinigen:
terraform state rm 'kubernetes_persistent_volume_claim.postgres_pvc[0]'
terraform apply -var-file="secrets.tfvars"
```

#### **3. Backend CrashLoopBackOff**
```bash
# Problem: Backend startet nicht wegen DATABASE_URL

# Debug:
kubectl logs -n loop-it -l app=backend --tail=20
kubectl describe pod -n loop-it -l app=backend

# Lösung: Ensure DATABASE_URL in secrets
# secrets.tfvars muss enthalten:
database_url = "postgresql://loop_user:SecureLoopItPassword2025!@postgres:5432/loop-it"

# Secret neu erstellen:
kubectl delete secret loopit-secrets -n loop-it
terraform apply -var-file="secrets.tfvars"
```

#### **4. Memory Issues auf t3.small**
```bash
# Problem: Pod evictions wegen Memory

# Sofort-Fix: System Pods reduzieren
kubectl scale deployment coredns -n kube-system --replicas=1

# Langfristig: Node upgraden
terraform apply -var="node_instance_types=[\"t3.medium\"]" -var-file="secrets.tfvars"
```

#### **5. IAM Policy Fehler**
```bash
# Problem: "Policy arn:aws:iam::aws:policy/service-role/Amazon_EBS_CSI_DriverPolicy does not exist"

# Lösung: Korrekte Policy ARN in main.tf
resource "aws_iam_role_policy_attachment" "node_group_ebs_csi_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"  # ← Ohne "_"
  role       = module.eks.eks_managed_node_groups.main.iam_role_name
}
```

### **Deployment Validation Checklist**

```bash
# ✅ Cluster Ready
kubectl get nodes
# Status: Ready

# ✅ All Pods Running  
kubectl get pods -A
# Alle Pods: Running (außer Completed Jobs)

# ✅ Ingress Ready
kubectl get svc -n ingress-nginx
# EXTERNAL-IP: AWS ELB URL verfügbar

# ✅ Application Health
curl -I http://$LB_URL/health
# HTTP/1.1 200 OK

# ✅ Database Connected
kubectl exec -n loop-it deployment/postgres -- psql -U loop_user -d loop-it -c "SELECT version();"
# PostgreSQL 17.x on x86_64-pc-linux-musl

# ✅ Secrets Loaded
kubectl get secrets -n loop-it
# loopit-secrets: 5 keys (postgres-user, postgres-password, jwt-secret, jwt-refresh-secret, database-url)
```

---

## 📊 Betrieb & Monitoring

### **Daily Operations**

#### **Logs Monitoring:**
```bash
# Backend Logs
kubectl logs -n loop-it -l app=backend -f

# Database Logs  
kubectl logs -n loop-it -l app=postgres -f

# Ingress Logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller -f
```

#### **Resource Monitoring:**
```bash
# Pod Resource Usage
kubectl top pods -n loop-it

# Node Resource Usage
kubectl top nodes

# Memory/CPU Pressure Check
kubectl describe nodes
```

#### **Health Monitoring:**
```bash
# Automated Health Check Script
#!/bin/bash
LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# API Health
API_STATUS=$(curl -s "http://$LB_URL/api/health" | jq -r '.status')
if [ "$API_STATUS" != "OK" ]; then
  echo "🚨 API Health Failed: $API_STATUS"
  exit 1
fi

# Database Health
DB_STATUS=$(kubectl exec -n loop-it deployment/postgres -- pg_isready -U loop_user -d loop-it)
if [[ $DB_STATUS != *"accepting connections"* ]]; then
  echo "🚨 Database Health Failed: $DB_STATUS"
  exit 1
fi

echo "✅ All Systems Healthy"
```

### **Backup Strategy**

#### **Database Backup:**
```bash
# Manual Database Backup
kubectl exec -n loop-it deployment/postgres -- pg_dump -U loop_user loop-it > backup-$(date +%Y%m%d).sql

# EBS Snapshot Backup (via AWS CLI)
VOLUME_ID=$(kubectl get pv -o jsonpath='{.items[?(@.spec.claimRef.name=="postgres-pvc")].spec.csi.volumeHandle}')
aws ec2 create-snapshot --volume-id $VOLUME_ID --description "Loop-It DB Backup $(date)"
```

#### **Configuration Backup:**
```bash
# Kubernetes Resources Backup
kubectl get all,ingress,secrets,configmaps -n loop-it -o yaml > k8s-backup-$(date +%Y%m%d).yaml

# Terraform State Backup
cp terraform.tfstate terraform.tfstate.backup-$(date +%Y%m%d)
```

### **Scaling Operations**

#### **Horizontal Scaling:**
```bash
# Backend Replicas erhöhen
kubectl scale deployment backend -n loop-it --replicas=3

# Oder via Terraform
terraform apply -var="backend_replicas=3" -var-file="secrets.tfvars"
```

#### **Vertical Scaling (Node Upgrade):**
```bash
# Node Type upgraden für mehr Resources
terraform apply -var="node_instance_types=[\"t3.medium\"]" -var-file="secrets.tfvars"

# Database Storage erweitern
terraform apply -var="postgres_storage_size=5Gi" -var-file="secrets.tfvars"
```

---

## 🚀 Nächste Schritte

### **Immediate Enhancements (1-2 Wochen)**

#### **1. Frontend Deployment:**
```bash
# Frontend Container zu k8s-apps.tf hinzufügen
resource "kubernetes_deployment" "frontend" {
  # ... configuration
}

# Ingress erweitern für Frontend
path {
  path      = "/"
  path_type = "Prefix"
  backend {
    service {
      name = "frontend"
      port {
        number = 80
      }
    }
  }
}
```

#### **2. SSL/TLS Certificates:**
```bash
# cert-manager installieren
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Let's Encrypt ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

#### **3. Domain Setup:**
```bash
# Route 53 Domain für Loop-It
aws route53 create-hosted-zone --name loop-it.com --caller-reference $(date +%s)

# DNS Record für Load Balancer
aws route53 change-resource-record-sets --hosted-zone-id Z1234567890 --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "app.loop-it.com",
      "Type": "CNAME", 
      "TTL": 300,
      "ResourceRecords": [{"Value": "'$LB_URL'"}]
    }
  }]
}'
```

### **Medium Term (1-2 Monate)**

#### **4. Monitoring Stack:**
```bash
# Prometheus + Grafana via Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
# http://localhost:3000 (admin/prom-operator)
```

#### **5. CI/CD Pipeline:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to EKS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Configure AWS
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: eu-central-1
    
    - name: Build & Push to ECR
      run: |
        aws ecr get-login-password | docker login --username AWS --password-stdin 390402575145.dkr.ecr.eu-central-1.amazonaws.com
        docker build -t backend ./backend
        docker tag backend:latest 390402575145.dkr.ecr.eu-central-1.amazonaws.com/loop-it/backend:latest
        docker push 390402575145.dkr.ecr.eu-central-1.amazonaws.com/loop-it/backend:latest
    
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name loop-it-cluster
        kubectl rollout restart deployment/backend -n loop-it
```

#### **6. Production Database (RDS):**
```hcl
# RDS PostgreSQL für Production
resource "aws_db_instance" "postgres" {
  identifier     = "loop-it-postgres"
  engine         = "postgres"
  engine_version = "17.2"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  
  db_name  = "loopit"
  username = "loop_user"
  password = var.postgres_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
}
```

### **Long Term (3-6 Monate)**

#### **7. High Availability:**
- Multi-AZ EKS Cluster
- RDS Multi-AZ
- Auto-Scaling Groups
- Cross-Region Backup

#### **8. Advanced Features:**
- ElasticSearch/OpenSearch für Logs
- Redis für Caching
- S3 für File Uploads
- SES für Email Service
- Cognito für User Management

#### **9. Cost Optimization:**
- Spot Instances für Development
- Reserved Instances für Production
- S3 Lifecycle Policies
- CloudWatch Cost Monitoring

---

## 💰 Kostenübersicht

### **Aktuelle Konfiguration (~125 EUR/Monat):**
- **EKS Cluster**: ~73 EUR/Monat
- **EC2 t3.small**: ~40 EUR/Monat (On-Demand)
- **EBS GP3 2GB**: ~2 EUR/Monat
- **NAT Gateway**: ~8 EUR/Monat
- **Load Balancer**: ~2 EUR/Monat

### **Optimierungen:**
- **Spot Instances**: -70% auf EC2 Kosten
- **t3.medium**: +100% EC2 Kosten, aber bessere Performance
- **RDS**: +30-50 EUR/Monat, aber managed Service

### **Production Estimate (~200-300 EUR/Monat):**
- EKS Cluster + t3.medium Nodes
- RDS PostgreSQL (Multi-AZ)
- CloudWatch + ALB
- S3 + CloudFront für Static Assets

---

## 📞 Support & Community

### **Logs & Debugging:**
```bash
# Comprehensive Debug Script
#!/bin/bash
echo "=== Loop-It EKS Debug Report ==="
echo "Date: $(date)"
echo

echo "=== Cluster Status ==="
kubectl get nodes -o wide

echo -e "\n=== Pod Status ==="
kubectl get pods -A

echo -e "\n=== Service Status ==="
kubectl get svc -A

echo -e "\n=== Recent Events ==="
kubectl get events --sort-by='.lastTimestamp' | tail -10

echo -e "\n=== Backend Logs (Last 20 lines) ==="
kubectl logs -n loop-it -l app=backend --tail=20

echo -e "\n=== Database Status ==="
kubectl exec -n loop-it deployment/postgres -- pg_isready -U loop_user -d loop-it

echo -e "\n=== API Health Check ==="
LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl -s "http://$LB_URL/api/health" | jq .
```

### **Useful Commands Cheatsheet:**
```bash
# Quick Status Check
alias k="kubectl"
alias kgp="kubectl get pods"
alias kgs="kubectl get svc" 
alias kgi="kubectl get ingress"
alias kd="kubectl describe"
alias kl="kubectl logs"

# Loop-It Specific
alias loop-pods="kubectl get pods -n loop-it"
alias loop-logs="kubectl logs -n loop-it -l app=backend -f"
alias loop-health="curl -s http://\$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')/api/health | jq ."
```

---



**Nächster Schritt: [Frontend hinzufügen](#1-frontend-deployment) oder [SSL Setup](#2-ssltls-certificates)**

---

*Last updated: July 19, 2025*  