# Loop-It Helm Chart Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Kubernetes cluster (EKS recommended)
- Helm 3.x installed
- kubectl configured
- (Optional) NGINX Ingress Controller

### 1. Add and Update Helm Dependencies
```bash
# Add required repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Update chart dependencies
helm dependency update
```

### 2. Install for Development
```bash
# Create namespace
kubectl create namespace loop-it

# Install with development values
helm install loop-it . \
  --namespace loop-it \
  --values values-dev.yaml \
  --wait --timeout=10m
```

### 3. Install for Production (AWS EKS)
```bash
# Create namespace
kubectl create namespace loop-it

# Install with production values
helm install loop-it . \
  --namespace loop-it \
  --values values-prod.yaml \
  --set backend.image.tag="v1.0.0" \
  --set frontend.image.tag="v1.0.0" \
  --wait --timeout=15m
```

## 📊 Configuration Options

### Environment-Specific Values Files

| Environment | Values File | Use Case |
|-------------|-------------|----------|
| Development | `values-dev.yaml` | Local development, reduced resources |
| Production | `values-prod.yaml` | AWS EKS, full autoscaling, monitoring |

### Key Configuration Sections

#### Backend Configuration
```yaml
backend:
  enabled: true
  replicaCount: 2
  image:
    repository: loop-it/backend
    tag: "latest"
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 512Mi
```

#### Frontend Configuration
```yaml
frontend:
  enabled: true
  replicaCount: 2
  image:
    repository: loop-it/frontend
    tag: "latest"
```

#### Database Configuration
```yaml
postgresql:
  enabled: true
  external: false  # Set to true for RDS
  auth:
    username: "loop_user"
    database: "loop-it"
  persistence:
    size: 1Gi
    storageClass: "gp3"
```

#### AWS EKS Configuration
```yaml
aws:
  region: "eu-central-1"
  ecr:
    enabled: true
    registryId: "390402575145"
    backendRepository: "loop-it/backend"
    frontendRepository: "loop-it/frontend"
```

## 🔧 Deployment Commands

### Install/Upgrade Commands
```bash
# Fresh installation
helm install loop-it . --namespace loop-it --values values-prod.yaml

# Upgrade existing installation
helm upgrade loop-it . --namespace loop-it --values values-prod.yaml

# Upgrade with new image tags
helm upgrade loop-it . \
  --namespace loop-it \
  --values values-prod.yaml \
  --set backend.image.tag="v1.1.0" \
  --set frontend.image.tag="v1.1.0"

# Dry run to validate
helm upgrade loop-it . \
  --namespace loop-it \
  --values values-prod.yaml \
  --dry-run --debug
```

### Template and Validation
```bash
# Generate templates locally
helm template loop-it . --values values-prod.yaml

# Lint chart
helm lint .

# Test installation
helm test loop-it --namespace loop-it
```

### Rollback and Cleanup
```bash
# List releases
helm list --namespace loop-it

# Rollback to previous version
helm rollback loop-it 1 --namespace loop-it

# Uninstall
helm uninstall loop-it --namespace loop-it
```

## 🎯 AWS EKS Specific Deployment

### 1. ECR Authentication
```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin \
  390402575145.dkr.ecr.eu-central-1.amazonaws.com
```

### 2. Build and Push Images
```bash
# Backend
docker build -t 390402575145.dkr.ecr.eu-central-1.amazonaws.com/loop-it/backend:latest ./backend
docker push 390402575145.dkr.ecr.eu-central-1.amazonaws.com/loop-it/backend:latest

# Frontend (with Load Balancer URL)
LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
docker build --build-arg VITE_API_URL=http://$LB_URL \
  -t 390402575145.dkr.ecr.eu-central-1.amazonaws.com/loop-it/frontend:latest ./frontend
docker push 390402575145.dkr.ecr.eu-central-1.amazonaws.com/loop-it/frontend:latest
```

### 3. Deploy with Production Values
```bash
helm upgrade --install loop-it . \
  --namespace loop-it \
  --values values-prod.yaml \
  --set aws.ecr.enabled=true \
  --set backend.image.repository="390402575145.dkr.ecr.eu-central-1.amazonaws.com/loop-it/backend" \
  --set frontend.image.repository="390402575145.dkr.ecr.eu-central-1.amazonaws.com/loop-it/frontend" \
  --wait --timeout=15m
```

## 📈 Monitoring Integration

### Enable Monitoring Stack
```bash
# Deploy monitoring namespace first
kubectl create namespace monitoring

# Install with monitoring enabled
helm upgrade --install loop-it . \
  --namespace loop-it \
  --values values-prod.yaml \
  --set monitoring.enabled=true \
  --set serviceMonitor.enabled=true
```

