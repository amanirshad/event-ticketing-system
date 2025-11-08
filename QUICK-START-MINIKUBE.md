# Quick Start: Deploy Payment Service on Minikube

## Prerequisites Check

```bash
# Check Minikube
minikube version

# Check kubectl
kubectl version --client

# Check Docker
docker --version
```

## One-Command Deployment

### Windows (PowerShell)
```powershell
.\deploy-minikube.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x deploy-minikube.sh
./deploy-minikube.sh
```

## Verify Deployment

```bash
# Check pods
kubectl get pods -n ticketing-system

# Check services
kubectl get svc -n ticketing-system

# Get service URL
minikube service payment-service-nodeport -n ticketing-system --url
```

## Test the Service

### Option 1: Run End-to-End Test
```powershell
.\test-minikube-e2e.ps1
```

### Option 2: Manual API Test

1. **Get Service URL:**
```bash
minikube service payment-service-nodeport -n ticketing-system --url
```

2. **Get Auth Token:**
```bash
curl http://<service-url>/auth/dev-token?userId=test_user
```

3. **Create Payment:**
```bash
curl -X POST http://<service-url>/api/payments/charge \
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

## Screenshots for Submission

See `MINIKUBE-SCREENSHOTS.md` for detailed screenshot requirements.

**Quick checklist:**
1. `kubectl get pods -n ticketing-system`
2. `kubectl get svc -n ticketing-system`
3. `kubectl logs -f deployment/payment-service -n ticketing-system`
4. Successful API call (curl/Postman)
5. End-to-end test output

## Troubleshooting

**Pods not starting?**
```bash
kubectl describe pod <pod-name> -n ticketing-system
kubectl logs <pod-name> -n ticketing-system
```

**Service not accessible?**
```bash
# Check if Minikube is running
minikube status

# Get service URL
minikube service payment-service-nodeport -n ticketing-system --url
```

**Need to rebuild?**
```bash
# Set Docker environment
minikube docker-env | Invoke-Expression  # PowerShell
eval $(minikube docker-env)  # Bash

# Rebuild image
docker build -t payment-service:latest .

# Restart deployment
kubectl rollout restart deployment/payment-service -n ticketing-system
```

## Cleanup

```bash
kubectl delete namespace ticketing-system
```

## Full Documentation

See `MINIKUBE-DEPLOYMENT.md` for complete deployment guide.

