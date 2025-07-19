#!/bin/bash

echo "🧹 Loop-It Kubernetes Monitoring - Cleanup Script"
echo "================================================="

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

echo "✅ Kubernetes gefunden - starte Monitoring Cleanup..."
echo ""

# 1. Port-Forwards stoppen
echo "🔌 Stoppe aktive Monitoring Port-Forwards..."
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
    pkill -f "kubectl port-forward.*monitoring" 2>/dev/null && echo "  -> Monitoring Port-Forwards gestoppt" || echo "  -> Keine aktiven Monitoring Port-Forwards"
fi

# 2. Monitoring Namespace und Resources
if kubectl get namespace monitoring &> /dev/null; then
    echo ""
    echo "📦 Monitoring Namespace gefunden:"
    echo "  Services:"
    kubectl get services -n monitoring 2>/dev/null || echo "    -> Keine Services"
    echo "  Pods:"
    kubectl get pods -n monitoring 2>/dev/null || echo "    -> Keine Pods"
    echo "  PVCs:"
    kubectl get pvc -n monitoring 2>/dev/null || echo "    -> Keine PVCs"
    echo "  Ingress:"
    kubectl get ingress -n monitoring 2>/dev/null || echo "    -> Keine Ingress"
    
    echo ""
    if confirm "🗑️  Lösche Monitoring Namespace mit allen Resources?"; then
        echo "  -> Lösche Monitoring-Services..."
        
        # Graceful shutdown der Services
        kubectl delete ingress --all -n monitoring --timeout=30s 2>/dev/null
        kubectl delete service --all -n monitoring --timeout=30s 2>/dev/null
        kubectl delete deployment --all -n monitoring --timeout=60s 2>/dev/null
        kubectl delete daemonset --all -n monitoring --timeout=60s 2>/dev/null
        kubectl delete configmap --all -n monitoring --timeout=30s 2>/dev/null
        kubectl delete secret --all -n monitoring --timeout=30s 2>/dev/null
        kubectl delete pvc --all -n monitoring --timeout=60s 2>/dev/null
        
        # Namespace löschen
        echo "  -> Lösche Namespace monitoring..."
        kubectl delete namespace monitoring --timeout=90s
        echo "  ✅ Monitoring Namespace gelöscht"
    else
        echo "  -> Monitoring Namespace beibehalten"
    fi
else
    echo "📦 Kein Monitoring Namespace gefunden"
fi

# 3. RBAC Resources cleanup
echo ""
echo "🔐 Cleanup RBAC Resources..."
if kubectl get clusterrole prometheus &> /dev/null; then
    if confirm "🗑️  Prometheus ClusterRole und ClusterRoleBinding löschen?"; then
        kubectl delete clusterrole prometheus --ignore-not-found=true
        kubectl delete clusterrolebinding prometheus --ignore-not-found=true
        echo "  ✅ Prometheus RBAC Resources gelöscht"
    fi
fi

if kubectl get clusterrole promtail &> /dev/null; then
    if confirm "🗑️  Promtail ClusterRole und ClusterRoleBinding löschen?"; then
        kubectl delete clusterrole promtail --ignore-not-found=true
        kubectl delete clusterrolebinding promtail --ignore-not-found=true
        echo "  ✅ Promtail RBAC Resources gelöscht"
    fi
fi

# 4. Backend Service Annotations entfernen
echo ""
echo "🔧 Backend Service Annotations..."
if kubectl get service backend-service -n default &> /dev/null; then
    if confirm "🧹 Prometheus Annotations vom Backend Service entfernen?"; then
        kubectl annotate service backend-service -n default prometheus.io/scrape- --ignore-not-found=true
        kubectl annotate service backend-service -n default prometheus.io/port- --ignore-not-found=true
        kubectl annotate service backend-service -n default prometheus.io/path- --ignore-not-found=true
        echo "  ✅ Backend Service Annotations entfernt"
    fi
elif kubectl get service backend -n loopit-dev &> /dev/null; then
    if confirm "🧹 Prometheus Annotations vom Backend Service entfernen?"; then
        kubectl annotate service backend -n loopit-dev prometheus.io/scrape- --ignore-not-found=true
        kubectl annotate service backend -n loopit-dev prometheus.io/port- --ignore-not-found=true
        kubectl annotate service backend -n loopit-dev prometheus.io/path- --ignore-not-found=true
        echo "  ✅ Backend Service Annotations entfernt"
    fi
fi

