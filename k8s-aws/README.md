# Loop-It AWS EKS Deployment

Production-ready Kubernetes deployment für Loop-It auf Amazon EKS mit Terraform-basierter Infrastruktur.

## 🎯 **Aktueller Status: ERFOLGREICH DEPLOYED! ✅**

**Live URL:** http://a4f655c6528df4f248aa7b94177f707e-2c3425a0932d3264.elb.eu-central-1.amazonaws.com/

### ✅ **Was bereits funktioniert:**
- ✅ **AWS EKS Cluster** (Kubernetes v1.33.0)
- ✅ **NGINX Ingress Controller** (v1.13.0)
- ✅ **AWS Load Balancer** (Network Load Balancer)
- ✅ **PostgreSQL** (postgres:17-alpine)
- ✅ **Backend Placeholder** (node:22-alpine)
- ✅ **Frontend Placeholder** (nginx:alpine)
- ✅ **Kubernetes Services & Networking**
- ✅ **Resource Management** (optimiert für t3.small)

### 🔄 **Nächste Schritte:**
- 🚧 **Echte Docker Images** bauen und deployen
- 🚧 **Monitoring Stack** (Prometheus, Grafana, Loki)
- 🚧 **Load Testing & Auto-Scaling**
- 🚧 **Domain Setup** (optional)

---

## 🏗️ **Infrastruktur Overview**

### **AWS EKS Cluster:**
- **Region:** eu-central-1
- **Node Group:** 1x t3.small (2 vCPU, 2GB RAM)
- **Kubernetes Version:** v1.33.0-eks-802817d
- **Storage:** GP3 EBS Volumes
- **Networking:** VPC mit Private/Public Subnets

### **Deployed Services:**
```
NAMESPACE     NAME                                  STATUS    
loop-it       backend-fbbbf745f-9gkrg              Running   
loop-it       frontend-dff76bc9f-rfrr4             Running   
loop-it       postgres-869966fbcf-vk9tp            Running   
ingress-nginx ingress-nginx-controller-95f6586c6   Running   
```

### **Resource Usage:**
```
Memory: 1054Mi (73% of 1459Mi available)
CPU: 775m (40% of 1930m available)
```

---

## 📁 **Projekt Struktur**

```
k8s-aws/
├── aws-ingress.yaml           # AWS Load Balancer Ingress
├── backend.yaml               # Backend Deployment (loop-it namespace)
├── frontend.yaml              # Frontend Deployment (loop-it namespace) 
├── postgres.yaml              # PostgreSQL mit GP3 Storage
├── deploy-aws.sh              # AWS Deployment Script (TODO)
├── cleanup.sh                 # Cleanup Script (aus k8s/ kopiert)
├── monitoring/                # Monitoring Stack für AWS
│   ├── deploy-monitoring.sh   
│   ├── prometheus.yaml
│   ├── grafana.yaml
│   ├── loki.yaml
│   └── ingress.yaml
└── load-testing/              # Load Testing für AWS LB
    ├── quick-test.yml
    ├── stress-test.yml
    └── run-aws-load-test.sh (TODO)
```

---

## 🚀 **Deployment History**

### **Migration von Local zu AWS:**
1. ✅ **Terraform EKS Cluster** erstellt (`../terraform-eks/`)
2. ✅ **k8s-aws Ordner** mit AWS-spezifischen Manifests
3. ✅ **Namespace Konsistenz** (loopit-dev → loop-it)
4. ✅ **GP3 Storage Class** Integration
5. ✅ **Resource Optimization** für t3.small Node
6. ✅ **Public Images** für Testing deployed

### **Solved Challenges:**
- **Memory Constraints:** t3.small hat nur 1.4GB verfügbar → Resource Limits angepasst
- **ImagePullBackOff:** Lokale Images nicht verfügbar → Public Images als Placeholder
- **Pod Scheduling:** "Too many pods" → Scaling auf 1 Replica pro Service
- **Network Issues:** AWS CNI IP-Assignment → Resolved automatically

---

## 🔧 **Quick Commands**

### **Status Check:**
```bash
# Cluster Status
kubectl cluster-info

# Pods Status
kubectl get pods -n loop-it

# Load Balancer URL
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Node Resources
kubectl describe nodes | grep -A 5 "Allocated resources"
```

### **Testing:**
```bash
# Frontend Test
curl http://a4f655c6528df4f248aa7b94177f707e-2c3425a0932d3264.elb.eu-central-1.amazonaws.com/

# Backend Port-Forward Test
kubectl port-forward -n loop-it deployment/backend 3000:3000
curl http://localhost:3000
```

