# Monitoring Setup

## Übersicht

Das Loop-It Monitoring-System basiert auf einem modernen Observability-Stack mit Prometheus für Metriken-Sammlung und Grafana für Visualisierung. Das System überwacht die Backend-Performance, HTTP-Requests und System-Ressourcen in Echtzeit.

## Architektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Loop-It       │    │   Prometheus    │    │    Grafana      │
│   Backend       │───▶│   (Metrics)     │───▶│ (Visualization) │
│   :3000         │    │   :9090         │    │   :3001         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Komponenten

### Prometheus (v2.53.5)
- **Port**: 9090
- **Funktion**: Metriken-Sammlung und Storage
- **Scraping-Interval**: 15s
- **Retention**: 7 Tage
- **Endpoints**: `/metrics` vom Backend

### Grafana (latest)
- **Port**: 3001
- **Funktion**: Dashboard und Visualisierung
- **Login**: admin / admin
- **Data Source**: Prometheus

### Backend Metrics
- **Endpoint**: `http://localhost:3000/metrics`
- **Format**: Prometheus-kompatible Metriken
- **Middleware**: Express-Integration für automatisches Tracking

## Verfügbare Metriken

### System-Metriken
- `process_cpu_user_seconds_total` - CPU-Zeit (User)
- `process_cpu_system_seconds_total` - CPU-Zeit (System)
- `process_resident_memory_bytes` - Arbeitsspeicher-Verbrauch
- `process_heap_bytes` - Heap-Größe
- `nodejs_heap_size_used_bytes` - Node.js Heap-Verbrauch
- `nodejs_eventloop_lag_seconds` - Event-Loop-Verzögerung

### HTTP-Metriken
- `http_requests_total` - Anzahl HTTP-Requests (nach Method, Route, Status)
- `http_request_duration_seconds` - Response-Zeit-Histogramm

### Business-Metriken
- `user_registrations_total` - Anzahl User-Registrierungen
- `universe_creations_total` - Anzahl Universe-Erstellungen

## Log-Daten

### Verfügbare Log-Streams
- **Backend-Logs**: HTTP-Requests, Debug-Informationen
- **Prometheus-Logs**: Scraping-Activity, Alerts
- **Grafana-Logs**: Plugin-Updates, User-Sessions
- **Loki-Logs**: Log-Processing, Ingestion-Stats
- **System-Logs**: Container-Events, Docker-Logs

### Log-Labels
- `job` - Service-Typ (docker, system)
- `container_name` - Container-Name
- `service_name` - Service-Bezeichnung
- `stream` - stdout/stderr
- `filename` - Log-Datei-Pfad
- `detected_level` - Automatisch erkannter Log-Level

## Setup und Deployment

### Voraussetzungen
- Docker und Docker Compose
- Loop-It Backend läuft auf Port 3000

### Installation

1. **Monitoring-Verzeichnis wechseln**:
```bash
cd monitoring
```

2. **Sichere Environment-Variablen erstellen**:
```bash
# Erstelle .env.monitoring mit sicheren Passwörtern
cat > .env.monitoring << 'EOF'
GRAFANA_ADMIN_PASSWORD=SuperSecurePassword123!
GRAFANA_SECRET_KEY=MySuperSecretKey456789
GRAFANA_ADMIN_USER=admin
PROMETHEUS_ADMIN_PASSWORD=PrometheusSecure789!
PROMETHEUS_WEB_EXTERNAL_URL=http://localhost:9090
LOKI_AUTH_ENABLED=false
PROMETHEUS_RETENTION_TIME=7d
MONITORING_NETWORK=loop-it_loop-it-network
EOF
```

3. **Monitoring-Stack starten**:
```bash
docker-compose -f docker-compose.monitoring.yml --env-file .env.monitoring up -d
```

4. **Services prüfen**:
```bash
docker-compose -f docker-compose.monitoring.yml ps
```

5. **Prometheus Targets prüfen**:
```bash
curl http://localhost:9090/targets
```

### Verzeichnisstruktur
```
Loop-It/
├── monitoring/
│   ├── .env.monitoring                    # Sichere Environment-Variablen
│   ├── docker-compose.monitoring.yml     # Monitoring-Stack
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── loki/
│   │   └── loki-config.yml
│   ├── promtail/
│   │   └── promtail-config.yml
│   └── grafana/
│       └── provisioning/
│           └── datasources/
│               └── datasources.yml
└── README.md
```

### Konfiguration

