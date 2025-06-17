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

## Kubernetes Deployment Design

(Platzhalter)

___

## IaC (Terraform) Design

(Platzhalter)

___

## CI/CD Pipeline Design

(Platzhalter)

___

## Detailliert Testing Plan

#### ● Spezifiziert, welche Teile der Anwendung auf welcher Teststufe (Unit, Integration, E2E) mit welchen Tools/Frameworks getestet werden.
Unit Tests führend wir mit JestJS durch.

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

#### ● Welche Firewall-Regeln in SG/NetworkPolicy?

#### ● Authentifizierung/Autorisierung falls im Scope
Authentifizierung wird im Frontend über JWT Tokens geregelt.
Autorisierung wird über Rollen definiert die zum Account in der Datenbank gespeichert werden.

___

## Detaillierte Monitoring & Logging Planung

(Platzhalter)

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
