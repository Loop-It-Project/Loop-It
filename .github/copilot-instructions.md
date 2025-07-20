# Loop-It AI Coding Agent Instructions

## Project Architecture

- **Monorepo**: Contains `frontend` (React + Vite), `backend` (Node.js + Express + Drizzle ORM), `terraform-eks` (AWS EKS IaC), `k8s` (Kubernetes manifests), `monitoring` (Prometheus, Grafana, Loki), and `gitops` (ArgoCD/Kustomize overlays).
- **Data Flow**: Frontend communicates with backend via `/api/*` endpoints. Backend connects to PostgreSQL using Drizzle ORM. Monitoring stack scrapes metrics from backend and infrastructure.
- **Routing**: NGINX Ingress routes `/api/*` to backend, `/` to frontend, `/health` and `/metrics` to backend health/metrics endpoints.

## Developer Workflows

- **Build & Deploy**:
  - Frontend: `docker build` with `VITE_API_URL` set to backend LB URL. Push to ECR.
  - Backend: `docker build` and push to ECR.
  - Infrastructure: Use Terraform (`terraform init/plan/apply`) for EKS, VPC, and K8s resources. Use `kubectl` for direct cluster operations.
  - Monitoring: Deploy via Helm charts in `k8s/loopit-monitoring`.
- **Secrets**: Store sensitive values in `secrets.tfvars` (never commit). Reference in Terraform and K8s manifests.
- **Debugging**: Use provided aliases (`k`, `kgp`, `kgs`, `kl`) and scripts for cluster/resource status, logs, and health checks.

## Conventions & Patterns

- **Frontend**: Uses TailwindCSS, Lucide icons, React Router. Components and pages are organized by feature. Utility classes and theme variables defined in `src/index.css`.
- **Backend**: Organized by domain (`controllers`, `services`, `db`, `middleware`). Database migrations and seeds via npm scripts (`db:generate`, `db:push`, `db:seed`).
- **K8s/Infra**: All environments use overlays (`gitops/environments`). Resource requests/limits and health checks are standardized in base manifests. Monitoring annotations are auto-applied for Prometheus scraping.
- **Testing**: No global test runner; follow local patterns in each package.

## Integration Points

- **External**: AWS (EKS, ECR, NLB, S3), Prometheus/Grafana/Loki, ArgoCD for GitOps.
- **Internal**: All services communicate via K8s service names and environment variables. Use provided scripts for DB migration and cluster setup.

## Key Files & Directories

- `terraform-eks/README.md`: Full deployment, troubleshooting, and operational guide.
- `backend/src/db/README.md`: Database schema, migration, and legacy mapping.
- `frontend/src/index.css`: Theme and utility class definitions.
- `k8s/loopit-monitoring/README.md`: Monitoring stack setup and management.
- `gitops/README.md`: GitOps and Kustomize overlays.
- `docs/technical_plan.md`: Architecture, tech stack, and design rationale.

## Example: Deploying a Change

1. Update code in `frontend` or `backend`.
2. Build Docker image and push to ECR.
3. Update K8s manifests or Terraform variables if needed.
4. Apply changes via `terraform apply` or `kubectl rollout restart`.
5. Verify with health checks and logs.

## Tips for AI Agents

- Always check for environment-specific overlays in `gitops/environments`.
- Use provided aliases and scripts for cluster operations.
- Reference `terraform-eks/README.md` for any infrastructure or deployment questions.
- Never commit secrets or sensitive values.
- Follow existing patterns for resource requests, health checks, and logging.
