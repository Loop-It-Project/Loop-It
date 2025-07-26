# terraform/ec2-main.tf - Clean version
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  ubuntu_ami = "ami-0dc33c9c954b3f073" # Ubuntu 22.04 LTS for eu-central-1, published 2025-07-12
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "loop-it"
}

variable "domain_name" {
  description = "Domain name"
  type        = string
  default     = "loopit.tech"
}


data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name = "loop-it/app"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  force_delete = true  # Für Demo - löscht Images beim destroy

  tags = {
    Name = "${var.project_name}-ecr-repo"
  }
}

# ECR Repository Policy
resource "aws_ecr_repository_policy" "app_policy" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPull"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

# Ensure images exist in ECR
resource "null_resource" "ensure_images" {
  triggers = {
    ecr_repo = aws_ecr_repository.app.repository_url
    always_run = timestamp() # Remove this if you want to build only once
  }

  provisioner "local-exec" {
    command = <<-EOT
      #!/bin/bash
      set -e
      
      ECR_REPO="${aws_ecr_repository.app.repository_url}"
      REGION="${var.aws_region}"
      
      echo "🔍 Ensuring images exist in ECR: $ECR_REPO"
      
      # Login to ECR
      aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO
      
      # Function to check if image exists
      check_image() {
        local tag=$1
        aws ecr describe-images --repository-name loop-it/app --image-ids imageTag=$tag --region $REGION >/dev/null 2>&1
        return $?
      }
      
      # Check and build backend if needed
      if ! check_image "backend-latest"; then
        echo "🔨 Building backend image..."
        if [ ! -d "../backend" ]; then
          echo "❌ backend/ directory not found. Please run from project root."
          exit 1
        fi
        cd ../backend
        docker build -t $ECR_REPO:backend-latest .
        docker push $ECR_REPO:backend-latest
        cd ../ec2-deploy
        echo "✅ Backend image built and pushed"
      else
        echo "✅ Backend image already exists in ECR"
      fi
      
      # Check and build frontend if needed
      if ! check_image "frontend-latest"; then
        echo "🔨 Building frontend image..."
        if [ ! -d "../frontend" ]; then
          echo "❌ frontend/ directory not found. Please run from project root."
          exit 1
        fi
        cd ../frontend
        docker build -t $ECR_REPO:frontend-latest .
        docker push $ECR_REPO:frontend-latest
        cd ../ec2-deploy
        echo "✅ Frontend image built and pushed"
      else
        echo "✅ Frontend image already exists in ECR"
      fi
      
      echo "🎉 All images available in ECR"
    EOT
    
    interpreter = ["bash", "-c"]
  }

  depends_on = [aws_ecr_repository.app]
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  vpc_id      = aws_vpc.main.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend Port
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Frontend Port
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-sg"
  }
}

# Key Pair for SSH access
resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-key"
  public_key = file("${path.module}/loop-it-key.pub")

  tags = {
    Name = "${var.project_name}-key"
  }
}

# EC2 Instance
resource "aws_instance" "web" {
  ami           = local.ubuntu_ami
  instance_type = "t3.small" # Free tier eligible
  key_name      = aws_key_pair.main.key_name

  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.web.id]
  associate_public_ip_address = true

  # Increased storage for Docker images
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    
    # Logging
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
    echo "Starting Loop-It EC2 setup with ECR images..."
    
    # Update system
    apt-get update && apt-get upgrade -y
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker ubuntu
    
    # Install Docker Compose and AWS CLI
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    apt-get install -y awscli nginx
    
    # Start Docker
    systemctl enable docker && systemctl start docker
    sleep 10
    
    # Login to ECR
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}
    
    # Pull images from ECR
    docker pull ${aws_ecr_repository.app.repository_url}:backend-latest
    docker pull ${aws_ecr_repository.app.repository_url}:frontend-latest
    docker pull postgres:17
    
    # Create app directory and docker-compose
    mkdir -p /opt/app && cd /opt/app
    
    # Get public IP for environment
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    
    # Create docker-compose.yml using ECR images
    cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  postgres:
    image: postgres:17
    container_name: loop-it-postgres
    environment:
      POSTGRES_DB: loopit
      POSTGRES_USER: loop_user
      POSTGRES_PASSWORD: demo-secure-password-123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U loop_user -d loopit"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    networks:
      - loop-it-network

  backend:
    image: ${aws_ecr_repository.app.repository_url}:backend-latest
    container_name: loop-it-backend
    environment:
      DATABASE_URL: postgresql://loop_user:demo-secure-password-123@postgres:5432/loopit
      PORT: 3000
      NODE_ENV: production
      JWT_SECRET: super-secure-jwt-secret-for-demo-2025
      JWT_REFRESH_SECRET: super-secure-refresh-secret-for-demo-2025
      JWT_EXPIRES_IN: 7d
      DB_HOST: postgres
      DB_PORT: 5432
      POSTGRES_USER: loop_user
      POSTGRES_PASSWORD: demo-secure-password-123
      POSTGRES_DB: loopit
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    networks:
      - loop-it-network

  frontend:
    image: ${aws_ecr_repository.app.repository_url}:frontend-latest
    container_name: loop-it-frontend
    ports:
      - "8080:8080"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    networks:
      - loop-it-network

