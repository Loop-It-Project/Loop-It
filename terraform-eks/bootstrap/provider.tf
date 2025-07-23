# terraform-eks/bootstrap/provider.tf

terraform {
  required_version = ">= 1.12.2"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
  
  # Bootstrap verwendet lokalen State!
  # Nach dem Bootstrap wird der Hauptcluster S3 verwenden
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = var.tags
  }
}