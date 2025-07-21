{{/*
Expand the name of the chart.
*/}}
{{- define "loop-it.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "loop-it.fullname" -}}
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
{{- define "loop-it.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "loop-it.labels" -}}
helm.sh/chart: {{ include "loop-it.chart" . }}
{{ include "loop-it.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: loop-it
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "loop-it.selectorLabels" -}}
app.kubernetes.io/name: {{ include "loop-it.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend specific labels
*/}}
{{- define "loop-it.backend.labels" -}}
{{ include "loop-it.labels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "loop-it.backend.selectorLabels" -}}
{{ include "loop-it.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend specific labels
*/}}
{{- define "loop-it.frontend.labels" -}}
{{ include "loop-it.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "loop-it.frontend.selectorLabels" -}}
{{ include "loop-it.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
PostgreSQL specific labels
*/}}
{{- define "loop-it.postgresql.labels" -}}
{{ include "loop-it.labels" . }}
app.kubernetes.io/component: postgresql
{{- end }}

{{/*
PostgreSQL selector labels
*/}}
{{- define "loop-it.postgresql.selectorLabels" -}}
{{ include "loop-it.selectorLabels" . }}
app.kubernetes.io/component: postgresql
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "loop-it.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "loop-it.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate backend image name
*/}}
{{- define "loop-it.backend.image" -}}
{{- $registry := .Values.global.imageRegistry | default "" -}}
{{- $repository := .Values.backend.image.repository -}}
{{- $tag := .Values.backend.image.tag | default .Chart.AppVersion -}}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }}

{{/*
Generate frontend image name
*/}}
{{- define "loop-it.frontend.image" -}}
{{- $registry := .Values.global.imageRegistry | default "" -}}
{{- $repository := .Values.frontend.image.repository -}}
{{- $tag := .Values.frontend.image.tag | default .Chart.AppVersion -}}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }}

{{/*
Generate PostgreSQL image name
*/}}
{{- define "loop-it.postgresql.image" -}}
{{- $registry := .Values.global.imageRegistry | default "" -}}
{{- $repository := .Values.postgresql.image.repository -}}
{{- $tag := .Values.postgresql.image.tag -}}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }}

{{/*
Database URL for backend
*/}}
{{- define "loop-it.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
{{- $host := printf "%s-postgresql" (include "loop-it.fullname" .) }}
{{- $port := .Values.postgresql.service.port | toString }}
{{- $user := .Values.postgresql.auth.username }}
{{- $database := .Values.postgresql.auth.database }}
{{- printf "postgresql://%s:$(POSTGRES_PASSWORD)@%s:%s/%s" $user $host $port $database }}
{{- else }}
{{- .Values.externalDatabase.url }}
{{- end }}
{{- end }}

{{/*
PostgreSQL secret name
*/}}
{{- define "loop-it.postgresql.secretName" -}}
{{- if .Values.postgresql.enabled }}
{{- if .Values.secrets.external.enabled }}
{{- .Values.secrets.external.postgresqlSecretName }}
{{- else }}
{{- printf "%s-postgresql" (include "loop-it.fullname" .) }}
{{- end }}
{{- else }}
{{- .Values.externalDatabase.secretName }}
{{- end }}
{{- end }}

{{/*
JWT secret name
*/}}
{{- define "loop-it.jwt.secretName" -}}
{{- if .Values.secrets.external.enabled }}
{{- .Values.secrets.external.jwtSecretName }}
{{- else }}
{{- printf "%s-jwt" (include "loop-it.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Storage class name
*/}}
{{- define "loop-it.storageClass" -}}
{{- if .Values.global.storageClass }}
{{- .Values.global.storageClass }}
{{- else if .Values.aws.storageClasses.gp3.enabled }}
{{- "gp3" }}
{{- else }}
{{- "default" }}
{{- end }}
{{- end }}

{{/*
Common annotations
*/}}
{{- define "loop-it.annotations" -}}
{{- with .Values.commonAnnotations }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Prometheus annotations for services
*/}}
{{- define "loop-it.prometheus.annotations" -}}
{{- $root := .root -}}
{{- if $root.Values.monitoring.enabled }}
prometheus.io/scrape: "true"
prometheus.io/port: {{ .port | quote }}
prometheus.io/path: {{ .path | default "/metrics" | quote }}
{{- end }}
{{- end }}

{{/*
AWS ECR image repository URL
*/}}
{{- define "loop-it.aws.ecrUrl" -}}
{{- if .Values.aws.ecr.enabled }}
{{- printf "%s.dkr.ecr.%s.amazonaws.com" .Values.aws.ecr.registryId .Values.aws.region }}
{{- end }}
{{- end }}

{{/*
Backend ECR image with registry
*/}}
{{- define "loop-it.backend.ecrImage" -}}
{{- if .Values.aws.ecr.enabled }}
{{- $ecrUrl := include "loop-it.aws.ecrUrl" . }}
{{- $repository := .Values.aws.ecr.backendRepository }}
{{- $tag := .Values.backend.image.tag | default .Chart.AppVersion }}
{{- printf "%s/%s:%s" $ecrUrl $repository $tag }}
{{- else }}
{{- include "loop-it.backend.image" . }}
{{- end }}
{{- end }}

{{/*
Frontend ECR image with registry
*/}}
{{- define "loop-it.frontend.ecrImage" -}}
{{- if .Values.aws.ecr.enabled }}
{{- $ecrUrl := include "loop-it.aws.ecrUrl" . }}
{{- $repository := .Values.aws.ecr.frontendRepository }}
{{- $tag := .Values.frontend.image.tag | default .Chart.AppVersion }}
{{- printf "%s/%s:%s" $ecrUrl $repository $tag }}
{{- else }}
{{- include "loop-it.frontend.image" . }}
{{- end }}
{{- end }}

{{/*
Ingress API version
*/}}
{{- define "loop-it.ingress.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "networking.k8s.io/v1" -}}
networking.k8s.io/v1
{{- else if .Capabilities.APIVersions.Has "networking.k8s.io/v1beta1" -}}
networking.k8s.io/v1beta1
{{- else -}}
extensions/v1beta1
{{- end -}}
{{- end }}

{{/*
HPA API version
*/}}
{{- define "loop-it.hpa.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "autoscaling/v2" -}}
autoscaling/v2
{{- else -}}
autoscaling/v2beta2
{{- end -}}
{{- end }}

{{/*
Pod Disruption Budget API version
*/}}
{{- define "loop-it.pdb.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "policy/v1" -}}
policy/v1
{{- else -}}
policy/v1beta1
{{- end -}}
{{- end }}