volumes:
  postgres_data:

networks:
  loop-it-network:
    driver: bridge
EOL
    
    # Start containers
    docker-compose up -d
    
    # Setup Nginx reverse proxy with HTTPS support
    cat > /etc/nginx/sites-available/loop-it << 'EOL'
server {
    listen 80;
    server_name ${var.domain_name} www.${var.domain_name} _;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOL
    
    # Enable nginx
    ln -sf /etc/nginx/sites-available/loop-it /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    
    # Setup SSL script
    cat > /opt/app/setup-ssl.sh << 'EOL'
#!/bin/bash
echo "🔒 Setting up HTTPS for ${var.domain_name}..."
apt-get update && apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d ${var.domain_name} -d www.${var.domain_name} --non-interactive --agree-tos --email admin@${var.domain_name} --redirect
echo "0 12 * * * root /usr/bin/certbot renew --quiet" >> /etc/crontab
echo "✅ HTTPS setup completed!"
EOL
    chmod +x /opt/app/setup-ssl.sh
    
    # Create monitoring script
    cat > /opt/app/monitor.sh << 'EOL'
#!/bin/bash
echo "=== Loop-It Status ==="
echo "Time: $(date)"
echo ""
echo "=== Containers ==="
docker-compose ps
echo ""
echo "=== Health Checks ==="
curl -s http://localhost/health && echo "✅ App healthy" || echo "❌ App unhealthy"
curl -s http://localhost:3000/health && echo "✅ Backend healthy" || echo "❌ Backend unhealthy"  
curl -s http://localhost:8080 && echo "✅ Frontend healthy" || echo "❌ Frontend unhealthy"
docker-compose exec -T postgres pg_isready -U loop_user -d loopit && echo "✅ Database healthy" || echo "❌ Database unhealthy"
EOL
    chmod +x /opt/app/monitor.sh
    
    # Wait for containers to be healthy
    echo "Waiting for containers to start..."
    sleep 90
    
    # Final health check
    bash /opt/app/monitor.sh
    
    echo "🎉 Setup completed! App available at: http://$PUBLIC_IP"
    echo "📱 Frontend: http://$PUBLIC_IP"
    echo "🔧 Backend: http://$PUBLIC_IP/api" 
    echo "❤️ Health: http://$PUBLIC_IP/health"
    echo "🌐 Domain: https://${var.domain_name} (after DNS + SSL setup)"
    
    echo "Setup completed at $(date)" >> /var/log/setup-complete.log
  EOF
  )

  depends_on = [null_resource.ensure_images]

  tags = {
    Name = "${var.project_name}-instance"
  }
}

# Elastic IP
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }
}

# Outputs  
output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.web.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i loop-it-key.pem ubuntu@${aws_eip.web.public_ip}"
}

output "application_url" {
  description = "URL to access your application"
  value       = "http://${aws_eip.web.public_ip}"
}

output "api_url" {
  description = "API URL"
  value       = "http://${aws_eip.web.public_ip}/api"
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "domain_setup_instructions" {
  description = "Instructions for domain setup"
  value = <<-EOT
    
    🌐 DOMAIN SETUP INSTRUCTIONS:
    
    1. Go to Ionos DNS settings for ${var.domain_name}
    2. Create these A records:
       - ${var.domain_name}       → ${aws_eip.web.public_ip}
       - www.${var.domain_name}   → ${aws_eip.web.public_ip}
    
    3. Wait 5-15 minutes for DNS propagation
    
    4. Setup HTTPS:
       ssh -i loop-it-key.pem ubuntu@${aws_eip.web.public_ip}
       sudo /opt/app/setup-ssl.sh
    
    5. Your app will be available at:
       - https://${var.domain_name} (with SSL)
       - http://${aws_eip.web.public_ip} (without SSL)
  EOT
}

output "force_rebuild_command" {
  description = "Command to force rebuild all images"
  value = "terraform apply -replace=null_resource.ensure_images"
}