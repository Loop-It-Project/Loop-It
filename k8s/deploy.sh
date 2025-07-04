#!/bin/bash

echo "🚀 Loop-It Kubernetes - Docker Desktop"
echo "====================================="

# Prüfe ob Kubernetes läuft
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes ist nicht verfügbar. Ist Docker Desktop gestartet?"
    echo "   Settings → Kubernetes → Enable Kubernetes"
    exit 1
fi

echo "✅ Kubernetes in Docker Desktop gefunden"

# Docker Images bauen
echo "🔨 Baue Docker Images..."
docker build -t loopit/backend:latest ./backend
if [ $? -eq 0 ]; then
    echo "✅ Backend Image gebaut"
else
    echo "❌ Backend Image konnte nicht gebaut werden"
    exit 1
fi

docker build -t loopit/frontend:latest ./frontend
if [ $? -eq 0 ]; then
    echo "✅ Frontend Image gebaut"
else
    echo "❌ Frontend Image konnte nicht gebaut werden"
    exit 1
fi

# Cleanup alte Deployments falls vorhanden
echo "🧹 Cleanup alte Deployments..."
kubectl delete namespace loopit-dev --ignore-not-found=true
sleep 5

# Kubernetes Services starten
echo "📋 Starte Kubernetes Services..."

echo "  -> PostgreSQL (mit Namespace)..."
kubectl apply -f k8s/postgres.yaml

echo "  -> Secrets..."
kubectl apply -f k8s/secrets.yaml

echo "  -> Backend..."
kubectl apply -f k8s/backend.yaml

echo "  -> Frontend..."
kubectl apply -f k8s/frontend.yaml

echo "✅ Alle Services gestartet"

# Warte auf Pods
echo "⏳ Warte auf Pods (kann 1-2 Minuten dauern)..."

echo "  -> Warte auf PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n loopit-dev --timeout=120s

echo "  -> Warte auf Backend..."
kubectl wait --for=condition=ready pod -l app=backend -n loopit-dev --timeout=120s

echo "  -> Warte auf Frontend..."
kubectl wait --for=condition=ready pod -l app=frontend -n loopit-dev --timeout=120s

echo ""
echo "🎉 Alle Pods sind bereit!"
echo ""
echo "📱 Status:"
kubectl get pods -n loopit-dev

echo ""
echo "🔗 Teste deine App:"
echo "Frontend: kubectl port-forward svc/frontend 8080:80 -n loopit-dev"
echo "Backend:  kubectl port-forward svc/backend 3000:3000 -n loopit-dev"
echo ""
echo "Dann öffne:"
echo "Frontend: http://localhost:8080"
echo "Backend:  http://localhost:3000"
echo ""
echo "📋 Weitere Befehle:"
echo "Status:   kubectl get pods -n loopit-dev"
echo "Logs:     kubectl logs -l app=backend -n loopit-dev"
echo "Cleanup:  kubectl delete namespace loopit-dev"