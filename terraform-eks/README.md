# Loop-It EKS Infrastructure

Production-ready Amazon EKS cluster for the Loop-It application using Infrastructure as Code with Terraform.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Account (eu-central-1)              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                VPC (10.0.0.0/16)                   │   │
│  │                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │ Public AZ-1a │  │ Public AZ-1b │  │ Public AZ-1c │ │   │
│  │  │ 10.0.4.0/24  │  │ 10.0.5.0/24  │  │ 10.0.6.0/24  │ │   │
│  │  │              │  │              │  │              │ │   │
│  │  │ [NAT GW] ────┼──┼──────────────┼──┼──────────────┤ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  │                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │ Private AZ-1a│  │ Private AZ-1b│  │ Private AZ-1c│ │   │
│  │  │ 10.0.1.0/24  │  │ 10.0.2.0/24  │  │ 10.0.3.0/24  │ │   │
│  │  │              │  │              │  │              │ │   │
│  │  │ [EKS Nodes]  │  │ [EKS Nodes]  │  │ [EKS Nodes]  │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 EKS Cluster                        │   │
│  │                (Kubernetes 1.33)                   │   │
│  │                                                     │   │
│  │  • Control Plane (Managed by AWS)                  │   │
│  │  • Node Group: 1-6 t3.small On-Demand Instances   │   │
│  │  • Add-ons: CoreDNS, VPC-CNI, EBS CSI Driver      │   │
│  │  • CloudWatch Logging Enabled                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
terraform-eks/
├── provider.tf          # Terraform & AWS provider configuration
├── variables.tf         # Input variable definitions
├── main.tf             # Main infrastructure resources (VPC, EKS)
├── outputs.tf          # Output values and useful information
├── terraform.tfvars    # Environment-specific configuration values
├── terraform.tfstate   # Terraform state file (DO NOT commit to Git)
└── README.md           # This documentation
```

## ⚙️ Infrastructure Components

### Core Infrastructure
- **VPC**: Multi-AZ setup with public and private subnets
- **EKS Cluster**: Kubernetes 1.33 with managed control plane
- **Node Group**: Auto-scaling worker nodes (1-6 instances)
- **Security Groups**: Restrictive firewall rules
- **IAM Roles**: Least-privilege access policies

### Networking
- **Public Subnets**: Internet Gateway access for Load Balancers
- **Private Subnets**: Worker nodes isolated from direct internet access
- **NAT Gateway**: Single NAT for cost optimization (outbound internet)
- **DNS**: Route53 integration ready

### Storage & Add-ons
- **EBS CSI Driver**: Dynamic volume provisioning
- **GP3 Storage Class**: High-performance, cost-optimized storage
- **CoreDNS**: Cluster DNS resolution
- **VPC CNI**: Advanced Kubernetes networking

## 💰 Cost Optimization

Current configuration optimized for development/demo environments:

| Component | Configuration | Monthly Cost (EUR) |
|-----------|---------------|-------------------|
| EKS Cluster | Control Plane | €73 |
| EC2 Instances | 1x t3.small On-Demand | €13 |
| NAT Gateway | Single NAT (all AZs) | €8 |
| EBS Storage | GP3 volumes | €2 |
| **Total** | | **€96/month** |

### Cost Optimization Features
- ✅ **Single NAT Gateway** (saves ~€20/month vs. multi-AZ)
- ✅ **GP3 Storage** (20% cheaper than GP2)
- ✅ **Right-sized instances** (t3.small for development)
- ✅ **Auto-scaling** (scales down when not needed)

## 🚀 Getting Started

### Prerequisites
- **AWS CLI** v2+ installed and configured
- **Terraform** v1.0+ installed
- **kubectl** installed
- **Valid AWS credentials** with EKS permissions

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd terraform-eks

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars
```

