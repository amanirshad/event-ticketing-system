#!/bin/bash

# Minikube Deployment Script for Payment Service
# This script deploys the payment service and dependencies to Minikube

set -e

echo "🚀 Starting Minikube Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Minikube is running
echo -e "${YELLOW}Checking Minikube status...${NC}"
if ! minikube status > /dev/null 2>&1; then
    echo -e "${RED}Minikube is not running. Starting Minikube...${NC}"
    minikube start
else
    echo -e "${GREEN}Minikube is running${NC}"
fi

# Set Minikube Docker environment
echo -e "${YELLOW}Setting up Minikube Docker environment...${NC}"
eval $(minikube docker-env)

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t payment-service:latest .

# Create namespace
echo -e "${YELLOW}Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

# Create PVCs
echo -e "${YELLOW}Creating PersistentVolumeClaims...${NC}"
kubectl apply -f k8s/pvc.yaml

# Create ConfigMap
echo -e "${YELLOW}Creating ConfigMap...${NC}"
kubectl apply -f k8s/configmap.yaml

# Create Secret
echo -e "${YELLOW}Creating Secret...${NC}"
kubectl apply -f k8s/secret.yaml

# Deploy MongoDB
echo -e "${YELLOW}Deploying MongoDB...${NC}"
kubectl apply -f k8s/mongodb-deployment.yaml

# Deploy Redis
echo -e "${YELLOW}Deploying Redis...${NC}"
kubectl apply -f k8s/redis-deployment.yaml

# Wait for MongoDB and Redis to be ready
echo -e "${YELLOW}Waiting for MongoDB and Redis to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=mongodb -n ticketing-system --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=redis -n ticketing-system --timeout=120s || true

# Deploy Payment Service
echo -e "${YELLOW}Deploying Payment Service...${NC}"
kubectl apply -f k8s/payment-service-deployment.yaml

# Wait for Payment Service to be ready
echo -e "${YELLOW}Waiting for Payment Service to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=payment-service -n ticketing-system --timeout=120s || true

# Get service information
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${YELLOW}=== Deployment Status ===${NC}"
kubectl get pods -n ticketing-system
echo ""
echo -e "${YELLOW}=== Services ===${NC}"
kubectl get svc -n ticketing-system
echo ""
echo -e "${YELLOW}=== NodePort Service ===${NC}"
NODEPORT=$(kubectl get svc payment-service-nodeport -n ticketing-system -o jsonpath='{.spec.ports[0].nodePort}')
MINIKUBE_IP=$(minikube ip)
echo -e "${GREEN}Payment Service is accessible at: http://${MINIKUBE_IP}:${NODEPORT}${NC}"
echo -e "${GREEN}Or use: minikube service payment-service-nodeport -n ticketing-system${NC}"
echo ""
echo -e "${YELLOW}=== Useful Commands ===${NC}"
echo "View pods: kubectl get pods -n ticketing-system"
echo "View logs: kubectl logs -f deployment/payment-service -n ticketing-system"
echo "Get service URL: minikube service payment-service-nodeport -n ticketing-system --url"
echo "Access service: minikube service payment-service-nodeport -n ticketing-system"

