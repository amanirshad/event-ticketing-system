# Minikube Deployment Guide

This guide walks you through deploying the Payment Service on Minikube (Local Kubernetes) for demonstration purposes.

## Prerequisites

1. **Minikube** installed and configured
2. **kubectl** installed
3. **Docker** installed
4. **PowerShell** (for Windows) or **Bash** (for Linux/Mac)

## Quick Start

### Option 1: Automated Deployment (Recommended)

**Windows (PowerShell):**
```powershell
.\deploy-minikube.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x deploy-minikube.sh
./deploy-minikube.sh
```

### Option 2: Manual Deployment

Follow the steps below for manual deployment.

## Step-by-Step Manual Deployment

### 1. Start Minikube

```bash
minikube start
```

Verify Minikube is running:
```bash
minikube status
```

### 2. Configure Docker to Use Minikube's Docker Environment

**Windows (PowerShell):**
```powershell
minikube docker-env | Invoke-Expression
```

**Linux/Mac:**
```bash
eval $(minikube docker-env)
```

### 3. Build Docker Image

```bash
docker build -t payment-service:latest .
```

### 4. Deploy Kubernetes Resources

Apply manifests in order:

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create PersistentVolumeClaims
kubectl apply -f k8s/pvc.yaml

# Create ConfigMap
kubectl apply -f k8s/configmap.yaml

# Create Secret
kubectl apply -f k8s/secret.yaml

# Deploy MongoDB
kubectl apply -f k8s/mongodb-deployment.yaml

# Deploy Redis
kubectl apply -f k8s/redis-deployment.yaml

# Wait for dependencies to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n ticketing-system --timeout=120s
kubectl wait --for=condition=ready pod -l app=redis -n ticketing-system --timeout=120s

# Deploy Payment Service
kubectl apply -f k8s/payment-service-deployment.yaml
```

### 5. Verify Deployment

Check pod status:
```bash
kubectl get pods -n ticketing-system
```

Expected output:
```
NAME                               READY   STATUS    RESTARTS   AGE
mongodb-xxxxxxxxx-xxxxx            1/1     Running   0          2m
payment-service-xxxxxxxxx-xxxxx    2/2     Running   0          1m
redis-xxxxxxxxx-xxxxx              1/1     Running   0          2m
```

Check services:
```bash
kubectl get svc -n ticketing-system
```

Expected output:
```
NAME                        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
mongodb-service             ClusterIP   10.96.x.x       <none>        27017/TCP        2m
payment-service             ClusterIP   10.96.x.x       <none>        3004/TCP         1m
payment-service-nodeport    NodePort    10.96.x.x       <none>        3004:30004/TCP   1m
redis-service               ClusterIP   10.96.x.x       <none>        6379/TCP         2m
```

## Accessing the Service

### Option 1: Using Minikube Service Command

```bash
minikube service payment-service-nodeport -n ticketing-system
```

This will open the service in your default browser.

### Option 2: Get NodePort URL

```bash
minikube service payment-service-nodeport -n ticketing-system --url
```

Use the returned URL to access the service.

### Option 3: Direct Access via Minikube IP

```bash
# Get Minikube IP
minikube ip

# Get NodePort
kubectl get svc payment-service-nodeport -n ticketing-system -o jsonpath='{.spec.ports[0].nodePort}'

# Access: http://<minikube-ip>:<nodeport>
```

## Testing the Deployment

### Run End-to-End Test

**Windows (PowerShell):**
```powershell
.\test-minikube-e2e.ps1
```

**Linux/Mac:**
```bash
# You can use curl or create a bash version
```

### Manual API Testing

1. **Get Authentication Token:**
```bash
curl http://<minikube-ip>:30004/auth/dev-token?userId=test_user
```

2. **Create Payment:**
```bash
curl -X POST http://<minikube-ip>:30004/api/payments/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-Correlation-Id: test-123" \
  -H "X-Idempotency-Key: idemp-123" \
  -d '{
    "orderId": "order_123",
    "userId": "user_123",
    "amount": 5000,
    "currency": "USD",
    "paymentMethod": "stripe",
    "description": "Test payment"
  }'
