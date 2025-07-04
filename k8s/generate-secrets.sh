#!/bin/bash

echo "Kubernetes Secrets Generator"
echo "============================="

# Sichere Passwörter generieren
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Base64 kodieren für Kubernetes
POSTGRES_PASSWORD_B64=$(echo -n "$POSTGRES_PASSWORD" | base64)
JWT_SECRET_B64=$(echo -n "$JWT_SECRET" | base64)

echo "Generierte Secrets:"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"
echo ""
echo "Base64 kodiert für Kubernetes:"
echo "postgres-password: $POSTGRES_PASSWORD_B64"
echo "jwt-secret: $JWT_SECRET_B64"
echo ""

# Secrets YAML erstellen
cat > k8s/secrets-generated.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: loopit-secrets
  namespace: loopit-dev
type: Opaque
data:
  postgres-password: $POSTGRES_PASSWORD_B64
  jwt-secret: $JWT_SECRET_B64
EOF

echo "Neue secrets-generated.yaml erstellt!"
echo "WICHTIG: Diese Datei NICHT in Git committen!"
echo ""
echo "Verwenden:"
echo "kubectl apply -f k8s/secrets-generated.yaml"