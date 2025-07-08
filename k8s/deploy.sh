#!/bin/bash

echo "🚀 Loop-It Kubernetes - Docker Desktop"
echo "======================================"

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

# Frontend mit korrekter API URL für Port-Forward Setup
docker build --build-arg VITE_API_URL=http://localhost:3000 -t loopit/frontend:latest ./frontend
if [ $? -eq 0 ]; then
    echo "✅ Frontend Image gebaut (für Port-Forward Setup)"
else
    echo "❌ Frontend Image konnte nicht gebaut werden"
    exit 1
fi

# Cleanup alte Deployments falls vorhanden
echo "🧹 Cleanup alte Deployments..."
kubectl delete namespace loopit-dev --ignore-not-found=true
sleep 10

# ✅ NAMESPACE ERSTELLEN
echo "📦 Erstelle Namespace..."
kubectl create namespace loopit-dev
sleep 2

# Secrets generieren und direkt anwenden (ohne problematische Zeichen)
echo "🔐 Generiere und erstelle Secrets..."
# URL-safe Secrets ohne problematische Zeichen wie =, +, /
POSTGRES_PASSWORD=$(openssl rand -hex 16)  # Hex statt Base64
JWT_SECRET=$(openssl rand -hex 32)         # Hex statt Base64
JWT_REFRESH_SECRET=$(openssl rand -hex 32) # Hex statt Base64

echo "Generierte Secrets:"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"
echo ""

# Secret direkt erstellen (ohne YAML-Probleme)
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

# Kubernetes Services starten
echo "📋 Starte Kubernetes Services..."

echo "  -> PostgreSQL..."
kubectl apply -f k8s/postgres.yaml

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
echo "🔗 Starte Port-Forwards für Development:"
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:3000"
echo ""

# Port-Forwards automatisch starten
echo "🔌 Starte Port-Forwards..."
kubectl port-forward service/frontend 3001:80 -n loopit-dev &
FRONTEND_PID=$!
kubectl port-forward service/backend 3000:3000 -n loopit-dev &
BACKEND_PID=$!

sleep 3

echo "✅ Port-Forwards gestartet:"
echo "  Frontend PID: $FRONTEND_PID"
echo "  Backend PID:  $BACKEND_PID"

echo ""
echo "📋 Nützliche Befehle:"
echo "Status:    kubectl get pods -n loopit-dev"
echo "Logs:      kubectl logs -l app=backend -n loopit-dev"
echo "Stop PF:   kill $FRONTEND_PID $BACKEND_PID"
echo "Cleanup:   ./k8s/cleanup.sh"
echo ""
echo "🚀 Deployment abgeschlossen!"
echo "🌐 Öffne http://localhost:3001 im Browser"