#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting local environment setup..."

# Build Docker images
echo "🔨 Building Docker images..."

# Build user service
cd user-service
mvn clean package -DskipTests
cd ..
docker build -t user-service:latest ./user-service

# Build payment service
cd payment-service
docker build -t payment-service:latest .
cd ..

# Start Minikube if not running
if ! minikube status &> /dev/null; then
    echo "🔧 Starting Minikube..."
    minikube start --cpus=4 --memory=8192 --disk-size=40g
    
    # Set up Docker environment to use Minikube's Docker daemon
    eval $(minikube -p minikube docker-env)
    
    # Enable ingress addon
    minikube addons enable ingress
    minikube addons enable metrics-server
fi

# Create namespace if it doesn't exist
kubectl apply -f k8s/namespace.yaml

# Set up MongoDB
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Set up Redis
kubectl apply -f k8s/redis-deployment.yaml

# Deploy monitoring
kubectl apply -f k8s/monitoring/

# Deploy services
echo "🚀 Deploying services to Kubernetes..."
kubectl apply -f k8s/user-service-deployment.yaml
kubectl apply -f k8s/payment-service-deployment.yaml

# Wait for all pods to be ready
echo "⏳ Waiting for pods to be ready..."
kubectl wait --namespace ticketing-system \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/name \
  --timeout=120s

echo "✅ Setup complete!"
echo ""
echo "🔗 Access the application at: $(minikube service --url user-service -n ticketing-system)"
echo "📊 Access Grafana at: http://localhost:3000 (admin/admin)"
echo "📈 Access Prometheus at: http://localhost:9090"
echo "🔍 Access Jaeger at: http://localhost:16686"

# Create port-forwarding for monitoring
kubectl port-forward -n ticketing-system svc/grafana 3000:3000 &
kubectl port-forward -n ticketing-system svc/prometheus 9090:9090 &
kubectl port-forward -n ticketing-system svc/jaeger-query 16686:16686 &

echo ""
echo "To stop the port forwarding, run: pkill -f 'kubectl port-forward'"