### **Scaling Operations:**
```bash
# Scale Services
kubectl scale deployment backend --replicas=2 -n loop-it
kubectl scale deployment frontend --replicas=2 -n loop-it

# Resource Monitoring
kubectl top nodes
kubectl top pods -n loop-it
```

---

## 🎯 **Next Session Todo List**

### **1. Docker Images (Höchste Priorität)**
```bash
# Starte Docker Desktop
# Dann:
cd ../..  # Loop-It Root

# Build echte Images
docker build -t loopit/backend:aws ./backend
docker build --build-arg VITE_API_URL=http://a4f655c6528df4f248aa7b94177f707e-2c3425a0932d3264.elb.eu-central-1.amazonaws.com -t loopit/frontend:aws ./frontend

# Deploy echte Images
kubectl set image deployment/backend backend=loopit/backend:aws -n loop-it
kubectl set image deployment/frontend frontend=loopit/frontend:aws -n loop-it
```

### **2. Infrastructure Scaling**
```bash
cd ../terraform-eks

# Option A: Mehr Nodes
terraform apply -var="node_desired_capacity=2"

# Option B: Größere Instances  
terraform apply -var='node_instance_types=["t3.medium"]'
```

### **3. Monitoring Stack**
```bash
cd k8s-aws
./monitoring/deploy-monitoring.sh

# URLs dann:
# Grafana: http://LB_URL/monitoring/
# Prometheus: http://LB_URL/prometheus/
```

### **4. Load Testing**
```bash
# AWS Load Balancer Testing
./load-testing/run-aws-load-test.sh
```

---

## 🔍 **Troubleshooting Guide**

### **Pod Pending Issues:**
```bash
# Check Node Resources
kubectl describe nodes | grep -A 10 "Allocated resources"

# Check Pod Events
kubectl describe pod -n loop-it <pod-name>

# Scale down if needed
kubectl scale deployment <deployment> --replicas=1 -n loop-it
```

### **ImagePullBackOff:**
```bash
# Check Docker Images
docker images | grep loopit

# Use public images temporarily
kubectl set image deployment/backend backend=node:22-alpine -n loop-it
```

### **Load Balancer Issues:**
```bash
# Check Ingress Status
kubectl get ingress -n loop-it

# Check NGINX Controller
kubectl get pods -n ingress-nginx

# Manual Port-Forward Test
kubectl port-forward -n loop-it svc/frontend 8080:80
```

---

## 📊 **Current Resource Configuration**

### **Optimized for t3.small (2GB RAM):**

| Service | Requests | Limits | Status |
|---------|----------|---------|---------|
| PostgreSQL | 128Mi / 100m CPU | 256Mi / 200m CPU | ✅ Running |
| Backend | 64Mi / 50m CPU | 128Mi / 100m CPU | ✅ Running |
| Frontend | 32Mi / 25m CPU | 64Mi / 50m CPU | ✅ Running |
| **Total** | **224Mi / 175m** | **448Mi / 350m** | ✅ **Fits in t3.small** |

### **System Pods (Already Running):**
- NGINX Ingress: 90Mi / 100m CPU
- CoreDNS (2x): 140Mi / 200m CPU  
- AWS EBS CSI: 600Mi / 150m CPU
- **System Total:** ~830Mi

---

## 🌐 **Production URLs**

### **Current (Placeholder):**
- **Frontend:** http://a4f655c6528df4f248aa7b94177f707e-2c3425a0932d3264.elb.eu-central-1.amazonaws.com/
- **Backend:** http://a4f655c6528df4f248aa7b94177f707e-2c3425a0932d3264.elb.eu-central-1.amazonaws.com/api/ (TODO)

### **Future (with Monitoring):**
- **Grafana:** http://LB_URL/monitoring/
- **Prometheus:** http://LB_URL/prometheus/
- **Loki:** http://LB_URL/loki/

---

## 🎉 **Achievement Unlocked!**

**Von Zero zu AWS EKS in einer Session:**
- ✅ Terraform Infrastructure as Code
- ✅ Production-ready Kubernetes Setup  
- ✅ AWS Load Balancer Integration
- ✅ Resource-optimized for Cost Efficiency
- ✅ Live Application accessible from Internet

**Nächste Session: Echte Loop-It App + Monitoring! 🚀**

---

## 📞 **Support & Links**

- **AWS EKS Docs:** https://docs.aws.amazon.com/eks/
- **Terraform AWS Provider:** https://registry.terraform.io/providers/hashicorp/aws/latest
- **NGINX Ingress:** https://kubernetes.github.io/ingress-nginx/
- **Kubectl Reference:** https://kubernetes.io/docs/reference/kubectl/

---

**Status: PAUSE - Infrastruktur läuft, bereit für echte App! ☕**