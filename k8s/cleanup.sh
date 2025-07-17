#!/bin/bash

echo "🧹 Loop-It Kubernetes - Cleanup Script"
echo "======================================="

# Funktion für User-Bestätigung
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Prüfe ob Kubernetes läuft
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes ist nicht verfügbar. Nichts zu cleanen."
    exit 0
fi

echo "✅ Kubernetes gefunden - starte Cleanup..."
echo ""

# 1. Port-Forwards stoppen
echo "🔌 Stoppe aktive Port-Forwards..."
# Windows/Git Bash kompatibel
if command -v tasklist &> /dev/null; then
    # Windows
    tasklist | findstr kubectl | while read line; do
        pid=$(echo $line | awk '{print $2}')
        if [ ! -z "$pid" ]; then
            echo "  -> Stoppe kubectl Port-Forward (PID: $pid)"
            taskkill //PID $pid //F 2>/dev/null
        fi
    done
else
    # Linux/Mac
    pkill -f "kubectl port-forward" 2>/dev/null && echo "  -> Port-Forwards gestoppt" || echo "  -> Keine aktiven Port-Forwards"
fi

# 2. Loop-It Namespace und Resources
if kubectl get namespace loopit-dev &> /dev/null; then
    echo ""
    echo "📦 Loop-It Namespace gefunden:"
    kubectl get pods -n loopit-dev 2>/dev/null || echo "  -> Keine Pods"
    kubectl get services -n loopit-dev 2>/dev/null || echo "  -> Keine Services"
    kubectl get ingress -n loopit-dev 2>/dev/null || echo "  -> Keine Ingress"
    
    echo ""
    if confirm "🗑️  Lösche Loop-It Namespace (loopit-dev) mit allen Resources?"; then
        echo "  -> Lösche Namespace loopit-dev..."
        kubectl delete namespace loopit-dev --timeout=60s
        echo "  ✅ Namespace gelöscht"
    else
        echo "  -> Namespace beibehalten"
    fi
else
    echo "📦 Kein Loop-It Namespace (loopit-dev) gefunden"
fi

# 3. NGINX Ingress Controller (optional)
echo ""
if kubectl get namespace ingress-nginx &> /dev/null; then
    echo "🌐 NGINX Ingress Controller gefunden"
    if confirm "🗑️  NGINX Ingress Controller auch löschen? (Betrifft andere Projekte!)"; then
        echo "  -> Lösche NGINX Ingress Controller..."
        kubectl delete namespace ingress-nginx --timeout=120s
        kubectl delete clusterrole ingress-nginx --ignore-not-found=true
        kubectl delete clusterrolebinding ingress-nginx --ignore-not-found=true
        kubectl delete ingressclass nginx --ignore-not-found=true
        echo "  ✅ NGINX Ingress Controller gelöscht"
    else
        echo "  -> NGINX Ingress Controller beibehalten"
    fi
else
    echo "🌐 Kein NGINX Ingress Controller gefunden"
fi

# 4. Docker Images (optional)
echo ""
echo "🐳 Docker Images:"
# Suche nach beiden Namenskonventionen
loop_images=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "(loopit/|loop-it-)" | grep -v REPOSITORY || true)

if [ ! -z "$loop_images" ]; then
    echo "$loop_images"
    echo ""
    if confirm "🗑️  Loop-It Docker Images löschen?"; then
        echo "  -> Lösche Loop-It Images..."
        # Lösche loopit/ prefixed images
        docker rmi loopit/backend:latest 2>/dev/null && echo "    ✅ Backend Image (loopit/) gelöscht"
        docker rmi loopit/frontend:latest 2>/dev/null && echo "    ✅ Frontend Image (loopit/) gelöscht"
        # Lösche loop-it- prefixed images  
        docker rmi loop-it-backend:latest 2>/dev/null && echo "    ✅ Backend Image (loop-it-) gelöscht"
        docker rmi loop-it-frontend:latest 2>/dev/null && echo "    ✅ Frontend Image (loop-it-) gelöscht"
        echo "  ✅ Docker Images cleanup abgeschlossen"
    else
        echo "  -> Docker Images beibehalten"
    fi
else
    echo "  -> Keine Loop-It Images gefunden"
fi

# 5. Generierte Files cleanup
echo ""
echo "📄 Generierte Dateien:"
generated_files=()
[ -f "k8s/secrets-generated.yaml" ] && generated_files+=("k8s/secrets-generated.yaml")
[ -f "secrets-generated.yaml" ] && generated_files+=("secrets-generated.yaml")

if [ ${#generated_files[@]} -gt 0 ]; then
    echo "  Gefundene Dateien:"
    for file in "${generated_files[@]}"; do
        echo "    - $file"
    done
    echo ""
    if confirm "🗑️  Generierte Secret-Dateien löschen?"; then
        for file in "${generated_files[@]}"; do
            rm -f "$file" && echo "    ✅ $file gelöscht"
        done
        echo "  ✅ Generierte Dateien cleanup abgeschlossen"
    else
        echo "  -> Generierte Dateien beibehalten"
    fi
else
    echo "  -> Keine generierten Dateien gefunden"
fi

# 6. Vollständiges System cleanup (optional)
echo ""
if confirm "🧹 Erweiterte Cleanup-Optionen ausführen?"; then
    echo ""
    echo "🔧 Erweiterte Cleanup-Optionen:"
    
    # Docker System Prune
    if confirm "  🐳 Docker System Prune (ungenutzte Volumes, Networks, Images)?"; then
        docker system prune -f --volumes
        echo "    ✅ Docker System cleanup abgeschlossen"
    fi
    
    # Kubernetes Temporary Resources
    if confirm "  ☸️  Kubernetes temporäre Resources cleanup?"; then
        kubectl delete pods --field-selector=status.phase=Succeeded --all-namespaces --ignore-not-found=true
        kubectl delete pods --field-selector=status.phase=Failed --all-namespaces --ignore-not-found=true
        echo "    ✅ Kubernetes temporäre Pods gelöscht"
    fi
fi

# 7. Status Check
echo ""
echo "📊 Cleanup Status:"
echo "  ☸️  Kubernetes Cluster: $(kubectl get nodes --no-headers | wc -l) Nodes aktiv"
echo "  📦 Namespaces: $(kubectl get namespaces --no-headers | wc -l) total"
echo "  🐳 Docker Images: $(docker images -q | wc -l) total"

# 8. Hilfreiche Befehle
echo ""
echo "📋 Nützliche Befehle nach Cleanup:"
echo "  Status:           kubectl get all --all-namespaces"
echo "  Cluster Info:     kubectl cluster-info"
echo "  Docker Images:    docker images"
echo "  Neustart:         ./k8s/deploy.sh"
echo ""
echo "🎉 Cleanup abgeschlossen!"
echo ""
echo "💡 Tipp: Führe './k8s/deploy.sh' aus um Loop-It neu zu deployen"