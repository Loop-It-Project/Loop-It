# Loop-It Monitoring Helm Chart - Installation Guide

## ⚠️ **Status: Experimentell / Nicht für Production**

Dieses Helm Chart ist ein **experimentelles Setup** für das Loop-It Monitoring. Nach ausgiebigen Tests wird für Production das **bewährte Bash-Script-Setup** empfohlen.

### Was funktioniert:
- ✅ Prometheus (Metriken-Sammlung)
- ✅ Grafana (Dashboards) 
- ✅ Loki (Log-Storage)
- ✅ NGINX Ingress Integration
- ✅ Persistent Storage

### Bekannte Probleme:
- ❌ Promtail DNS-Konfiguration instabil
- ❌ Subchart-Integration komplex
- ❌ Template-Syntax-Fehler bei Updates
- ❌ Namespace-Ownership-Konflikte

### Empfehlung:
Für **Production-Umgebungen** verwende das bewährte Setup:
```bash
cd k8s/monitoring/
./deploy-monitoring.sh
```

## 📁 Chart Structure

```
loopit-monitoring/
├── Chart.yaml                    # Chart metadata
├── values.yaml                   # Default configuration
├── charts/                       # Helm dependencies (promtail)
│   └── promtail-6.17.0.tgz
├── templates/
│   ├── _helpers.tpl              # Template helpers
│   ├── rbac.yaml                 # ServiceAccounts, ClusterRoles, Bindings
│   ├── prometheus.yaml           # Prometheus deployment, service, config
│   ├── grafana.yaml              # Grafana deployment, service, secrets
│   ├── loki.yaml                 # Loki deployment, service, config
│   ├── ingress.yaml              # Ingress routing + backend annotation job
│   └── NOTES.txt                 # Post-install instructions
└── README.md                     # This guide
```

## 🚀 Installation (Für Testing)

### 1. Voraussetzungen

```bash
# NGINX Ingress Controller installieren
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Warten bis ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s
```

### 2. Chart Dependencies

```bash
# Ins Chart-Verzeichnis wechseln
cd k8s/loopit-monitoring

# Dependencies aktualisieren
helm dependency update

# .helmignore erstellen (wichtig!)
cat > .helmignore << 'EOF'
*.exe
*.dll
node_modules/
.git/
.gitignore
*.tmp
*.log
esbuild.exe
EOF
```

### 3. Installation

```bash
# Chart installieren
helm install loopit-monitoring . \
  --namespace monitoring \
  --create-namespace

# Status prüfen
kubectl get pods -n monitoring
helm status loopit-monitoring -n monitoring
```

## 🔧 Bekannte Probleme & Workarounds

### Problem 1: Promtail DNS-Fehler

**Symptom:** `dial tcp: lookup loki-gateway on 10.96.0.10:53: server misbehaving`

**Workaround:** Promtail separat installieren:
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install promtail grafana/promtail -n monitoring
```

### Problem 2: Template-Syntax-Fehler

**Symptom:** `template: loopit-monitoring/templates/promtail.yaml:xxx: executing...`

**Workaround:** Promtail-Template entfernen:
```bash
rm -f templates/promtail.yaml
helm upgrade loopit-monitoring . -n monitoring
```

### Problem 3: Namespace-Ownership

**Symptom:** `invalid ownership metadata; annotation validation error`

**Workaround:** Komplettes Cleanup:
```bash
helm uninstall loopit-monitoring -n monitoring
kubectl delete namespace monitoring
# Dann neu installieren
```

## 🌐 URLs & Zugriff

Nach erfolgreicher Installation:

| Service | URL | Login |
|---------|-----|-------|
| Grafana | http://monitoring.localhost/ | admin / monitoring123 |
| Prometheus | http://prometheus.localhost/ | - |
| Loki | http://loki.localhost/ | - |

### Hosts-Datei konfigurieren:
```bash
# Windows (als Administrator)
echo "127.0.0.1 monitoring.localhost" >> C:\Windows\System32\drivers\etc\hosts
echo "127.0.0.1 prometheus.localhost" >> C:\Windows\System32\drivers\etc\hosts
echo "127.0.0.1 loki.localhost" >> C:\Windows\System32\drivers\etc\hosts
```

## 📊 Troubleshooting

### Status prüfen
```bash
# Alle Komponenten
kubectl get all -n monitoring

