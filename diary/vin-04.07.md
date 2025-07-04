# Projekttagebuch – 04.07.2025 – Vin

## Heutige Hauptaufgabe(n) - Was war das Ziel heute?
- Besseres Filtering in CI einbauen, nicht alle pushes/PRs sollen pipeline aktivieren
- Postgres auf 17 patchen
- Merge feature/docker into main
- Schauen wie ich ein K8s Setup umsetze
- Sprint 1 abschließen und Sprint 2 planen

## Fortschritt & Ergebnisse - Was habe ich konkret geschafft?
- Besseres Filtering in CI eingebaut
- Postgres auf Version 17 geändert 
- feature/docker in main branch gemerged
- Erstes K8s setup erstellt mit 3 Services und 3 Pods

![image](https://github.com/user-attachments/assets/b4888ca2-3e47-4905-b3b5-b0088460c641)

- Secrets handling eingebaut in K8s
- Feature/k8s Branch mit funktionierender App auf Docker Desktop
- Secrets Template und Security Best Practices implementiert

## Herausforderungen & Blockaden - Wo hing ich fest?
- K8s ist kompliziert, brauchte ein refresher
- ImagePullBackOff Problem bei Docker Desktop (imagePullPolicy: Never Lösung)
- Base64 Encoding Probleme bei Secrets
- Secrets vs ConfigMaps Unterschiede verstehen

## Was ich heute gelernt habe - Eine kleine, konkrete Erkenntnis oder neues Wissen:
- Kubernetes Deployments vs Pods Unterschied verstanden
- Services für interne DNS
- Docker Desktop braucht imagePullPolicy: Never für lokale Images

## Plan für morgen - Was ist der nächste logische Schritt?
- Weiter am K8s setup arbeiten
- CI/CD Pflegen
- Schauen, wie ich Observability umsetzte
- Ingress für echte URLs statt Port-Forward
- Autoscaling einbauen
