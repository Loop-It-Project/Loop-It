#!/bin/bash
# build-and-deploy.sh - Build, Push to ECR, Deploy to EC2

set -e

# Configuration
AWS_REGION="eu-central-1"
AWS_ACCOUNT_ID="390402575145"
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/loop-it/app"
EC2_IP="$(terraform output -raw instance_public_ip 2>/dev/null || echo 'TERRAFORM_OUTPUT_MISSING')"

echo "🚀 Building and deploying Loop-It to EC2..."

# Step 1: Login to ECR
echo "📦 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPO}

# Step 2: Build Backend Image
echo "🔨 Building backend image..."
cd backend
docker build -t ${ECR_REPO}:backend-latest .
cd ..

# Step 3: Build Frontend Image  
echo "🔨 Building frontend image..."
cd frontend
docker build -t ${ECR_REPO}:frontend-latest .
cd ..

# Step 4: Push Images to ECR
echo "📤 Pushing backend image..."
docker push ${ECR_REPO}:backend-latest

echo "📤 Pushing frontend image..."
docker push ${ECR_REPO}:frontend-latest

# Step 5: Deploy to EC2
if [ "$EC2_IP" != "TERRAFORM_OUTPUT_MISSING" ]; then
    echo "🚀 Deploying to EC2 at $EC2_IP..."
    
    # SSH and update containers
    ssh -i loop-it-key.pem ubuntu@${EC2_IP} << 'EOF'
        cd /opt/app
        
        # Login to ECR on EC2
        aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 390402575145.dkr.ecr.eu-central-1.amazonaws.com
        
        # Pull latest images
        docker-compose pull
        
        # Restart with new images
        docker-compose down
        docker-compose up -d
        
        # Wait and check health
        sleep 30
        ./monitor.sh
EOF
    
    echo "✅ Deployment completed!"
    echo "🌐 App URL: http://$EC2_IP"
    echo "🌐 Domain: https://loopit.tech (if DNS configured)"
    
else
    echo "⚠️  EC2 not found. Run 'terraform apply' first."
    echo "📋 Manual deployment command:"
    echo "   ssh -i loop-it-key.pem ubuntu@YOUR_EC2_IP"
    echo "   cd /opt/app && docker-compose pull && docker-compose up -d"
fi

echo "🎉 Build and deploy process completed!"