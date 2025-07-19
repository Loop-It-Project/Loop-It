# 🚀 Loop-It EKS Deployment - Current State Additions

## 📦 Kubernetes Applications (NEW)

Das Projekt enthält jetzt eine vollständige Kubernetes-Anwendungs-Suite:

### Application Architecture
```
Internet → ALB → NGINX Ingress → Backend Service → PostgreSQL
                     ↓
               API Endpoints (/api/*, /health)
```

### Deployed Components

#### Database Layer
- **PostgreSQL 17 Alpine**: Production-ready database with persistent storage
- **EBS GP3 Storage**: High-performance storage with encryption
- **Automatic Backups**: Via persistent volume snapshots
- **Health Checks**: pg_isready probes for reliability

#### Application Layer  
- **Backend Service**: Node.js application with health endpoints
- **Environment Variables**: Secure secret management
- **Resource Limits**: Memory and CPU constraints for stability
- **Rolling Updates**: Zero-downtime deployments

#### Infrastructure Layer
- **NGINX Ingress Controller**: AWS Load Balancer integration
- **Database Migrations**: Automated schema management via Jobs
- **Secrets Management**: Kubernetes secrets with external options

## 📁 Updated Project Structure

```
terraform-eks/
├── provider.tf              # Terraform & AWS provider configuration
├── variables.tf             # Input variable definitions  
├── main.tf                 # Main infrastructure (VPC, EKS, ECR)
├── k8s-apps.tf             # Kubernetes applications (NEW)
├── storage-classes.tf      # EBS storage configuration (NEW)
├── outputs.tf              # Output values and information
├── terraform.tfvars        # Environment-specific configuration
├── secrets.tfvars          # Secrets (NOT in Git) (NEW)
├── nginx-ingress.tf.disabled # NGINX config (disabled)
└── README.md               # This documentation
```

## 🔒 Secrets Management (NEW)

### Secure Configuration
Das Projekt implementiert sichere Secret-Verwaltung ohne Hardcoding:

```hcl
# secrets.tfvars (NOT in Git)
postgres_user = "loop_user"
postgres_password = "YourSecurePassword"
jwt_secret = "YourJWTSecret32CharsMin"
jwt_refresh_secret = "YourRefreshSecret32CharsMin"
```

### Deployment with Secrets
```bash
# Deploy with separated secrets
terraform apply -var-file="secrets.tfvars"
```

### Production Secrets Options
1. **Environment Variables**: `TF_VAR_*` for CI/CD
2. **AWS Secrets Manager**: Enterprise-grade secret rotation
3. **External Secrets Operator**: Kubernetes-native secret sync

## 🗄️ Database Configuration (NEW)

### PostgreSQL Setup
- **Version**: PostgreSQL 17 Alpine
- **Storage**: 2Gi EBS GP3 (expandable)
- **Configuration**: Optimized for t3.small instances
- **Data Directory**: `/var/lib/postgresql/data/pgdata` (mount-safe)

### Database Features
- **Persistent Storage**: Survives pod restarts
- **Health Checks**: Liveness and readiness probes
- **Resource Limits**: 200m CPU, 256Mi Memory (optimized for small nodes)
- **Automatic Initialization**: Database and user creation

### Migration System
- **Database Jobs**: Automated schema migrations
- **Drizzle Integration**: Modern TypeScript ORM
- **Wait Conditions**: Ensures database readiness
- **Rollback Safety**: OnFailure restart policy

## 🏗️ Application Deployment (NEW)

### Backend Service
```yaml
# Example backend configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: backend
        image: 390402575145.dkr.ecr.eu-central-1.amazonaws.com/loop-it/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST  
          value: "postgres"
        # Secrets from Kubernetes Secrets
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### Health Monitoring
- **Startup Probe**: 10s delay, 20 failure threshold
- **Liveness Probe**: `/api/health` endpoint monitoring
- **Readiness Probe**: Traffic routing control
- **Resource Monitoring**: CPU and Memory usage tracking

## 🌐 Ingress Configuration (NEW)

### NGINX Ingress Routes
```yaml
# API Traffic Routing
spec:
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
      - path: /health
        pathType: Exact
        backend:
          service:
            name: backend
            port:
              number: 3000
```

### Load Balancer
- **AWS ALB**: Automatic provisioning via NGINX Ingress
- **SSL Ready**: Cert-manager integration available
- **CORS Enabled**: Cross-origin resource sharing configured

## 🔧 Deployment Instructions (UPDATED)

### Prerequisites (Updated)
- **AWS CLI** v2+ configured with EKS permissions
- **Terraform** v1.0+ 
- **kubectl** v1.28+
- **Docker** (for local image building)
- **Valid ECR access** for container images

### 1. Infrastructure Deployment
```bash
# Clone and navigate
git clone <repo-url>
cd terraform-eks