# Ingress Status
kubectl get ingress -n monitoring

# Helm Release
helm list -n monitoring
```

### Logs analysieren
```bash
# Prometheus
kubectl logs -l app=prometheus -n monitoring

# Grafana
kubectl logs -l app=grafana -n monitoring

# Loki
kubectl logs -l app=loki -n monitoring

# Promtail (falls vorhanden)
kubectl logs -l app.kubernetes.io/name=promtail -n monitoring
```

### Häufige Fixes

**PVC Pending:**
```bash
# PVC Status prüfen
kubectl get pvc -n monitoring
kubectl describe pvc -n monitoring
```

**Grafana 503 Error:**
```bash
# Grafana Pod neustarten
kubectl rollout restart deployment/loopit-monitoring-grafana -n monitoring
```

**Loki 404 Error:**
```bash
# Loki direkt testen
kubectl port-forward service/loopit-monitoring-loki 3100:3100 -n monitoring
curl http://localhost:3100/ready
```

## 🔄 Updates & Management

### Chart upgraden
```bash
# Mit neuen Einstellungen
helm upgrade loopit-monitoring . -n monitoring

# Spezifische Werte ändern
helm upgrade loopit-monitoring . \
  --set grafana.admin.password=new-password \
  -n monitoring
```

### Rollback
```bash
# Zur vorherigen Version
helm rollback loopit-monitoring -n monitoring

# Zu spezifischer Revision
helm rollback loopit-monitoring 1 -n monitoring
```

## 🧹 Cleanup

```bash
# Helm Release entfernen
helm uninstall loopit-monitoring -n monitoring

# Namespace löschen
kubectl delete namespace monitoring

# NGINX Ingress (optional)
helm uninstall ingress-nginx -n ingress-nginx
kubectl delete namespace ingress-nginx
```

## 📚 Lessons Learned

### Was wir gelernt haben:
1. **Helm ist komplex** - Nicht immer die beste Lösung
2. **Subcharts sind tricky** - DNS und Template-Vererbung problematisch
3. **Bash-Scripts sind oft einfacher** - Weniger Abstraktionsschichten
4. **"If it ain't broke, don't fix it"** - Bewährte Lösungen bevorzugen

### Wann Helm verwenden:
- ✅ Komplexe, wiederverwendbare Setups
- ✅ Multi-Environment-Deployments
- ✅ Wenn Zeit für Debugging vorhanden ist

### Wann Bash-Scripts bevorzugen:
- ✅ Einfache, funktionierende Setups
- ✅ Zeitkritische Deployments
- ✅ Wenn Stabilität wichtiger als Wiederverwendbarkeit

## 🎯 Migration zurück zu Bash-Scripts

Falls du zurück zu den bewährten Scripts wechseln möchtest:

```bash
# Helm-Setup entfernen
helm uninstall loopit-monitoring -n monitoring
helm uninstall ingress-nginx -n ingress-nginx
kubectl delete namespace monitoring ingress-nginx

# Zurück zu Bash-Scripts
cd ../monitoring/
./deploy-monitoring.sh
```

## 🔗 Alternative: Kombinierter Ansatz

Du kannst auch das **Beste aus beiden Welten** nutzen:

```bash
# NGINX Ingress via Helm (stabil)
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace

# Monitoring via Bash (bewährt)
cd k8s/monitoring/
./deploy-monitoring.sh
```

## 📝 Fazit

Dieses Helm Chart war ein **wertvolles Lernexperiment**, zeigt aber auch, dass nicht jedes Problem mit Helm gelöst werden muss. Manchmal ist die **einfachere Lösung die bessere**.

Für **Production-Umgebungen** empfehlen wir:
- Das bewährte **Bash-Script-Setup** für Monitoring
- **Helm nur dort verwenden**, wo es echten Mehrwert bietet
- **Stabilität über Coolness-Faktor** priorisieren

---

*Dieses Chart bleibt als Referenz und für experimentelle Zwecke verfügbar.*