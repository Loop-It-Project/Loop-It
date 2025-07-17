# Projekttagebuch – 11.07.2025 – Vin

## Heutige Hauptaufgabe(n) - Was war das Ziel heute?

- Docker Setup verbessern, best practices einhalten
- Universe-Erstellung Backend-Problem lösen
- Dockerfiles und compose optimieren
- K8s Datenpersistenz implementieren

## Fortschritt & Ergebnisse - Was habe ich konkret geschafft?

- Docker Setup verbessert
- Backend/Frontend Dockerfiles für Production optimiert (Multistage vs Single-stage Entscheidungen)
- Backend Dockerfile: Single-stage mit npm prune entfernt, da Dev-Dependencies für Drizzle-Kit benötigt werden
- Frontend Dockerfile: Multistage mit Node build + Nginx production - funktioniert optimal
- docker-compose.yml mit korrekten Build-Args für Frontend (VITE_API_URL, VITE_APP_NAME)
- .env.example vervollständigt mit allen notwendigen Variablen und Security-Hinweisen
- Drizzle ORM Problem gelöst: App-Level Defaults statt Schema-Defaults verhindert 28-Felder Parameter-Mismatch
- Universe-Erstellung funktioniert vollständig
- K8s PostgreSQL Datenpersistenz implementiert: PersistentVolumeClaim mit 1Gi Storage
- Datenpersistenz erfolgreich getestet: User 'Max' überlebt Pod-Restart
- k8s/postgres.yaml erweitert um PVC-Konfiguration

## Herausforderungen & Blockaden - Wo hing ich fest?

- Create universe hat nicht funktioniert im Frontend wegen fehlenden Eingaben, dachte es wäre vielleicht ein Bug.

## Was ich heute gelernt habe - Eine kleine, konkrete Erkenntnis oder neues Wissen:

- Multistage Dockerfiles machen nur Sinn bei unterschiedlichen Runtimes (Node build vs Nginx serve) oder wenn echte Dev-Dependencies von Production getrennt werden müssen. Bei Node-Apps mit Runtime-Dependencies ist Single-stage oft praktischer. 
- PersistentVolumeClaims in K8s sind essentiell für Datenbank-Pods, ohne sie gehen alle Daten bei Pod-Restart verloren.

## Plan für morgen - Was ist der nächste logische Schritt?

- Alerting für kritische Metriken konfigurieren (High Error Rate, Memory Usage)
- Monitoring für K8s Setup erstellen
- Weitere K8s Best Implementationen (Autoscaling, Rollouts, Healthchecks/healing, Helm)
- Optional: StatefulSet für PostgreSQL oder Backup-Strategie via CronJob