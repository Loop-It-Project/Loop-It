resource "aws_ecr_repository" "backend" {
  name = "loop-it/backend"
}

resource "aws_ecr_repository" "frontend" {
  name = "loop-it/frontend"
}
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }

  tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    Environment = var.environment
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.33"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    main = {
      name            = "main-nodes"
      instance_types  = var.node_instance_types
      capacity_type   = var.enable_spot_instances ? "SPOT" : "ON_DEMAND"
      min_size        = var.node_min_capacity
      max_size        = var.node_max_capacity
      desired_size    = var.node_desired_capacity
      disk_size       = 20
      disk_type       = "gp3"
      labels = {
        Environment   = var.environment
        NodeGroup     = "main"
        CostOptimized = var.enable_spot_instances ? "true" : "false"
      }
      taints = var.enable_spot_instances ? [{
        key    = "node.kubernetes.io/instance-type"
        value  = "spot"
        effect = "NO_SCHEDULE"
      }] : []
      tags = {
        "k8s.io/cluster-autoscaler/enabled" = "true"
        "k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
      }
    }
  }

  enable_cluster_creator_admin_permissions = true

  cluster_addons = {
    coredns             = { most_recent = true }
    kube-proxy          = { most_recent = true }
    vpc-cni             = { most_recent = true }
    aws-ebs-csi-driver  = { most_recent = true }
  }

  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "Loop-It"
  }
}

## resource "kubernetes_storage_class" "gp3" {
##   metadata {
##     name = "gp3"
##     annotations = {
##       "storageclass.kubernetes.io/is-default-class" = "true"
##     }
##   }
##
##   storage_provisioner    = "ebs.csi.aws.com"
##   volume_binding_mode    = "WaitForFirstConsumer"
##   allow_volume_expansion = true
##
##   parameters = {
##     type       = "gp3"
##     encrypted  = "true"
##     throughput = "125"
##     iops       = "3000"
##   }
##
##   depends_on = [module.eks]
## }

## resource "kubernetes_namespace" "loop_it" {
##   metadata {
##     name = "loop-it-${var.environment}"
##     labels = {
##       name        = "loop-it-${var.environment}"
##       environment = var.environment
##       project     = "loop-it"
##     }
##   }
##
##   depends_on = [module.eks]
## }
