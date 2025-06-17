# Loop-It

Technische Projekt Planung

___

## Detaillierte Architektur & Komponenten

#### ● Begründet die Wahl der Architektur (Monolith/Microservices) nochmals kurz basierend auf den (jetzt detaillierteren) Anforderungen.

Wir haben uns für Microservices entschieden da wir viele kleine Komponenten und Services haben die mit einander interagieren.

___

## Datenbank Schema Design

Wir werden Drizzle als ORM benutzen.

[Drizzle Documentation](https://orm.drizzle.team/docs/get-started/postgresql-new)

### Erdachtes Schema

#### ● User (Accounts)
- id                                - INT - Primärschlüssel, Unique, AutoIncrement
- email                             - CHAR - Unique, NotNull
- password                          - CHAR - NotNull
- name                              - CHAR - NotNull
- age                               - INT
- birthdate                         - DateTime
- join date                         - DateTime - NotNull
- last Position (Geo Tracking)      - (Muss man sich noch genauer mit befassen)
- choosen Position (Geo Tracking)   - (Muss man sich noch genauer mit befassen)
- Radius for Searching Activites and Users  - INT
- ROLES id role                     - Sekundärschlüssel von Roles (ID)

#### ● Profile von Usern
- id                        - Primär Schlüssel, Unique, AutoIncrement
- USERS id                  - Sekundärschlüssel von User id
- Profil Beschreibung       - TEXT
- Hobbys                    - (Muss noch geschaut werden was passt, aber vermutlich eine Liste aus CHARS)

#### ● Roles
- id            - INT - Primärschlüssel, Unique, AutoIncrement
- name          - CHAR - NotNull
- rights        - CHAR?

#### ● Posts(Feeds) von Usern
- id            - INT - Primärschlüssel, Unique, AutoIncrement
- USERS id      - Sekundärschlüssel von User id
- posted at     - DateTime - NotNull
- description   - TEXT
- PICTURES id   - Sekundärschlüssel von Pictures id

#### ● User Pictures
- id            - INT - Primärschlüssel, Unique, AutoIncrement
- USERS id      - Sekundärschlüssel von User id
- uploaded at   - DateTime - NotNull
- imageName     - CHAR - Name of Image to get it from S3 or Save Folder

#### ● Private Chats (zwischen Usern)
- id                        - INT - Primärschlüssel, Unique, AutoIncrement
- First User USER id        - Sekundärschlüssel von User id
- Second User USER id       - Sekundärschlüssel von User id
- chat started              - DateTime - NotNull
- Message                   - Text

#### ● Chat Rooms
- id                    - INT - Primärschlüssel, Unique, AutoIncrement
- name                  - CHAR - NotNull
- description           - TEXT
- Universe UNIVERSE id  - Sekundärschlüssel von Universe

#### ● Messages in Chat Rooms
- id                    - INT - Primärschlüssel, Unique, AutoIncrement
- CHAT ROOMS id         - Sekundärschlüssel von CHAT ROOMS id
- message               - Text
- posted at             - DateTime
- USER id               - Sekundärschlüssel von USERS id

#### ● Universum (von Themen (z.B. ober Thema “Star Wars”))
- id                    - INT - Primärschlüssel, Unique, AutoIncrement
- name                  - CHAR - Unique, NotNull
- description           - Text
- hashtags              - List of CHARS

___

## Detaillierter Technologie-Stack

### ● Frontend
React, TailwindCSS, Lucide React, ESLint

### ● Backend
Node.js, Express, Drizzle ORM

### ● Database
Drizzle ORM, Postgres DB

Unsere DB verbindet sich über Drizzle ORM und connected in der Main Index.js und bleibt dann offen als Verbindung.

___

# Kubernetes Deployment Design

## Microservices-Komponenten in Kubernetes

| Komponente | Funktion | K8s-Objekt | Begründung |
|------------|----------|------------|------------|
| `frontend` | React | Deployment | Stateless, keine Persistenz notwendig |
| `backend-auth` | Authentifizierung / JWT / Login | Deployment | Stateless, alle Zustände extern gespeichert |
| `backend-feed` | Aktivitätenfeed + Matching-Logic | Deployment | Stateless, interagiert nur mit DB |
| `backend-chat` | Chat-Service + Messaging | Deployment | Kann evtl. WebSocket-Verbindungen halten, bleibt aber stateless |
| `postgres-db` | Datenbank | StatefulSet | Stateful, benötigt persistenten Speicher |

## Replikate

Für das Frontend und die Backend Komponenten wären 2 oder mehr Replikate gut für die Ausfallsicherheit und Load Balancing.
Bei der Datenbank (Single-Leader) wären Replikate komplex.


## Konfiguration: ConfigMaps & Secrets

| Komponente | ConfigMap Inhalte | Secrets Inhalte | Übergabe |
|------------|-------------------|-----------------|----------|
| frontend | API_BASE_URL | – | ENV |
| backend-auth | PORT, DB_URL | JWT_SECRET, SMTP_PASSWORD | ENV |
| backend-feed | DB_URL, FEATURE_FLAGS | – | ENV |
| backend-chat | WS_PORT, REDIS_HOST | REDIS_PASSWORD (falls relevant) | ENV |
| postgres-db | – | POSTGRES_PASSWORD | Mounted Env/Var |

Alle Configs/Secrets werden per ENV-Variablen übergeben.

## Persistenter Speicher

Die postgres-db benötigt ein PVC mit ReadWriteOnce Access Mode, 5-10Gi Speicher und der gp2 StorageClass (AWS default).

## Resource Requests & Limits

| Komponente | Requests CPU / RAM | Limits CPU / RAM |
|------------|-------------------|------------------|
| frontend | 100m / 128Mi | 200m / 256Mi |
| backend-auth | 200m / 256Mi | 500m / 512Mi |
| backend-feed | 200m / 256Mi | 500m / 512Mi |
| backend-chat | 250m / 256Mi | 600m / 512Mi |
| postgres-db | 250m / 512Mi | 1000m / 1024Mi |

Diese Werte können später mit Prometheus Metrics optimiert werden.

## Service-Definitionen

| Komponente | Service-Typ | Zweck |
|------------|-------------|-------|
| frontend | ClusterIP + Ingress | Extern über Ingress erreichbar |
| backend-* | ClusterIP | Intern erreichbar, Ingress routed gezielt |
| postgres-db | ClusterIP | Nur intern, kein externer Zugriff |

Alle Services haben eindeutige `app: loopit-<service>` Label-Selektoren.

## Ingress Resource

```yaml
host: loopit.yourdomain.de
rules:
  - path: /
    service: frontend
  - path: /api/auth/*
    service: backend-auth
  - path: /api/feed/*
    service: backend-feed
  - path: /api/chat/*
    service: backend-chat
```

TLS: Ja, über cert-manager + Let's Encrypt (später optional)

## Namespace Design

| Namespace | Zweck |
|-----------|-------|
| `loopit-dev` | Dev/Test Umgebung |
| `loopit-prod` | Später mögliche Production-Umgebung |
| `observability` | Prometheus, Grafana, Loki, etc. |
___

## IaC (Terraform) Design

## Was wird provisioniert?

Mit Terraform wird sowohl die **Cloud-Infrastruktur** (Netzwerk, EKS-Cluster, S3-Bucket) als auch optional ein Teil der **Kubernetes-Objekte** (z. B. Helm Releases) provisioniert.

**Begründung:**
* Die Cloud-Ressourcen wie VPC, Subnetze, EKS und S3 sollen automatisch erstellt und verwaltet werden.
* Kubernetes-Objekte (Deployments, Services) werden über Helm in der CI/CD-Pipeline deployed. Optional kann Terraform `helm_release` nutzen, um die initialen Releases bereitzustellen.

## Haupt-Terraform-Ressourcen

| Zweck | Ressource |
|-------|-----------|
| Netzwerk | `aws_vpc`, `aws_subnet`, `aws_internet_gateway`, `aws_route_table` |
| Cluster | `aws_eks_cluster`, `aws_eks_node_group`, `aws_iam_role` |
| Storage | `aws_s3_bucket` (für Backups oder Static Hosting) |
| Kubernetes-Zugriff | `kubernetes_namespace`, `helm_release` (optional) |

## Struktur der Terraform-Dateien

```bash
terraform/
├── main.tf          # Einstiegspunkt mit allen Modulen
├── variables.tf     # Alle verwendeten Variablen
├── outputs.tf       # Rückgaben z. B. Cluster-Endpunkt
├── vpc.tf           # Definition der VPC und Subnetze
├── eks.tf           # EKS-Cluster und Node Group
├── s3.tf            # Optionales S3 Bucket
├── kubernetes.tf    # Optional: Namespaces oder Helm Releases
├── provider.tf      # AWS, Kubernetes, Helm Provider
```

**Alternativ:**
* Struktur über `modules/` möglich, wenn mehr Wiederverwendbarkeit oder saubere Trennung gewünscht ist

## Variablen und Konfigurationssteuerung

* Variablen werden in `variables.tf` definiert und in `terraform.tfvars` oder per CI/CD übergeben
* Beispiele für genutzte Variablen:

| Variable | Beschreibung |
|----------|--------------|
| `region` | AWS-Region (z. B. eu-central-1) |
| `cluster_name` | EKS-Clustername |
| `environment` | z. B. dev, staging, prod |
| `node_instance_type` | z. B. t3.medium |
| `image_tag_backend` | Docker-Tag für das Backend-Image |
| `db_password` | Optional über `terraform.tfvars` oder Secrets Manager |

Sensiblere Daten wie `db_password` oder Tokens werden **nicht im Code gespeichert**, sondern:
* aus externen Quellen (z. B. AWS Secrets Manager)
* oder als CI/CD Secrets zur Verfügung gestellt

___

# CI/CD Pipeline Design

## Stufen (Stages) der Pipeline

1. **Build**
2. **Test**
3. **Package (Image Build & Push)**
4. **Deploy to Dev**
5. (Optional später: Deploy to Staging / Prod)

## Jobs und Steps pro Stage

### 1. Build

**Jobs:**
- `frontend-build`
- `backend-build`

**Steps (Beispiel backend):**
- `actions/checkout`: Code aus dem Repository holen
- `actions/setup-node`: Node.js Umgebung vorbereiten
- `npm ci`: Abhängigkeiten installieren
- `npm run build`: Build starten

### 2. Test

**Jobs:**
- `frontend-test`
- `backend-test`

**Steps:**
- `npm test`: Unit-Tests ausführen
- `npx jest` oder `npx vitest`: je nach Setup

### 3. Package

**Jobs:**
- `docker-build-fe`
- `docker-build-be`

**Steps:**
- `docker/login`: Login zur Docker Registry
- `docker/build-push-action`: Image bauen und pushen (Frontend + Backend)
- Tags: `:latest` oder `:commit-sha`

### 4. Deploy to Dev

**Jobs:**
- `deploy-frontend`
- `deploy-backend`

**Steps:**
- `helm upgrade --install`: Helm Chart ins EKS-Cluster deployen
- `kubectl set image` (optional bei einfachem Rolling Update)
- `kubectl rollout status`: Warten, bis Update abgeschlossen

## Tools pro Step

| Schritt | Tool / Action |
|---------|---------------|
| Checkout | `actions/checkout` |
| Node.js Setup | `actions/setup-node` |
| Docker Build | `docker/build-push-action` |
| Helm Deployment | `azure/setup-helm`, `helm` |
| Kubernetes Access | `azure/setup-kubectl`, `kubectl` |
| Secrets Handling | GitHub Actions Secrets |

## Tests in den Stages

| Testtyp | Ausgeführt in Stage | Tool |
|---------|-------------------|------|
| Unit Tests | Test | `jest`, `vitest`, `mocha` |
| Integration | Test oder später Dev | per API-Tests, `supertest`, `axios` |
| E2E Tests | Nach Deploy to Dev | z. B. `Playwright`, `Cypress` |

## Nutzung von Secrets in der Pipeline

Secrets werden in GitHub Actions hinterlegt und im Workflow referenziert:

| Geheimnis | Zweck |
|-----------|-------|
| `DOCKERHUB_TOKEN` | Pushen der Images |
| `AWS_ACCESS_KEY_ID` | Zugriff auf AWS |
| `AWS_SECRET_ACCESS_KEY` | Zugriff auf AWS |
| `K8S_CONFIG` | Zugriff auf EKS (z. B. kubeconfig) |

Zugriff im Workflow über:

```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
```

## Deployment-Strategie

- **Rolling Update** wird standardmäßig über Kubernetes genutzt
- Kubernetes erstellt neue Pods und beendet alte erst, wenn die neuen "ready" sind
- Gesteuert über `kubectl rollout` oder direkt in Helm-Deployment definiert (`strategy: RollingUpdate`)

## Gates und Approvals

- Aktuell keine Staging- oder Produktionsumgebung → keine manuellen Approvals
- Später denkbar:
  - Approval-Check vor Deploy to Staging oder Prod (`environment: with protection rules`)
  - Automatisiertes Test-Gate (Tests müssen bestanden sein)

___

## Detailliert Testing Plan

#### ● Spezifiziert, welche Teile der Anwendung auf welcher Teststufe (Unit, Integration, E2E) mit welchen Tools/Frameworks getestet werden.
Unit Tests führen wir mit JestJS durch.

Integration Tests führen wir mit einer Kombination aus JestJS und React Testing Library durch.

End2End Tests führen wir mit Playwright durch.

Möglicherweise überlegen wir uns auch Cypress zu verwenden für Integrations und End2End Tests.

#### ● Wo laufen Tests? (Lokal, in CI, nach Deployment in Stage).
Tests sollen Lokal, in der CI als auch beim Deployment durchgeführt werden um die Anwendung möglichst Stabil zu gewährleisten.

#### ● Wie wird Testautomatisierung integriert (in der CI/CD Pipeline)?
Über GitHub Actions.

___

## Detaillierte Security Planung

### Wie werden die wichtigsten Sicherheitsaspekte konkret umgesetzt?
Mithilfe von Best Practices.

#### ● Wie sieht Input-Validierung im Backend aus?
Als Beispiel wird es eine Input-Validierung geben für Account Namen und Account Passwörter. Für die Passwörter als Beispiel wird geprüft ob sie mindestens einen Großbuchstaben, ein Sonderzeichen und eine Zahl enthalten um Best Practices zu gewährleisten.
Für Datenbank Inputs, wird es eine Validierung geben um SQL Injections vorzubeugen, was ohnehin erschwert wird durch unser ORM.

#### ● Wie werden Passwörter gehasht?
Wir hashen Passwörter mithilfe von Bcrypt.

#### ● Wie werden Secrets in K8s/IaC gehandhabt?
Secrets wie Datenbank-Passwörter oder Tokens werden in Kubernetes als Secret-Objekte hinterlegt und über Umgebungsvariablen an Pods übergeben. In Terraform werden sensible Daten nicht im Code gespeichert, sondern über externe Variablen oder CI/CD-Secrets eingebunden.

#### ● Welche Firewall-Regeln in SG/NetworkPolicy?
AWS Security Groups werden so konfiguriert, dass nur notwendiger Traffic erlaubt ist (z. B. nur Port 443 von außen). Innerhalb des Clusters können später Kubernetes NetworkPolicies eingesetzt werden, um Kommunikation zwischen Pods gezielt zu erlauben oder zu blockieren.

#### ● Authentifizierung/Autorisierung falls im Scope
Authentifizierung wird im Frontend über JWT Tokens geregelt.
Autorisierung wird über Rollen definiert die zum Account in der Datenbank gespeichert werden.

___

# Detaillierte Monitoring & Logging Planung

## Welche Metriken sind wichtig? Wie werden sie gesammelt?

### Backend
- **CPU, RAM, Request-Dauer, Error Rate** → gesammelt über Prometheus Node Exporter und HTTP-Metrics (z. B. via Express Middleware)

### Frontend
- Wird meist nicht aktiv überwacht, außer über Verfügbarkeits-Checks

### Datenbank
- **Speicherverbrauch, Verbindungen, Reaktionszeit** → gesammelt über Postgres Exporter

## Welche Logs sind wichtig? Wie werden sie zentral gesammelt?

- **Anwendungslogs** aus dem Backend (z. B. Fehler, Login-Versuche, API-Requests) werden mit Winston erzeugt
- Logs werden mit **Promtail** von den Containern gelesen und an **Loki** geschickt
- Visualisierung und Suche erfolgt zentral über **Grafana**

## Welche Alarme sind kritisch?

- **Fehlerrate zu hoch** (z. B. viele 5xx-Fehler)
- **Hohe Latenz** bei API-Antworten
- **Volle Festplatte** oder fast belegter Persistent Volume Speicher
- **Backend nicht erreichbar** (z. B. kein Response innerhalb von Sekunden)

## Wie werden die Monitoring-/Logging-Tools eingesetzt?

- **Prometheus** sammelt Metriken über Exporter und speichert sie im Cluster
- **Grafana** stellt Dashboards für Metriken und Logs bereit
- **Loki** speichert Logs, Promtail sendet diese direkt aus den Pods
- Alerts können über Grafana definiert und z. B. per Slack oder E-Mail gesendet werden

___

## Detaillierter Umsetzungszeitplan

1. Woche: Infrastruktur und Datenbank
2. Woche: Features + Design + Deployment Tests
3. Woche: Deployment und Präsentation

___

## Reflexion

● Überlegt während der Erarbeitung des Dokuments und dokumentiert (als Teil des
Dokuments):

● Welche technischen Aspekte waren am schwierigsten detailliert zu planen? Warum?

● Wo seht ihr die größten technischen Risiken während der Umsetzung? Wie plant ihr,
diese zu minimieren?

● Welche Entscheidungen im Plan erfordern voraussichtlich die meiste Recherche/das
meiste Experimentieren während der Umsetzung?

● Wie stellt euer Plan sicher, dass alle gelernten Bausteine (Docker, K8s Objekte, IaC,
CI/CD, Monitoring etc.) integriert und korrekt angewendet werden?