### 2. Configure Variables
Edit `terraform.tfvars`:
```hcl
# Basic Configuration
aws_region = "eu-central-1"
environment = "production"
cluster_name = "loop-it-cluster"

# Node Configuration
node_instance_types = ["t3.small"]
node_desired_capacity = 1
node_max_capacity = 2
node_min_capacity = 1
enable_spot_instances = false  # true for 70% cost savings (less stable)
```

### 3. Deploy Infrastructure
```bash
# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Deploy infrastructure (15-20 minutes)
terraform apply
```

### 4. Configure kubectl
```bash
# Configure kubectl to access the cluster
aws eks update-kubeconfig --region eu-central-1 --name loop-it-cluster

# Verify cluster access
kubectl get nodes
kubectl get pods -n kube-system
```

## 🔧 Configuration Options

### Environment Configurations

#### Development (Minimal Cost)
```hcl
node_instance_types = ["t3.small"]
node_desired_capacity = 1
node_max_capacity = 2
enable_spot_instances = true
# Cost: ~€60/month
```

#### Production (High Availability)
```hcl
node_instance_types = ["t3.medium", "t3.large"]
node_desired_capacity = 3
node_max_capacity = 10
enable_spot_instances = false
# Cost: ~€180/month
```

#### Load Testing (Scalable)
```hcl
node_instance_types = ["t3.medium", "t3.large", "t3.xlarge"]
node_desired_capacity = 2
node_max_capacity = 20
enable_spot_instances = true
# Cost: ~€95-300/month (depending on load)
```

### Available Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `aws_region` | string | `eu-central-1` | AWS region for deployment |
| `environment` | string | `production` | Environment name |
| `cluster_name` | string | `loop-it-cluster` | EKS cluster name |
| `node_instance_types` | list(string) | `["t3.medium", "t3.large"]` | EC2 instance types |
| `node_desired_capacity` | number | `2` | Desired number of nodes |
| `node_max_capacity` | number | `6` | Maximum number of nodes |
| `node_min_capacity` | number | `1` | Minimum number of nodes |
| `enable_spot_instances` | bool | `true` | Use Spot instances for cost savings |

## 📊 Outputs

After successful deployment, Terraform provides useful outputs:

```bash
# View all outputs
terraform output

# Specific outputs
terraform output cluster_name
terraform output cluster_endpoint
terraform output configure_kubectl
```

### Available Outputs
- **cluster_name**: EKS cluster name
- **cluster_endpoint**: Kubernetes API server endpoint
- **vpc_id**: VPC identifier
- **private_subnet_ids**: Private subnet identifiers
- **estimated_monthly_cost**: Cost estimation
- **configure_kubectl**: kubectl configuration command

## 🛠️ Management Commands

### Scaling Operations
```bash
# Scale up nodes
terraform apply -var="node_desired_capacity=3"

# Scale down nodes (cost saving)
terraform apply -var="node_desired_capacity=0"

# Enable Spot instances (70% cost savings)
terraform apply -var="enable_spot_instances=true"
```

### Cluster Operations
```bash
# Cluster status
kubectl get nodes -o wide
kubectl get pods -n kube-system

# Resource usage
kubectl top nodes
kubectl top pods -A

# Cluster info
kubectl cluster-info
```

### Cost Monitoring
```bash
# Check current AWS costs
aws ce get-cost-and-usage \
  --time-period Start=2025-07-01,End=2025-07-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 🔐 Security Features

### Implemented Security Controls
- **Private Subnets**: Worker nodes isolated from direct internet access
- **Security Groups**: Restrictive inbound/outbound rules
- **IAM Roles**: Least-privilege principle applied
- **Encryption**: EBS volumes encrypted at rest
- **CloudWatch Logging**: Comprehensive audit trails
- **VPC Flow Logs**: Network traffic monitoring

### Network Security
- **No Public SSH Access**: Worker nodes not directly accessible
- **Security Group Rules**: Only necessary ports open
- **Private Endpoints**: EKS API accessible privately
- **NAT Gateway**: Controlled outbound internet access

### Access Control
- **RBAC**: Kubernetes role-based access control
- **AWS IAM Integration**: Native AWS user management
- **Service Accounts**: Fine-grained pod permissions
- **Pod Security Standards**: Restricted pod security policies

## 🚨 Troubleshooting

### Common Issues

#### kubectl Access Denied
```bash
# Check current AWS identity
aws sts get-caller-identity

