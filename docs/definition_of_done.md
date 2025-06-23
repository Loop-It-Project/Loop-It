# Checkliste

## Code

- Der Code erfüllt die Akzeptanzkriterien der Story
- Code wurde erfolgreich getestet
- Code wurde reviewed durch ein Teammitglied
- Der Code entspricht Linting-Prinzipien
- Code ist entsprechend kommentiert
- Wenn ein Teil eines Codes mehr als 2 Mal wiederholt wird, wurde daraus eine aufrufbare Funktion gebaut (Dont Repeat yourself)
- Funktionen wurden so gebaut, dass sie wiederverwendbar sind
- Funktionen wurden entsprechend aufgeteilt und aufgekapselt
- Seiten und Routen wurden entsprechend dafür gebaut
- Eine Datei sollte nicht mehr als 300 Zeilen enthalten

## Test

- Unit tests sind vorhanden
- Integrationstests
- End-to-end tests
- Tests laufen lokal und in der CI

## Dokumentation

- Änderung / Ergänzung der README
- ENV Dokumentation
- Dokumentation von API Endpunkten
- Dokumentation von wichtigsten Funktionen + Erklärung
- Dokumentation + Erklärung des Deployments
- Mögliche Screenshots von wichtigen Aspekten
- Wireframes in den Doku Ordnern ebenfalls enthalten

## Infrastruktur und K8s

- Terraform Code angepasst an Infrastruktur und getestet
- Kubernetes YAML wurde aktualisiert
- Helm Chart wurde aktualisiert
- Helm Deployment läuft fehlerfrei
- K8s Ressourcen nutzen, passende Requests und Limits

## CI/CD

- CI/CD Pipeline durchläuft alle Stages erfolgreich
- Docker Images erfolgreich gebaut und gepusht
- Secrets in CI/CD werden korrekt genutzt

## Sicherheit

- Passwörter werden gehasht (bcrypt)
- Secrets werden sicher behandelt und best practices eingehalten
- Berechtigungen korrekt setzen
- Potenzielle Sicherheitslücken wurden überprüft
- Patches zu aktualisierten Frameworks erfolgen möglichst früh (Spätestens nach 7 Tagen)
- Deprecated Frameworks oder Packages sollen möglichst mit dem nächsten Patch ausgetauscht oder entfernt werden

## Monitoring und Logging

- Seitenaufrufe, Fehlerquoten, Ladezeiten durch Grafana-Dashboard einsehbar
- Schnelle Analyse durch Visualisierung
- Health-Checks für die Systemstabilität
- Alertmanager für kritische Zustände
