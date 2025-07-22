# terraform-eks/bootstrap/oidc-setup.tf

# Random suffix für S3 Bucket Namen
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# ============================================================================
# GITHUB OIDC PROVIDER
# ============================================================================

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]
  
  # Moderne Version: Keine Thumbprints mehr nötig!
  # AWS verwaltet vertrauenswürdige Provider automatisch

  tags = {
    Name = "${var.project_name}-github-oidc-provider"
  }
}

# ============================================================================
# S3 BUCKET FÜR TERRAFORM STATE
# ============================================================================

resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-terraform-state-${random_id.bucket_suffix.hex}"
  
  tags = {
    Name        = "${var.project_name}-terraform-state"
    Description = "Terraform Remote State Storage"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# GITHUB ACTIONS IAM ROLE
# ============================================================================

# GitHub Actions IAM Role
resource "aws_iam_role" "github_actions" {
  name = "${var.project_name}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-github-actions-role"
  }
}

# IAM Policy für Infrastructure Management
resource "aws_iam_role_policy" "github_actions_infrastructure" {
  name = "infrastructure-management"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # EKS Management
      {
        Effect = "Allow"
        Action = [
          "eks:*",
        ]
        Resource = "*"
      },
      # EC2 für EKS Nodes & VPC
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
        ]
        Resource = "*"
      },
      # IAM für EKS Cluster & Node Groups
      {
        Effect = "Allow"
        Action = [
          "iam:*",
        ]
        Resource = "*"
      },
      # ECR für Container Images
      {
        Effect = "Allow"
        Action = [
          "ecr:*",
        ]
        Resource = "*"
      },
      # S3 State Management
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
      },
      # CloudWatch Logs
      {
        Effect = "Allow"
        Action = [
          "logs:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# OUTPUTS FÜR GITHUB SECRETS
# ============================================================================

output "github_role_arn" {
  description = "ARN der GitHub Actions IAM Role"
  value       = aws_iam_role.github_actions.arn
}

output "s3_bucket_name" {
  description = "S3 Bucket Name für Terraform State"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "aws_region" {
  description = "AWS Region"
  value       = var.aws_region
}

output "oidc_provider_arn" {
  description = "GitHub OIDC Provider ARN"
  value       = aws_iam_openid_connect_provider.github.arn
}

# Für Backend Konfiguration
output "backend_config" {
  description = "Backend Konfiguration für terraform-eks/"
  value = {
    bucket         = aws_s3_bucket.terraform_state.bucket
    key            = "infrastructure/terraform.tfstate"
    region         = var.aws_region
    encrypt        = true
    use_lockfile   = true
  }
}