# Reconfigure kubectl
aws eks update-kubeconfig --region eu-central-1 --name loop-it-cluster

# Add your user to cluster access (if needed)
aws eks create-access-entry \
  --cluster-name loop-it-cluster \
  --principal-arn $(aws sts get-caller-identity --query Arn --output text) \
  --type STANDARD
```

#### Node Group Creation Failed
```bash
# Check service quotas
aws service-quotas get-service-quota \
  --service-code ec2 \
  --quota-code L-1216C47A

# Try different instance types
terraform apply -var='node_instance_types=["t3.small"]'
```

#### High Costs
```bash
# Scale down nodes
terraform apply -var="node_desired_capacity=0"

# Enable Spot instances
terraform apply -var="enable_spot_instances=true"

# Check AWS Cost Explorer for detailed breakdown
```

### Debug Commands
```bash
# Terraform debugging
export TF_LOG=DEBUG
terraform apply

# Kubernetes events
kubectl get events --sort-by=.metadata.creationTimestamp

# AWS CLI debugging
aws eks describe-cluster --name loop-it-cluster --region eu-central-1
```

## 🧹 Cleanup

### Complete Infrastructure Removal
```bash
# Remove all resources
terraform destroy

# Verify cleanup
aws eks list-clusters --region eu-central-1
aws ec2 describe-vpcs --region eu-central-1
```

⚠️ **Warning**: This will permanently delete all infrastructure and data!

## 📈 Next Steps

### Day 2 Operations
1. **Deploy NGINX Ingress Controller**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml
   ```

2. **Install cert-manager for SSL**
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

3. **Deploy Loop-It Application**
   ```bash
   kubectl apply -f k8s/ -n loop-it-production
   ```

4. **Set up Monitoring**
   ```bash
   kubectl apply -f k8s/monitoring/
   ```

### Production Enhancements
- **GitOps with ArgoCD**: Automated deployments
- **Monitoring Stack**: Prometheus, Grafana, Loki
- **Service Mesh**: Istio for advanced traffic management
- **Backup Strategy**: Velero for cluster backups
- **Multi-Environment**: Staging and production clusters

## 📚 Documentation

### Terraform Modules Used
- [terraform-aws-modules/vpc/aws](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest) - VPC infrastructure
- [terraform-aws-modules/eks/aws](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest) - EKS cluster

### Official Documentation
- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Update configuration
3. Test with `terraform plan`
4. Submit pull request
5. Deploy after review

### Best Practices
- Always run `terraform plan` before `apply`
- Use meaningful commit messages
- Document configuration changes
- Test in development environment first
- Monitor costs after changes

---

## 📋 Quick Reference

### Essential Commands
```bash
# Deploy
terraform init && terraform apply

# Scale
terraform apply -var="node_desired_capacity=3"

# Access
aws eks update-kubeconfig --region eu-central-1 --name loop-it-cluster

# Monitor
kubectl get nodes && kubectl top nodes

# Clean up
terraform destroy
```

### Important Files
- `terraform.tfvars` - Your configuration
- `terraform.tfstate` - Current infrastructure state
- `outputs.tf` - Available information after deployment
- `.terraform/` - Downloaded providers and modules

### Support
- **AWS Documentation**: [docs.aws.amazon.com/eks](https://docs.aws.amazon.com/eks/)
- **Terraform Registry**: [registry.terraform.io](https://registry.terraform.io)
- **Kubernetes Docs**: [kubernetes.io/docs](https://kubernetes.io/docs/)

---

**🎯 Goal**: Production-ready Kubernetes infrastructure for Loop-It application with cost optimization and security best practices.