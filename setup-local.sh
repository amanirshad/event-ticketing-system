#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$ROOT_DIR/docs/local-run"
mkdir -p "$OUTPUT_DIR"

echo "🚀 Starting local environment setup..."

echo "🔨 Building Docker images via docker-compose..."
docker-compose -f "$ROOT_DIR/docker-compose.yml" build

echo "🐳 Starting docker-compose stack..."
docker-compose -f "$ROOT_DIR/docker-compose.yml" up -d

echo "⏳ Waiting for core services to respond..."
sleep 15

echo "📸 Capturing docker ps output..."
docker ps > "$OUTPUT_DIR/docker-ps.txt"

echo "🩺 Hitting service health endpoints..."
curl -s "http://localhost:3004/health" | tee "$OUTPUT_DIR/payment-health.json"
curl -s "http://localhost:3002/health" | tee "$OUTPUT_DIR/catalog-health.json"
curl -s "http://localhost:8080/actuator/health" | tee "$OUTPUT_DIR/user-health.json" || true
curl -s "http://localhost:3007/v1/orders" | tee "$OUTPUT_DIR/order-sample.json" || true

echo "🧹 Cleaning up local docker stack..."
docker-compose -f "$ROOT_DIR/docker-compose.yml" down

cd "$ROOT_DIR"

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

# Target Kubernetes manifests
K8S_DIR="$ROOT_DIR/k8s"

kubectl apply -f "$K8S_DIR/namespace.yaml"

# Core data stores and shared config
kubectl apply -f "$K8S_DIR/pvc.yaml"
kubectl apply -f "$K8S_DIR/configmap.yaml"
kubectl apply -f "$K8S_DIR/secret.yaml"
kubectl apply -f "$K8S_DIR/mongodb-deployment.yaml"
kubectl apply -f "$K8S_DIR/redis-deployment.yaml"

# Deploy monitoring stack (Prometheus + Grafana)
kubectl apply -f "$K8S_DIR/prometheus-config.yaml"
kubectl apply -f "$K8S_DIR/prometheus-deployment.yaml"
kubectl apply -f "$K8S_DIR/grafana-deployment.yaml"

# Deploy application services
echo "🚀 Deploying services to Kubernetes..."
kubectl apply -f "$K8S_DIR/user-service-deployment.yaml"
kubectl apply -f "$K8S_DIR/payment-service-deployment.yaml"
kubectl apply -f "$K8S_DIR/order-service-deployment.yaml"
kubectl apply -f "$K8S_DIR/catalog-service-deployment.yaml"
kubectl apply -f "$K8S_DIR/event-seating-service-deployment.yaml"
kubectl apply -f "$K8S_DIR/notification-service-deployment.yaml"

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
