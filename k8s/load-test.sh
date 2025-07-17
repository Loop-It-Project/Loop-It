#!/bin/bash

echo "🔥 Load Testing Loop-It HPA Auto-Scaling..."

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Prüfe ob Loop-It läuft
if ! curl -s http://localhost/api/health > /dev/null; then
    echo "❌ Loop-It not accessible. Please deploy first: ./k8s/deploy.sh"
    exit 1
fi

echo -e "${BLUE}📊 Current Status Before Load Test:${NC}"
kubectl get hpa -n loopit-dev
kubectl get pods -n loopit-dev | grep backend
echo ""

echo -e "${YELLOW}🔥 Starting Load Test...${NC}"
echo "Phase 1: Baseline (1 min) → Phase 2: High Load (3 min) → Phase 3: Cool Down (2 min)"
echo ""

# Phase 1: Baseline
echo -e "${BLUE}📈 Phase 1: Baseline Load (1 minute)${NC}"
for i in {1..60}; do
    curl -s http://localhost/api/health > /dev/null &
    sleep 1
    if [ $((i % 15)) -eq 0 ]; then
        echo "Baseline: ${i}/60 seconds"
    fi
done
wait

# Status Check nach Baseline
echo -e "${BLUE}📊 Status after Baseline:${NC}"
kubectl get hpa backend-hpa -n loopit-dev --no-headers

# Phase 2: High Load
echo -e "${YELLOW}🚀 Phase 2: High Load Test (3 minutes)${NC}"
echo "Generating ~50 requests/second..."

for round in {1..36}; do
    # 50 parallele Requests alle 5 Sekunden = ~10 RPS sustained
    for i in {1..25}; do
        curl -s http://localhost/api/health > /dev/null &
        curl -s http://localhost/ > /dev/null &
    done
    
    if [ $((round % 6)) -eq 0 ]; then
        echo "High Load: $((round * 5))/180 seconds"
        kubectl get pods -n loopit-dev | grep backend | wc -l | xargs echo "Backend Pods:"
    fi
    
    sleep 5
done
wait

# Status Check nach High Load
echo -e "${BLUE}📊 Status after High Load:${NC}"
kubectl get hpa backend-hpa -n loopit-dev --no-headers
kubectl get pods -n loopit-dev | grep backend

# Phase 3: Cool Down
echo -e "${BLUE}📉 Phase 3: Cool Down (2 minutes)${NC}"
for i in {1..24}; do
    curl -s http://localhost/api/health > /dev/null
    sleep 5
    if [ $((i % 6)) -eq 0 ]; then
        echo "Cool Down: $((i * 5))/120 seconds"
    fi
done

echo -e "${GREEN}✅ Load Test Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Final Status:${NC}"
kubectl get hpa -n loopit-dev
echo ""
kubectl get pods -n loopit-dev | grep backend
echo ""
echo -e "${YELLOW}💡 Observe the scaling in action:${NC}"
echo "kubectl get hpa -n loopit-dev -w"