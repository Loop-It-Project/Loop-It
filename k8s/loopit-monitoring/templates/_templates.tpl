{{/*
Expand the name of the chart.
*/}}
{{- define "loopit-monitoring.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "loopit-monitoring.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "loopit-monitoring.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "loopit-monitoring.labels" -}}
helm.sh/chart: {{ include "loopit-monitoring.chart" . }}
{{ include "loopit-monitoring.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: loop-it
{{- with .Values.labels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "loopit-monitoring.selectorLabels" -}}
app.kubernetes.io/name: {{ include "loopit-monitoring.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use for Prometheus
*/}}
{{- define "loopit-monitoring.prometheus.serviceAccountName" -}}
{{- if .Values.rbac.serviceAccount.create }}
{{- default (printf "%s-prometheus" (include "loopit-monitoring.fullname" .)) .Values.rbac.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.rbac.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use for Promtail
*/}}
{{- define "loopit-monitoring.promtail.serviceAccountName" -}}
{{- if .Values.rbac.serviceAccount.create }}
{{- default (printf "%s-promtail" (include "loopit-monitoring.fullname" .)) .Values.rbac.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.rbac.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Prometheus labels
*/}}
{{- define "loopit-monitoring.prometheus.labels" -}}
{{ include "loopit-monitoring.labels" . }}
app.kubernetes.io/component: prometheus
{{- end }}

{{/*
Prometheus selector labels
*/}}
{{- define "loopit-monitoring.prometheus.selectorLabels" -}}
{{ include "loopit-monitoring.selectorLabels" . }}
app.kubernetes.io/component: prometheus
app: prometheus
{{- end }}

{{/*
Grafana labels
*/}}
{{- define "loopit-monitoring.grafana.labels" -}}
{{ include "loopit-monitoring.labels" . }}
app.kubernetes.io/component: grafana
{{- end }}

{{/*
Grafana selector labels
*/}}
{{- define "loopit-monitoring.grafana.selectorLabels" -}}
{{ include "loopit-monitoring.selectorLabels" . }}
app.kubernetes.io/component: grafana
app: grafana
{{- end }}

{{/*
Loki labels
*/}}
{{- define "loopit-monitoring.loki.labels" -}}
{{ include "loopit-monitoring.labels" . }}
app.kubernetes.io/component: loki
{{- end }}

{{/*
Loki selector labels
*/}}
{{- define "loopit-monitoring.loki.selectorLabels" -}}
{{ include "loopit-monitoring.selectorLabels" . }}
app.kubernetes.io/component: loki
app: loki
{{- end }}

{{/*
Promtail labels
*/}}
{{- define "loopit-monitoring.promtail.labels" -}}
{{ include "loopit-monitoring.labels" . }}
app.kubernetes.io/component: promtail
{{- end }}

{{/*
Promtail selector labels
*/}}
{{- define "loopit-monitoring.promtail.selectorLabels" -}}
{{ include "loopit-monitoring.selectorLabels" . }}
app.kubernetes.io/component: promtail
app: promtail
{{- end }}


{{/*
Create image name with registry and tag
*/}}
{{- define "loopit-monitoring.image" -}}
{{- $registryName := .registry -}}
{{- $repositoryName := .repository -}}
{{- $tag := .tag | toString -}}
{{- $globalRegistry := .global.imageRegistry -}}
{{- if $globalRegistry }}
{{- printf "%s/%s:%s" $globalRegistry $repositoryName $tag -}}
{{- else if $registryName }}
{{- printf "%s/%s:%s" $registryName $repositoryName $tag -}}
{{- else }}
{{- printf "%s:%s" $repositoryName $tag -}}
{{- end }}
{{- end }}

{{/*
Generate Grafana admin password
*/}}
{{- define "loopit-monitoring.grafana.secretKey" -}}
{{- if .Values.grafana.security.secretKey }}
{{- .Values.grafana.security.secretKey }}
{{- else }}
{{- randAlphaNum 32 | b64enc }}
{{- end }}
{{- end }}

{{/*
Generate storage class (robust, works even if .Values.global is missing)
*/}}
{{- define "loopit-monitoring.storageClass" -}}
{{- if and .Values.global (hasKey .Values.global "storageClass") }}
  {{- .Values.global.storageClass | quote }}
{{- else }}
  null
{{- end }}
{{- end }}

{{/*
Common annotations
*/}}
{{- define "loopit-monitoring.annotations" -}}
{{- with .Values.annotations }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Pod annotations for component
*/}}
{{- define "loopit-monitoring.podAnnotations" -}}
{{- if .podAnnotations }}
{{ toYaml .podAnnotations }}
{{- end }}
{{- with .Values.annotations }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Service annotations for component
*/}}
{{- define "loopit-monitoring.serviceAnnotations" -}}
{{- if .serviceAnnotations }}
{{ toYaml .serviceAnnotations }}
{{- end }}
{{- with .Values.service.annotations }}
{{ toYaml . }}
{{- end }}
{{- with .Values.annotations }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Create ingress host for component
*/}}
{{- define "loopit-monitoring.ingress.host" -}}
{{- if .host }}
{{- .host }}
{{- else }}
{{- printf "%s.localhost" .component }}
{{- end }}
{{- end }}

{{/*
Validate required values
*/}}
{{- define "loopit-monitoring.validateValues" -}}
{{- if not .Values.grafana.admin.password }}
{{- fail "grafana.admin.password is required" }}
{{- end }}
{{- if and .Values.ingress.enabled (not .Values.ingress.hosts.grafana) }}
{{- fail "ingress.hosts.grafana is required when ingress is enabled" }}
{{- end }}
{{- end }}

{{/*
Resource limits and requests
*/}}
{{- define "loopit-monitoring.resources" -}}
{{- if .resources }}
resources:
  {{- if .resources.limits }}
  limits:
    {{- if .resources.limits.cpu }}
    cpu: {{ .resources.limits.cpu }}
    {{- end }}
    {{- if .resources.limits.memory }}
    memory: {{ .resources.limits.memory }}
    {{- end }}
  {{- end }}
  {{- if .resources.requests }}
  requests:
    {{- if .resources.requests.cpu }}
    cpu: {{ .resources.requests.cpu }}
    {{- end }}
    {{- if .resources.requests.memory }}
    memory: {{ .resources.requests.memory }}
    {{- end }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Security context
*/}}
{{- define "loopit-monitoring.securityContext" -}}
{{- if .securityContext }}
securityContext:
  {{- toYaml .securityContext | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Health check probes
*/}}
{{- define "loopit-monitoring.healthCheck" -}}
{{- if .healthCheck }}
livenessProbe:
  httpGet:
    path: {{ .healthCheck.liveness.path }}
    port: {{ .port }}
  initialDelaySeconds: {{ .healthCheck.liveness.initialDelaySeconds }}
  periodSeconds: {{ .healthCheck.liveness.periodSeconds }}
  timeoutSeconds: {{ .healthCheck.liveness.timeoutSeconds }}
  failureThreshold: {{ .healthCheck.liveness.failureThreshold }}
readinessProbe:
  httpGet:
    path: {{ .healthCheck.readiness.path }}
    port: {{ .port }}
  initialDelaySeconds: {{ .healthCheck.readiness.initialDelaySeconds }}
  periodSeconds: {{ .healthCheck.readiness.periodSeconds }}
  timeoutSeconds: {{ .healthCheck.readiness.timeoutSeconds }}
  failureThreshold: {{ .healthCheck.readiness.failureThreshold }}
{{- end }}
{{- end }}