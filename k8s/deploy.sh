#!/bin/bash

echo "🚀 Loop-It Kubernetes - Vollständiges Deployment mit Ingress"
echo "============================================================="

# Prüfe ob Kubernetes läuft
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes ist nicht verfügbar. Ist Docker Desktop gestartet?"
    echo "   Settings → Kubernetes → Enable Kubernetes"
    exit 1
fi

echo "✅ Kubernetes in Docker Desktop gefunden"

# 1. NGINX Ingress Controller installieren
echo "🌐 Prüfe NGINX Ingress Controller..."
if ! kubectl get namespace ingress-nginx &> /dev/null; then
    echo "  -> Installiere NGINX Ingress Controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
    
    echo "  -> Warte auf NGINX Ingress Controller..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    echo "✅ NGINX Ingress Controller installiert"
else
    echo "✅ NGINX Ingress Controller bereits vorhanden"
fi

# 2. Docker Images bauen
echo "🔨 Baue Docker Images..."
docker build -t loopit/backend:latest ./backend
if [ $? -eq 0 ]; then
    echo "✅ Backend Image gebaut"
else
    echo "❌ Backend Image konnte nicht gebaut werden"
    exit 1
fi

# Frontend mit API URL für Ingress Setup
docker build --build-arg VITE_API_URL=http://localhost -t loopit/frontend:latest ./frontend
if [ $? -eq 0 ]; then
    echo "✅ Frontend Image gebaut (für Ingress Setup)"
else
    echo "❌ Frontend Image konnte nicht gebaut werden"
    exit 1
fi

# 3. Cleanup alte Deployments
echo "🧹 Cleanup alte Deployments..."
kubectl delete namespace loopit-dev --ignore-not-found=true
sleep 10

# 4. Namespace erstellen
echo "📦 Erstelle Namespace..."
kubectl create namespace loopit-dev
sleep 2

# 5. Secrets generieren
echo "🔐 Generiere und erstelle Secrets..."
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

echo "Generierte Secrets:"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"
echo ""

kubectl create secret generic loopit-secrets -n loopit-dev \
    --from-literal=postgres-password="$POSTGRES_PASSWORD" \
    --from-literal=jwt-secret="$JWT_SECRET" \
    --from-literal=jwt-refresh-secret="$JWT_REFRESH_SECRET"

if [ $? -eq 0 ]; then
    echo "✅ Secrets erfolgreich erstellt"
else
    echo "❌ Secret-Erstellung fehlgeschlagen"
    exit 1
fi

# 6. Kubernetes Services deployen
echo "📋 Deploye Kubernetes Services..."

echo "  -> PostgreSQL..."
kubectl apply -f k8s/postgres.yaml

echo "  -> Backend..."
kubectl apply -f k8s/backend.yaml

echo "  -> Frontend..."
kubectl apply -f k8s/frontend.yaml

echo "  -> Ingress..."
kubectl apply -f k8s/ingress.yaml

echo "✅ Alle Services deployed"

# 7. Warte auf Pods
echo "⏳ Warte auf Pods..."

echo "  -> Warte auf PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n loopit-dev --timeout=120s

echo "  -> Warte auf Backend..."
kubectl wait --for=condition=ready pod -l app=backend -n loopit-dev --timeout=120s

echo "  -> Warte auf Frontend..."
kubectl wait --for=condition=ready pod -l app=frontend -n loopit-dev --timeout=120s

echo ""
echo "🎉 Alle Pods sind bereit!"

# 8. Status anzeigen
echo ""
echo "📊 Deployment Status:"
kubectl get pods -n loopit-dev
echo ""
kubectl get services -n loopit-dev
echo ""
kubectl get ingress -n loopit-dev

# 9. Ingress IP prüfen
echo ""
echo "🔍 Ingress Details:"
INGRESS_IP=$(kubectl get ingress loopit-ingress -n loopit-dev -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -z "$INGRESS_IP" ]; then
    INGRESS_IP="localhost"
fi
echo "  Ingress IP: $INGRESS_IP"

# 10. Port-Forwards stoppen (nicht mehr nötig mit Ingress)
echo ""
echo "🔌 Stoppe alte Port-Forwards..."
if command -v tasklist &> /dev/null; then
    # Windows
    tasklist | findstr kubectl | while read line; do
        pid=$(echo $line | awk '{print $2}')
        if [ ! -z "$pid" ]; then
            taskkill //PID $pid //F 2>/dev/null
        fi
    done
else
    # Linux/Mac
    pkill -f "kubectl port-forward" 2>/dev/null
fi

echo ""
echo "🎉 Deployment mit Ingress abgeschlossen!"
echo ""
echo "🌐 Zugriff über Ingress:"
echo "  Frontend:     http://localhost/"
echo "  Backend API:  http://localhost/api/health"
echo "  Backend Test: curl http://localhost/api/health"
echo ""
echo "📋 Nützliche Befehle:"
echo "  Status:         kubectl get all -n loopit-dev"
echo "  Ingress:        kubectl get ingress -n loopit-dev"
echo "  NGINX Logs:     kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx"
echo "  Backend Logs:   kubectl logs -l app=backend -n loopit-dev"
echo "  Frontend Logs:  kubectl logs -l app=frontend -n loopit-dev"
echo "  Cleanup:        ./k8s/cleanup.sh"
echo ""
echo "💡 Troubleshooting:"
echo "  - Wenn Port 80 belegt ist: sudo lsof -i :80 (dann Prozess stoppen)"
echo "  - Docker Desktop Kubernetes muss aktiviert sein"
echo "  - Firewall könnte Port 80 blockieren"
echo ""
echo "🚀 Öffne http://localhost/ im Browser!"