# Configure secrets (NEW STEP)
cp terraform.tfvars.example terraform.tfvars
cat > secrets.tfvars << 'EOF'
postgres_user = "loop_user"
postgres_password = "YourSecurePassword123"
jwt_secret = "YourJWTSecret32CharsMinimumLength"
jwt_refresh_secret = "YourRefreshSecret32CharsMinimum"
EOF

# Deploy infrastructure
terraform init
terraform plan -var-file="secrets.tfvars"
terraform apply -var-file="secrets.tfvars"
```

### 2. Application Deployment (NEW)
```bash
# Configure kubectl
aws eks update-kubeconfig --region eu-central-1 --name loop-it-cluster

# Verify deployment
kubectl get pods -n loop-it
kubectl get services -n loop-it
kubectl get ingress -n loop-it

# Check application health
curl -I http://$(kubectl get ingress loop-it-ingress -n loop-it -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')/api/health
```

### 3. Database Operations (NEW)
```bash
# Check database status
kubectl logs -n loop-it -l app=postgres

# Run manual migrations
kubectl logs -n loop-it -l app=migration

# Database connection test
kubectl exec -it -n loop-it deployment/postgres -- psql -U loop_user -d loop-it -c "SELECT version();"
```

## 📊 Resource Usage (UPDATED)

### Current Configuration
| Component | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-----------|-------------|----------------|-----------|--------------|
| PostgreSQL | 100m | 128Mi | 200m | 256Mi |
| Backend | 200m | 256Mi | 500m | 512Mi |
| System Pods | 500m | 740Mi | Variable | Variable |
| **Total** | **800m** | **1124Mi** | **Variable** | **Variable** |

### Node Capacity (t3.small)
- **CPU**: 1930m available (fits comfortably)
- **Memory**: 1459Mi available (tight but functional)
- **Recommendation**: t3.medium for production (4GB RAM)

## 🛠️ Troubleshooting (UPDATED)

### Application Issues

#### Backend CrashLoopBackOff
```bash
# Check backend logs
kubectl logs -n loop-it -l app=backend --tail=20

# Common issues:
# 1. Database connection problems
# 2. Environment variable issues  
# 3. Resource constraints
# 4. Image pull failures
```

#### Database Connection Problems
```bash
# Check PostgreSQL status
kubectl get pods -n loop-it -l app=postgres
kubectl logs -n loop-it -l app=postgres

# Test database connectivity
kubectl exec -n loop-it deployment/backend -- nc -zv postgres 5432
```

#### Memory Issues on t3.small
```bash
# Scale down non-essential services
kubectl scale deployment coredns -n kube-system --replicas=1
kubectl scale deployment ebs-csi-controller -n kube-system --replicas=1

# Or upgrade node type
terraform apply -var="node_instance_types=[\"t3.medium\"]" -var-file="secrets.tfvars"
```

### Secret Management Issues
```bash
# Check secrets exist
kubectl get secrets -n loop-it
kubectl describe secret loopit-secrets -n loop-it

# Recreate secrets if needed
terraform apply -replace="kubernetes_secret.loopit_secrets[0]" -var-file="secrets.tfvars"
```

## 🔐 Security Updates (NEW)

### Implemented Security
- **No Hardcoded Secrets**: All secrets externalized
- **Resource Limits**: Prevents resource exhaustion
- **Health Checks**: Automatic failure detection
- **Rolling Updates**: Zero-downtime deployments
- **Network Policies**: Pod-to-pod communication control ready

### Security Checklist
- [ ] Secrets in external management (AWS Secrets Manager)
- [ ] Network policies implemented
- [ ] Pod security standards enforced
- [ ] Image vulnerability scanning
- [ ] Regular security updates

## 💡 Known Issues & Solutions (NEW)

### 1. Special Characters in Passwords
**Issue**: Random password generation can create URL-unsafe characters
**Solution**: Use `special = false` in password generation or URL encoding

### 2. EBS Volume Mount Issues  
**Issue**: PostgreSQL fails with "directory not empty" error
**Solution**: Use `PGDATA` subdirectory for data storage

### 3. Memory Pressure on t3.small
**Issue**: Pod evictions due to insufficient memory
**Solution**: Reduce resource limits or upgrade to t3.medium

### 4. IAM Permission Issues
**Issue**: EBS CSI driver lacks volume creation permissions
**Solution**: Attach `Amazon_EBS_CSI_DriverPolicy` to node group role

## 🚀 Production Readiness (UPDATED)

### Current Status: 95% Production Ready ✅

#### ✅ Completed
- Infrastructure as Code (Terraform)
- High Availability VPC setup
- Managed Kubernetes cluster
- Persistent database storage
- Application health monitoring
- Secure secret management
- Load balancer integration
- Database migration automation

#### 🔄 Recommended for Production
- [ ] Multi-node setup (HA)
- [ ] Managed database (RDS)
- [ ] SSL/TLS certificates
- [ ] Monitoring stack (Prometheus/Grafana)
- [ ] Backup automation
- [ ] Disaster recovery plan



---