### Monitoring URLs (after deployment)
- **Grafana**: `http://monitoring.localhost/`
- **Prometheus**: `http://prometheus.localhost/`
- **Backend Metrics**: `http://<LB_URL>/metrics`

## 🔒 Security Best Practices

### Secrets Management
```bash
# Create secrets manually (recommended for production)
kubectl create secret generic loop-it-postgresql \
  --from-literal=postgres-user=loop_user \
  --from-literal=postgres-password=<secure-password> \
  --namespace loop-it

kubectl create secret generic loop-it-jwt \
  --from-literal=jwt-secret=<secure-jwt-secret> \
  --from-literal=jwt-refresh-secret=<secure-refresh-secret> \
  --namespace loop-it

# Deploy with external secrets
helm upgrade --install loop-it . \
  --namespace loop-it \
  --values values-prod.yaml \
  --set secrets.create=false \
  --set secrets.external.enabled=true \
  --set secrets.external.postgresqlSecretName=loop-it-postgresql \
  --set secrets.external.jwtSecretName=loop-it-jwt
```

### Network Policies
```bash
# Enable network policies for security
helm upgrade loop-it . \
  --namespace loop-it \
  --values values-prod.yaml \
  --set networkPolicy.enabled=true
```

## 🧪 Testing and Validation

### Health Checks
```bash
# Check all pods are running
kubectl get pods -n loop-it

# Check services
kubectl get svc -n loop-it

# Check ingress
kubectl get ingress -n loop-it

# Check HPA status
kubectl get hpa -n loop-it
```

### Application Testing
```bash
# Get Load Balancer URL
LB_URL=$(kubectl get ingress -n loop-it loop-it-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test frontend
curl -I http://$LB_URL/

# Test backend health
curl http://$LB_URL/api/health

# Test backend metrics
curl http://$LB_URL/metrics
```

### Load Testing
```bash
# Install artillery if enabled
helm upgrade loop-it . \
  --namespace loop-it \
  --values values-prod.yaml \
  --set loadTesting.enabled=true

# Run load test
kubectl run load-test --rm -it --image=artilleryio/artillery:latest \
  --restart=Never -- \
  quick --count 100 --num 10 http://$LB_URL/api/health
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to EKS
on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-central-1
      
      - name: Login to ECR
        run: |
          aws ecr get-login-password --region eu-central-1 | \
            docker login --username AWS --password-stdin \
            390402575145.dkr.ecr.eu-central-1.amazonaws.com
      
      - name: Build and push images
        run: |
          docker build -t $ECR_REGISTRY/loop-it/backend:$GITHUB_REF_NAME ./backend
          docker build -t $ECR_REGISTRY/loop-it/frontend:$GITHUB_REF_NAME ./frontend
          docker push $ECR_REGISTRY/loop-it/backend:$GITHUB_REF_NAME
          docker push $ECR_REGISTRY/loop-it/frontend:$GITHUB_REF_NAME
      
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --region eu-central-1 --name loop-it-cluster
          helm upgrade --install loop-it ./helm \
            --namespace loop-it \
            --values ./helm/values-prod.yaml \
            --set backend.image.tag=$GITHUB_REF_NAME \
            --set frontend.image.tag=$GITHUB_REF_NAME \
            --wait --timeout=15m
```

## 📋 Troubleshooting

### Common Issues

#### Pods not starting
```bash
# Check pod logs
kubectl logs -n loop-it deployment/loop-it-backend
kubectl logs -n loop-it deployment/loop-it-frontend

# Check events
kubectl get events -n loop-it --sort-by='.lastTimestamp'

# Check resource quotas
kubectl describe quota -n loop-it
```

#### Database connection issues
```bash
# Check PostgreSQL logs
kubectl logs -n loop-it deployment/loop-it-postgresql

# Test database connectivity
kubectl run postgresql-client --rm -it --image=postgres:17 \
  --restart=Never -- \
  psql -h loop-it-postgresql.loop-it.svc.cluster.local \
       -U loop_user -d loop-it
```

#### Ingress not working
```bash
# Check NGINX Ingress Controller
kubectl get pods -n ingress-nginx

# Check ingress status
kubectl describe ingress -n loop-it loop-it-ingress

# Check Load Balancer
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

### Debug Commands
```bash
# Get all resources
kubectl get all -n loop-it

# Check resource usage
kubectl top pods -n loop-it
kubectl top nodes

# Check storage
kubectl get pv,pvc -n loop-it

# Export current configuration
helm get values loop-it -n loop-it > current-values.yaml
```

## 📚 Additional Resources

- [Original k8s-aws README](./k8s-aws/README.md)
- [Terraform EKS Setup](./terraform-eks/)
- [Monitoring Stack Guide](./k8s-aws/monitoring/README.md)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)