#### Prometheus (`monitoring/prometheus/prometheus.yml`)
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'loop-it-backend'
    static_configs:
      - targets: ['loop-it-backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
  
  - job_name: 'loop-it-health'
    static_configs:
      - targets: ['loop-it-backend:3000']
    metrics_path: '/health'
    scrape_interval: 30s
```

#### Sichere Environment-Variablen (`.env.monitoring`)
```bash
# Monitoring Stack Security Configuration
GRAFANA_ADMIN_PASSWORD=SuperSecurePassword123!
GRAFANA_SECRET_KEY=MySuperSecretKey456789
GRAFANA_ADMIN_USER=admin
PROMETHEUS_ADMIN_PASSWORD=PrometheusSecure789!
PROMETHEUS_WEB_EXTERNAL_URL=http://localhost:9090
LOKI_AUTH_ENABLED=false
PROMETHEUS_RETENTION_TIME=7d
MONITORING_NETWORK=loop-it_loop-it-network
```

#### Docker Compose (`monitoring/docker-compose.monitoring.yml`)
```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: loop-it-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=${PROMETHEUS_RETENTION_TIME:-7d}'
      - '--web.enable-lifecycle'
      - '--web.external-url=${PROMETHEUS_WEB_EXTERNAL_URL:-http://localhost:9090}'
    environment:
      - PROMETHEUS_ADMIN_PASSWORD=${PROMETHEUS_ADMIN_PASSWORD}
    networks:
      - loop-it-network
    restart: unless-stopped
    user: "nobody"
    read_only: true
    tmpfs:
      - /tmp

  grafana:
    image: grafana/grafana:latest
    container_name: loop-it-grafana
    ports:
      - "3001:3000"
    environment:
      # Security Settings
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_SECURITY_SECRET_KEY=${GRAFANA_SECRET_KEY}
      - GF_SECURITY_COOKIE_SECURE=true
      - GF_SECURITY_COOKIE_SAMESITE=strict
      - GF_SECURITY_CONTENT_TYPE_PROTECTION=true
      - GF_SECURITY_X_CONTENT_TYPE_OPTIONS=true
      - GF_SECURITY_X_XSS_PROTECTION=true
      
      # User Management
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_USERS_ALLOW_ORG_CREATE=false
      - GF_USERS_AUTO_ASSIGN_ORG=true
      - GF_USERS_AUTO_ASSIGN_ORG_ROLE=Viewer
      
      # Authentication
      - GF_AUTH_ANONYMOUS_ENABLED=false
      - GF_AUTH_BASIC_ENABLED=true
      - GF_AUTH_DISABLE_LOGIN_FORM=false
      
      # Logging
      - GF_LOG_LEVEL=warn
      - GF_LOG_MODE=console
      - GF_LOG_FILTERS=rendering:debug
      
      # Server Settings
      - GF_SERVER_DOMAIN=localhost
      - GF_SERVER_ROOT_URL=http://localhost:3001
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
      - loki
    networks:
      - loop-it-network
    restart: unless-stopped
    user: "472"

  loki:
    image: grafana/loki:latest
    container_name: loop-it-loki
    ports:
      - "3100:3100"
    volumes:
      - ./loki/loki-config.yml:/etc/loki/local-config.yaml:ro
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    environment:
      - LOKI_AUTH_ENABLED=${LOKI_AUTH_ENABLED:-false}
      - LOKI_SERVER_HTTP_LISTEN_PORT=${LOKI_SERVER_HTTP_LISTEN_PORT:-3100}
    networks:
      - loop-it-network
    restart: unless-stopped
    user: "10001"
    read_only: true
    tmpfs:
      - /tmp

  promtail:
    image: grafana/promtail:latest
    container_name: loop-it-promtail
    volumes:
      - ./promtail/promtail-config.yml:/etc/promtail/config.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    networks:
      - loop-it-network
    restart: unless-stopped
    user: "0"  # Needs root for Docker socket access

volumes:
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
  loki_data:
    driver: local

networks:
  loop-it-network:
    name: ${MONITORING_NETWORK:-loop-it_loop-it-network}
    external: true
```

#### Loki Configuration (`monitoring/loki/loki-config.yml`)
```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  instance_addr: 127.0.0.1
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

analytics:
  reporting_enabled: false
```

#### Promtail Configuration (`monitoring/promtail/promtail-config.yml`)
```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/*/*log
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs:
      - json:
          source: attrs
          expressions:
            tag:
      - regex:
          source: tag
          expression: '^(?P<container_name>(?:[^|]*))'
      - timestamp:
          source: time
          format: RFC3339Nano
      - labels:
          stream:
          container_name:
      - output:
          source: output
```

#### Grafana Data Sources (`monitoring/grafana/provisioning/datasources/datasources.yml`)
```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: true
    jsonData:
      maxLines: 1000
      derivedFields:
        - datasourceUid: Prometheus
          matcherRegex: "request_id=(\\w+)"
          name: "Request ID"
          url: "/explore?orgId=1&left=%7B%22datasource%22:%22Prometheus%22,%22queries%22:%5B%7B%22expr%22:%22http_requests_total%7Brequest_id%3D%5C%22${__value.raw}%5C%22%7D%22%7D%5D%7D"
```

## Backend-Integration

### Metrics-Middleware (`src/middleware/metrics.ts`)

```typescript
import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode.toString()
    });
  });
  
  next();
};
```

### Server-Integration (`src/server.ts`)
```typescript
import { metricsMiddleware, getMetrics } from './middleware/metrics';

app.use(metricsMiddleware);
app.get('/metrics', getMetrics);
```

## Grafana Dashboards und Queries

### Prometheus-Queries

**HTTP Request Rate**:
```promql
rate(http_requests_total[5m])
```

**Memory Usage**:
```promql
process_resident_memory_bytes / 1024 / 1024
```

**Response Time (95th percentile)**:
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Error Rate**:
```promql
rate(http_requests_total{status_code=~"4..|5.."}[5m])
```

### Loki-Queries

**Backend HTTP-Requests**:
```
{job="docker"} |= "📨"
```

**Error-Logs**:
```
{job="docker"} |= "error" or |= "ERROR"
```

**Container-spezifische Logs**:
```
{container_name="loop-it-backend"}
```

**Prometheus-Scraping-Aktivität**:
```
{job="docker"} |= "Prometheus"
```

**JSON-Parsing für strukturierte Logs**:
```
{job="docker"} |= "📨" | json
```

**Log-Level-Filtering**:
```
{job="docker"} | json | level="error"
```

### Korrelation zwischen Metriken und Logs

**Metrics-to-Logs Navigation**:
- Von Prometheus-Alerting direkt zu korrelierenden Logs
- Request-ID-basierte Korrelation
- Zeitbasierte Log-Suche aus Metriken-Dashboards

**Logs-to-Metrics Navigation**:
- Aus Log-Entries zu korrelierenden Metriken
- Performance-Analyse aus Error-Logs

### Dashboard-Struktur
- **HTTP Requests**: Anzahl Requests nach Endpoint
- **Response Times**: Latenz-Verteilung
- **Error Rates**: 4xx/5xx Fehlerrate
- **System Resources**: CPU, Memory, Heap
- **Live Logs**: Echtzeit-Log-Streaming
- **Log Analysis**: Strukturierte Log-Auswertung
- **Correlation Views**: Metriken + Logs zusammen

## Grafana Explore

### Metrics Exploration
- **URL**: http://localhost:3001/explore
- **Data Source**: Prometheus
- **Features**: Query-Builder, Metriken-Browser, Alerting

### Logs Exploration
- **URL**: http://localhost:3001/explore
- **Data Source**: Loki
- **Features**: Live-Logs, Log-Filtering, JSON-Parsing, Correlation

## Troubleshooting

### Häufige Probleme

**Prometheus kann Backend nicht erreichen**:
- Prüfe ob Backend läuft: `curl http://localhost:3000/metrics`
- Prüfe Docker-Netzwerk: `docker network ls`
- Prüfe Targets: `http://localhost:9090/targets`

**Grafana zeigt keine Daten**:
- Prüfe Prometheus-Verbindung in Grafana
- Prüfe Data Source-Konfiguration
- Prüfe Query-Syntax

**Metriken fehlen**:
- Prüfe Middleware-Integration im Backend
- Prüfe Prometheus-Scraping-Konfiguration
- Prüfe Container-Logs: `docker-compose logs backend`

### Debugging-Befehle

```bash
# Prometheus-Status prüfen
curl http://localhost:9090/api/v1/status/buildinfo

# Loki-Status prüfen
curl http://localhost:3100/ready

# Metriken manuell abrufen
curl http://localhost:3000/metrics

# Loki-Logs direkt abfragen
curl "http://localhost:3100/loki/api/v1/query_range?query=%7Bjob%3D%22docker%22%7D"

# Container-Logs anzeigen (aus dem monitoring/ Verzeichnis)
docker-compose -f docker-compose.monitoring.yml logs prometheus
docker-compose -f docker-compose.monitoring.yml logs grafana
docker-compose -f docker-compose.monitoring.yml logs loki
docker-compose -f docker-compose.monitoring.yml logs promtail

# Backend-Logs (aus dem Root-Verzeichnis)
docker-compose logs backend

# Targets-Status prüfen
curl http://localhost:9090/api/v1/targets

# Grafana Data Sources prüfen (mit sicheren Credentials)
curl -u admin:SuperSecurePassword123! http://localhost:3001/api/datasources
```

### Stack-Management

```bash
# Stack starten
cd monitoring
docker-compose -f docker-compose.monitoring.yml --env-file .env.monitoring up -d

# Stack stoppen
docker-compose -f docker-compose.monitoring.yml down

# Stack neu starten
docker-compose -f docker-compose.monitoring.yml restart

# Services-Status prüfen
docker-compose -f docker-compose.monitoring.yml ps

# Logs verfolgen
docker-compose -f docker-compose.monitoring.yml logs -f
```

## Wartung und Updates

### Daten-Persistenz
- **Prometheus**: `/prometheus` (7 Tage Retention)
- **Grafana**: `/var/lib/grafana` (Dashboards und Konfiguration)
- **Loki**: `/loki` (7 Tage Log-Retention)
- **Promtail**: `/tmp/positions.yaml` (Log-Position-Tracking)

### Backup
```bash
# Prometheus-Daten sichern
docker run --rm -v prometheus_data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus_backup.tar.gz /data

# Grafana-Daten sichern
docker run --rm -v grafana_data:/data -v $(pwd):/backup alpine tar czf /backup/grafana_backup.tar.gz /data

# Loki-Daten sichern
docker run --rm -v loki_data:/data -v $(pwd):/backup alpine tar czf /backup/loki_backup.tar.gz /data
```

### Updates
```bash
# Aus dem monitoring/ Verzeichnis
cd monitoring

# Images aktualisieren
docker-compose -f docker-compose.monitoring.yml pull

# Services neu starten
docker-compose -f docker-compose.monitoring.yml down
docker-compose -f docker-compose.monitoring.yml --env-file .env.monitoring up -d
```

## Sicherheit

### Environment-Variablen
- **Sichere Passwörter**: Keine hardcoded Credentials
- **Separate Konfiguration**: `.env.monitoring` für Monitoring-Stack
- **Verschlüsselte Kommunikation**: HTTPS-ready Konfiguration
- **User-Management**: Disabled Sign-ups, Role-based Access

### Security Features
- **Cookie-Sicherheit**: Secure, SameSite-Schutz
- **XSS-Schutz**: Content-Type-Protection aktiviert
- **Read-only Container**: Prometheus läuft mit eingeschränkten Rechten
- **Network-Isolation**: Separate Docker-Netzwerke

### .gitignore
```bash
# Füge zur .gitignore hinzu
monitoring/.env.monitoring
*.key
*.pem
*.crt
secrets/
```

## Erweiterte Konfiguration

### Alerts (zukünftig)
- Alertmanager für Benachrichtigungen
- Grafana-Alerts für kritische Metriken
- Slack/Email-Integration

### Zusätzliche Metriken
- Database-Metriken (PostgreSQL)
- Redis-Metriken (wenn verwendet)
- Custom Business-Metriken

### Skalierung
- Prometheus-Sharding für große Deployments
- Grafana-Teams und Permissions
- Long-term Storage (Thanos/Cortex)

## Nützliche Links

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node.js Prometheus Metrics](https://github.com/siimon/prom-client)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## Monitoring-URLs

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/SuperSecurePassword123!)
- **Loki**: http://localhost:3100
- **Backend Metrics**: http://localhost:3000/metrics
- **Backend Health**: http://localhost:3000/health

## Erweiterte Features

### Log-Korrelation
- **Request-ID-Tracking**: Automatische Korrelation zwischen Metrics und Logs
- **Zeitbasierte Navigation**: Von Metriken-Anomalien zu korrelierenden Logs
- **Multi-Service-Tracing**: Logs über mehrere Container hinweg

### Alerting (bereit für Konfiguration)
- **Prometheus-Alerts**: Basierend auf Metriken-Schwellwerten
- **Loki-Alerts**: Basierend auf Log-Patterns
- **Grafana-Alerts**: Kombinierte Metriken- und Log-Alerts

### Performance-Monitoring
- **Real-time Dashboards**: Live-Metriken und Log-Streaming
- **Historical Analysis**: Langzeit-Trends und Patterns
- **Anomaly Detection**: Automatische Erkennung von Unregelmäßigkeiten

## Quick Start

```bash
# 1. Zum Monitoring-Verzeichnis wechseln
cd monitoring

# 2. Environment-Variablen erstellen
cat > .env.monitoring << 'EOF'
GRAFANA_ADMIN_PASSWORD=SuperSecurePassword123!
GRAFANA_SECRET_KEY=MySuperSecretKey456789
GRAFANA_ADMIN_USER=admin
PROMETHEUS_ADMIN_PASSWORD=PrometheusSecure789!
PROMETHEUS_WEB_EXTERNAL_URL=http://localhost:9090
LOKI_AUTH_ENABLED=false
PROMETHEUS_RETENTION_TIME=7d
MONITORING_NETWORK=loop-it_loop-it-network
EOF

# 3. Stack starten
docker-compose -f docker-compose.monitoring.yml --env-file .env.monitoring up -d

# 4. Grafana öffnen
open http://localhost:3001
# Login: admin / SuperSecurePassword123!
```