# terraform-eks/storage-classes.tf
# Storage Classes for EKS

# GP3 Storage Class (High Performance, Cost Optimized)
resource "kubernetes_storage_class" "gp3" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name = "gp3"
    annotations = {
      "storageclass.kubernetes.io/is-default-class" = "true"
    }
  }

  storage_provisioner    = "ebs.csi.aws.com"
  volume_binding_mode    = "WaitForFirstConsumer"
  allow_volume_expansion = true

  parameters = {
    type       = "gp3"
    encrypted  = "true"
    throughput = "125"  # MB/s
    iops       = "3000" # Default for GP3
  }

  depends_on = [
    module.eks  # Ensure EKS cluster with EBS CSI driver is ready
  ]
}

# Optional: GP2 Storage Class (Fallback)
resource "kubernetes_storage_class" "gp2_fallback" {
  count = var.deploy_applications ? 1 : 0
  
  metadata {
    name = "gp2-fallback"
    annotations = {
      "storageclass.kubernetes.io/is-default-class" = "false"
    }
  }

  storage_provisioner    = "ebs.csi.aws.com"
  volume_binding_mode    = "WaitForFirstConsumer"
  allow_volume_expansion = true

  parameters = {
    type      = "gp2"
    encrypted = "true"
  }

  depends_on = [
    module.eks
  ]
}