```

3. **Health Check:**
```bash
curl http://<minikube-ip>:30004/health
```

## Screenshots for Documentation

Take screenshots of the following for your submission:

### 1. Pod Status
```bash
kubectl get pods -n ticketing-system
```
**Screenshot:** Shows all pods in Running state

### 2. Services
```bash
kubectl get svc -n ticketing-system
```
**Screenshot:** Shows all services including NodePort

### 3. Pod Logs
```bash
kubectl logs -f deployment/payment-service -n ticketing-system
```
**Screenshot:** Shows application logs

### 4. Working API Call
Use Postman or curl to make a successful API call:
```bash
curl -X POST http://<minikube-ip>:30004/api/payments/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{...}'
```
**Screenshot:** Shows successful API response

### 5. End-to-End Flow
Run the test script and capture the output showing:
- Payment creation
- Payment retrieval
- Order payments
- Statistics

## Kubernetes Manifests Overview

### Deployment (`payment-service-deployment.yaml`)
- **Replicas:** 2
- **Probes:**
  - Liveness: `/health/live` (30s initial delay, 10s period)
  - Readiness: `/health/ready` (5s initial delay, 5s period)
- **Resources:**
  - Requests: 256Mi memory, 250m CPU
  - Limits: 512Mi memory, 500m CPU
- **Ports:** 3004 (HTTP), 9094 (Metrics)

### Service (`payment-service-deployment.yaml`)
- **ClusterIP:** Internal service communication
- **NodePort:** External access on port 30004

### ConfigMap (`configmap.yaml`)
- Application configuration
- Database URLs
- Service endpoints
- Feature flags

### Secret (`secret.yaml`)
- JWT secret
- Stripe keys
- PayPal credentials
- Base64 encoded

### PersistentVolumeClaim (`pvc.yaml`)
- **MongoDB:** 10Gi storage
- **Redis:** 5Gi storage
- **Storage Class:** standard (Minikube default)

## Troubleshooting

### Pods Not Starting

Check pod status:
```bash
kubectl describe pod <pod-name> -n ticketing-system
```

Check logs:
```bash
kubectl logs <pod-name> -n ticketing-system
```

### Service Not Accessible

Verify NodePort service:
```bash
kubectl get svc payment-service-nodeport -n ticketing-system
```

Check if Minikube tunnel is needed:
```bash
minikube tunnel
```

### Database Connection Issues

Check MongoDB pod:
```bash
kubectl logs -l app=mongodb -n ticketing-system
```

Verify MongoDB service:
```bash
kubectl get svc mongodb-service -n ticketing-system
```

### Storage Issues

Check PVC status:
```bash
kubectl get pvc -n ticketing-system
```

If PVC is pending, check storage class:
```bash
kubectl get storageclass
```

## Cleanup

To remove all resources:
```bash
kubectl delete namespace ticketing-system
```

To stop Minikube:
```bash
minikube stop
```

## Additional Resources

- **Kubernetes Documentation:** https://kubernetes.io/docs/
- **Minikube Documentation:** https://minikube.sigs.k8s.io/docs/
- **kubectl Cheat Sheet:** https://kubernetes.io/docs/reference/kubectl/cheatsheet/

## End-to-End Flow Demonstration

The complete flow should demonstrate:

1. **Create Customer** (if user service is available)
2. **Create Payment** → Payment record created in MongoDB
3. **Process Payment** → Payment status updated
4. **View Payment** → Retrieve payment from database
5. **View Logs** → Check application logs via kubectl

All data persists in MongoDB via PersistentVolumeClaim, and you can verify this by:
- Checking MongoDB pod logs
- Accessing MongoDB directly (if Mongo Express is deployed)
- Querying via API endpoints

