#!/bin/bash
# SSL Setup Script für Loop-It Demo

echo "��� Setting up SSL for loopit.tech..."

# 1. cert-manager installieren
echo "��� Installing cert-manager..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.18.2/cert-manager.yaml

# 2. Warten bis cert-manager ready
echo "⏳ Waiting for cert-manager to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager -n cert-manager --timeout=300s

# 3. ClusterIssuer erstellen
echo "��� Creating Let's Encrypt ClusterIssuer..."
kubectl apply -f - <<YAML
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email:
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
YAML

# 4. HTTPS Ingress erstellen
echo "��� Creating HTTPS Ingress..."
kubectl apply -f - <<YAML
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: loop-it-https
  namespace: loop-it
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - loopit.tech
    secretName: loopit-tls
  rules:
  - host: loopit.tech
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
      - path: /health
        pathType: Exact
        backend:
          service:
            name: backend
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
YAML

echo "✅ SSL Setup complete!"
echo "��� Next steps:"
echo "1. Check certificate: kubectl get certificate -n loop-it"
echo "2. Wait for DNS propagation: nslookup loopit.tech"
echo "3. Test HTTPS: curl -I https://loopit.tech"