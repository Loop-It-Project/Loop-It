#!/bin/bash

echo "🚀 Loop-It AWS EKS + ECR Deployment"
echo "==================================="

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_step() { echo -e "${BLUE}$1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Check if we're in the right directory
if [[ ! -f "postgres.yaml" || ! -f "../terraform-eks/main.tf" ]]; then
    log_error "Run this script from k8s-aws/ directory"
fi

# 1. Deploy Terraform Infrastructure + ECR
log_step "🏗️ Deploying Terraform Infrastructure + ECR..."
cd ../terraform-eks

terraform init
terraform apply -auto-approve

# Get outputs
AWS_REGION=$(terraform output -raw aws_region)
CLUSTER_NAME=$(terraform output -raw cluster_name)
BACKEND_ECR_URL=$(terraform output -raw ecr_backend_repository_url 2>/dev/null || echo "")
FRONTEND_ECR_URL=$(terraform output -raw ecr_frontend_repository_url 2>/dev/null || echo "")

if [[ -z "$BACKEND_ECR_URL" ]]; then
    log_error "ECR repositories not found in Terraform outputs. Add ECR resources to main.tf"
fi

log_success "Infrastructure deployed"
echo "Backend ECR: $BACKEND_ECR_URL"
echo "Frontend ECR: $FRONTEND_ECR_URL"

# 2. Configure kubectl
log_step "⚙️ Configuring kubectl..."
aws eks --region $AWS_REGION update-kubeconfig --name $CLUSTER_NAME
log_success "kubectl configured"

# 3. Install NGINX Ingress Controller
log_step "🌐 Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.13.0/deploy/static/provider/aws/deploy.yaml

log_step "⏳ Waiting for NGINX Ingress Controller..."
kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=300s

log_success "NGINX Ingress Controller ready"

# 4. ECR Login
log_step "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(echo $BACKEND_ECR_URL | cut -d'/' -f1)
log_success "ECR login successful"

# 5. Build and Push Images
log_step "🔨 Building and pushing Docker images..."
cd ..

# Backend Image
if [[ -d "backend" ]]; then
    log_step "Building Backend Image..."
    docker build -t loop-it-backend:latest ./backend
    docker tag loop-it-backend:latest $BACKEND_ECR_URL:latest
    docker tag loop-it-backend:latest $BACKEND_ECR_URL:v$(date +%Y%m%d%H%M%S)
    
    log_step "Pushing Backend Image to ECR..."
    docker push $BACKEND_ECR_URL:latest
    docker push $BACKEND_ECR_URL:v$(date +%Y%m%d%H%M%S)
    log_success "Backend image pushed"
else
    log_warning "Backend directory not found, using placeholder image"
    BACKEND_ECR_URL="node:22-alpine"
fi

# Frontend Image
if [[ -d "frontend" ]]; then
    # Get Load Balancer URL for frontend build
    LB_URL=""
    log_step "Waiting for Load Balancer URL..."
    for i in {1..30}; do
        LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
        if [[ -n "$LB_URL" ]]; then
            break
        fi
        sleep 10
    done
    
    if [[ -z "$LB_URL" ]]; then
        log_warning "Load Balancer URL not ready, using placeholder"
        LB_URL="localhost"
    fi
    
    log_step "Building Frontend Image with API URL: http://$LB_URL"
    docker build --build-arg VITE_API_URL=http://$LB_URL -t loop-it-frontend:latest ./frontend
    docker tag loop-it-frontend:latest $FRONTEND_ECR_URL:latest
    docker tag loop-it-frontend:latest $FRONTEND_ECR_URL:v$(date +%Y%m%d%H%M%S)
    
    log_step "Pushing Frontend Image to ECR..."
    docker push $FRONTEND_ECR_URL:latest
    docker push $FRONTEND_ECR_URL:v$(date +%Y%m%d%H%M%S)
    log_success "Frontend image pushed"
else
    log_warning "Frontend directory not found, using placeholder image"
    FRONTEND_ECR_URL="nginx:alpine"
fi

# 6. Deploy Kubernetes Resources
log_step "📦 Deploying Kubernetes Resources..."
cd k8s-aws

# Create namespace and secrets
kubectl create namespace loop-it --dry-run=client -o yaml | kubectl apply -f -

POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

kubectl create secret generic loopit-secrets \
    --from-literal=postgres-user=loop_user \
    --from-literal=postgres-password=$POSTGRES_PASSWORD \
    --from-literal=jwt-secret=$JWT_SECRET \
    --from-literal=jwt-refresh-secret=$JWT_REFRESH_SECRET \
    --namespace=loop-it \
    --dry-run=client -o yaml | kubectl apply -f -

# Deploy in order
log_step "Deploying PostgreSQL..."
kubectl apply -f postgres.yaml
kubectl wait --for=condition=available deployment/postgres -n loop-it --timeout=120s

log_step "Deploying Backend..."
kubectl apply -f backend.yaml
if [[ "$BACKEND_ECR_URL" != "node:22-alpine" ]]; then
    kubectl set image deployment/backend backend=$BACKEND_ECR_URL:latest -n loop-it
fi
kubectl wait --for=condition=available deployment/backend -n loop-it --timeout=180s

log_step "Deploying Frontend..."
kubectl apply -f frontend.yaml
if [[ "$FRONTEND_ECR_URL" != "nginx:alpine" ]]; then
    kubectl set image deployment/frontend frontend=$FRONTEND_ECR_URL:latest -n loop-it
fi
kubectl wait --for=condition=available deployment/frontend -n loop-it --timeout=120s

log_step "Deploying Ingress..."
kubectl apply -f aws-ingress.yaml

# 7. Final Status
log_success "🎉 Loop-It successfully deployed!"
echo ""
echo -e "${BLUE}📊 Deployment Status:${NC}"
kubectl get pods -n loop-it
echo ""
kubectl get services -n loop-it
echo ""

# Get final Load Balancer URL
FINAL_LB_URL=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "Frontend: http://$FINAL_LB_URL/"
echo "Backend Health: http://$FINAL_LB_URL/api/health"
echo ""
echo -e "${BLUE}🐳 ECR Repositories:${NC}"
echo "Backend: $BACKEND_ECR_URL"
echo "Frontend: $FRONTEND_ECR_URL"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Test the application: http://$FINAL_LB_URL/"
echo "2. Deploy monitoring: ./monitoring/deploy-monitoring.sh"
echo "3. Run load tests: ./load-testing/stress-test.yml"

log_success "Deployment completed successfully!"