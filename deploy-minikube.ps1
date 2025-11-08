# Minikube Deployment Script for Payment Service (PowerShell)
# This script deploys the payment service and dependencies to Minikube

Write-Host "🚀 Starting Minikube Deployment..." -ForegroundColor Yellow

# Check if Minikube is running
Write-Host "Checking Minikube status..." -ForegroundColor Yellow
$minikubeStatus = minikube status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Minikube is not running. Starting Minikube..." -ForegroundColor Red
    minikube start
} else {
    Write-Host "Minikube is running" -ForegroundColor Green
}

# Set Minikube Docker environment
Write-Host "Setting up Minikube Docker environment..." -ForegroundColor Yellow
& minikube docker-env | Invoke-Expression

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t payment-service:latest .

# Create namespace
Write-Host "Creating namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml

# Create PVCs
Write-Host "Creating PersistentVolumeClaims..." -ForegroundColor Yellow
kubectl apply -f k8s/pvc.yaml

# Create ConfigMap
Write-Host "Creating ConfigMap..." -ForegroundColor Yellow
kubectl apply -f k8s/configmap.yaml

# Create Secret
Write-Host "Creating Secret..." -ForegroundColor Yellow
kubectl apply -f k8s/secret.yaml

# Deploy MongoDB
Write-Host "Deploying MongoDB..." -ForegroundColor Yellow
kubectl apply -f k8s/mongodb-deployment.yaml

# Deploy Redis
Write-Host "Deploying Redis..." -ForegroundColor Yellow
kubectl apply -f k8s/redis-deployment.yaml

# Wait for MongoDB and Redis to be ready
Write-Host "Waiting for MongoDB and Redis to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
kubectl wait --for=condition=ready pod -l app=mongodb -n ticketing-system --timeout=120s 2>&1 | Out-Null
kubectl wait --for=condition=ready pod -l app=redis -n ticketing-system --timeout=120s 2>&1 | Out-Null

# Deploy Payment Service
Write-Host "Deploying Payment Service..." -ForegroundColor Yellow
kubectl apply -f k8s/payment-service-deployment.yaml

# Wait for Payment Service to be ready
Write-Host "Waiting for Payment Service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
kubectl wait --for=condition=ready pod -l app=payment-service -n ticketing-system --timeout=120s 2>&1 | Out-Null

# Get service information
Write-Host "`n✅ Deployment completed!`n" -ForegroundColor Green
Write-Host "=== Deployment Status ===" -ForegroundColor Yellow
kubectl get pods -n ticketing-system
Write-Host "`n=== Services ===" -ForegroundColor Yellow
kubectl get svc -n ticketing-system
Write-Host "`n=== NodePort Service ===" -ForegroundColor Yellow
$nodePort = kubectl get svc payment-service-nodeport -n ticketing-system -o jsonpath='{.spec.ports[0].nodePort}'
$minikubeIP = minikube ip
Write-Host "Payment Service is accessible at: http://${minikubeIP}:${nodePort}" -ForegroundColor Green
Write-Host "Or use: minikube service payment-service-nodeport -n ticketing-system" -ForegroundColor Green
Write-Host "`n=== Useful Commands ===" -ForegroundColor Yellow
Write-Host "View pods: kubectl get pods -n ticketing-system"
Write-Host "View logs: kubectl logs -f deployment/payment-service -n ticketing-system"
Write-Host "Get service URL: minikube service payment-service-nodeport -n ticketing-system --url"
Write-Host "Access service: minikube service payment-service-nodeport -n ticketing-system"