# 5. Persistent Volumes (falls manuell erstellt)
echo ""
echo "💾 Persistent Volumes..."
monitoring_pvs=$(kubectl get pv | grep "monitoring" | awk '{print $1}' || true)
if [ ! -z "$monitoring_pvs" ]; then
    echo "  Gefundene Monitoring PVs:"
    echo "$monitoring_pvs"
    echo ""
    if confirm "🗑️  Monitoring Persistent Volumes löschen? (Daten gehen verloren!)"; then
        for pv in $monitoring_pvs; do
            kubectl delete pv "$pv" --ignore-not-found=true && echo "    ✅ PV $pv gelöscht"
        done
        echo "  ✅ Monitoring PVs cleanup abgeschlossen"
    else
        echo "  -> Monitoring PVs beibehalten"
    fi
else
    echo "  -> Keine Monitoring PVs gefunden"
fi

# 6. Docker Images (optional)
echo ""
echo "🐳 Docker Monitoring Images:"
monitoring_images=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "(prometheus|grafana|loki|promtail)" | grep -v REPOSITORY || true)

if [ ! -z "$monitoring_images" ]; then
    echo "$monitoring_images"
    echo ""
    if confirm "🗑️  Monitoring Docker Images löschen?"; then
        echo "  -> Lösche Monitoring Images..."
        # Lösche häufig verwendete Monitoring Images
        docker rmi prom/prometheus:latest 2>/dev/null && echo "    ✅ Prometheus Image gelöscht"
        docker rmi prom/prometheus:v2.53.0 2>/dev/null && echo "    ✅ Prometheus v2.53.0 Image gelöscht"
        docker rmi prom/prometheus:v2.47.0 2>/dev/null && echo "    ✅ Prometheus v2.47.0 Image gelöscht"
        docker rmi grafana/grafana:latest 2>/dev/null && echo "    ✅ Grafana latest Image gelöscht"
        docker rmi grafana/grafana:10.4.0 2>/dev/null && echo "    ✅ Grafana 10.4.0 Image gelöscht"
        docker rmi grafana/grafana:10.2.0 2>/dev/null && echo "    ✅ Grafana 10.2.0 Image gelöscht"
        docker rmi grafana/loki:latest 2>/dev/null && echo "    ✅ Loki latest Image gelöscht"
        docker rmi grafana/loki:2.9.6 2>/dev/null && echo "    ✅ Loki 2.9.6 Image gelöscht"
        docker rmi grafana/loki:2.9.0 2>/dev/null && echo "    ✅ Loki 2.9.0 Image gelöscht"
        docker rmi grafana/promtail:latest 2>/dev/null && echo "    ✅ Promtail latest Image gelöscht"
        docker rmi grafana/promtail:2.9.6 2>/dev/null && echo "    ✅ Promtail 2.9.6 Image gelöscht"
        docker rmi grafana/promtail:2.9.0 2>/dev/null && echo "    ✅ Promtail 2.9.0 Image gelöscht"
        echo "  ✅ Monitoring Docker Images cleanup abgeschlossen"
    else
        echo "  -> Monitoring Docker Images beibehalten"
    fi
else
    echo "  -> Keine Monitoring Images gefunden"
fi

# 7. Namespace Labels cleanup
echo ""
echo "🏷️  Namespace Labels..."
if confirm "🧹 Monitoring-Labels von Namespaces entfernen?"; then
    kubectl label namespace loopit-dev name- --ignore-not-found=true
    kubectl label namespace monitoring name- --ignore-not-found=true
    echo "  ✅ Namespace-Labels entfernt"
fi

# 8. Monitoring-spezifische ConfigMaps/Secrets in anderen Namespaces (falls vorhanden)
echo ""
echo "📄 Monitoring-Konfigurationen in anderen Namespaces..."
other_monitoring_configs=$(kubectl get configmaps,secrets --all-namespaces | grep -E "(prometheus|grafana|loki|promtail)" | grep -v "monitoring" || true)

if [ ! -z "$other_monitoring_configs" ]; then
    echo "  Gefundene Monitoring-Configs:"
    echo "$other_monitoring_configs"
    echo ""
    if confirm "🗑️  Monitoring-Configs in anderen Namespaces löschen?"; then
        # Hier könntest du spezifische ConfigMaps/Secrets löschen
        echo "  -> Manual cleanup erforderlich (zu komplex für automatisches Löschen)"
        echo "     Prüfe: kubectl get configmaps,secrets --all-namespaces | grep monitoring"
    fi
else
    echo "  -> Keine Monitoring-Configs in anderen Namespaces gefunden"
fi

# 9. Erweiterte Cleanup-Optionen
echo ""
if confirm "🧹 Erweiterte Monitoring-Cleanup-Optionen ausführen?"; then
    echo ""
    echo "🔧 Erweiterte Cleanup-Optionen:"
    
    # Kubernetes Events cleanup
    if confirm "  ☸️  Monitoring-Events aus Kubernetes löschen?"; then
        kubectl delete events --all -n monitoring --ignore-not-found=true
        echo "    ✅ Monitoring Events gelöscht"
    fi
    
    # Docker Volume Cleanup
    if confirm "  🐳 Docker Volumes mit monitoring-Namen löschen?"; then
        docker volume ls | grep monitoring | awk '{print $2}' | xargs -r docker volume rm 2>/dev/null
        echo "    ✅ Monitoring Docker Volumes gelöscht"
    fi
    
    # Temporary Files
    if confirm "  📁 Temporary Monitoring-Files löschen?"; then
        rm -rf /tmp/prometheus_* 2>/dev/null
        rm -rf /tmp/grafana_* 2>/dev/null
        rm -rf /tmp/loki_* 2>/dev/null
        rm -rf /tmp/promtail_* 2>/dev/null
        echo "    ✅ Temporary Monitoring Files gelöscht"
    fi
fi

# 10. Status Check
echo ""
echo "📊 Cleanup Status:"
echo "  ☸️  Kubernetes Cluster: $(kubectl get nodes --no-headers | wc -l) Nodes aktiv"
echo "  📦 Namespaces: $(kubectl get namespaces --no-headers | wc -l) total"
echo "  📦 Monitoring Namespace: $(kubectl get namespace monitoring --no-headers 2>/dev/null | wc -l) (0 = gelöscht)"
echo "  🐳 Docker Images: $(docker images -q | wc -l) total"
echo "  💾 Docker Volumes: $(docker volume ls -q | wc -l) total"


# 11. Hilfreiche Befehle
echo ""
echo "📋 Nützliche Befehle nach Cleanup:"
echo "  Status prüfen:       kubectl get all --all-namespaces"
echo "  Verbleibende PVs:     kubectl get pv"
echo "  RBAC Resources:      kubectl get clusterroles,clusterrolebindings | grep -E '(prometheus|grafana|loki|promtail)'"
echo "  Docker Images:       docker images | grep -E '(prometheus|grafana|loki|promtail)'"
echo "  Docker Volumes:      docker volume ls | grep monitoring"
echo "  Neustart Monitoring: ./k8s/monitoring/deploy-monitoring.sh"
echo ""

# 11a. Backend Metrics Ingress Check
backend_ingress=$(kubectl get ingress backend-metrics-ingress -n default 2>/dev/null || true)
if [ ! -z "$backend_ingress" ]; then
    echo "  ⚠️  Backend Metrics Ingress noch vorhanden"
else
    echo "  ✅ Backend Metrics Ingress entfernt"
fi

# 12. Verify Complete Cleanup
echo "🔍 Cleanup Verification:"

# Check if monitoring namespace is gone
if kubectl get namespace monitoring &> /dev/null; then
    echo "  ⚠️  Monitoring Namespace noch vorhanden"
else
    echo "  ✅ Monitoring Namespace entfernt"
fi

# Check for monitoring RBAC
monitoring_rbac=$(kubectl get clusterroles,clusterrolebindings 2>/dev/null | grep -E "(prometheus|grafana|loki|promtail)" || true)
if [ ! -z "$monitoring_rbac" ]; then
    echo "  ⚠️  Monitoring RBAC Resources noch vorhanden:"
    echo "$monitoring_rbac"
else
    echo "  ✅ Monitoring RBAC Resources entfernt"
fi

# Check backend service annotations
backend_annotations=$(kubectl get service backend -n loopit-dev -o jsonpath='{.metadata.annotations}' 2>/dev/null | grep prometheus || true)
if [ ! -z "$backend_annotations" ]; then
    echo "  ⚠️  Backend Service hat noch Prometheus Annotations"
else
    echo "  ✅ Backend Service Annotations entfernt"
fi

echo ""
echo "🎉 Monitoring Cleanup abgeschlossen!"
echo ""
echo "💡 Tipps:"
echo "  - Führe 'kubectl get all --all-namespaces' aus um sicherzustellen, dass alle Resources entfernt wurden"
echo "  - Prüfe 'docker system df' um Speicherplatz-Freigabe zu sehen"
echo "  - Bei Problemen: 'kubectl get events --all-namespaces | grep monitoring'"
echo ""
echo "🚀 Um Monitoring neu zu deployen:"
echo "  ./k8s/monitoring/deploy-monitoring.sh"