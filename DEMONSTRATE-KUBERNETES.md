# How to Demonstrate Payment Service Execution on Kubernetes

## Current Status

✅ **All Pods Running:**
- MongoDB: Running
- Redis: Running  
- Payment Service: 2 replicas running

✅ **Services Created:**
- ClusterIP services for internal communication
- NodePort service for external access (port 30004)

## Step-by-Step Demonstration Guide

### 1. Show Kubernetes Resources (Screenshots Needed)

#### A. Show All Pods Running
```powershell
kubectl get pods -n ticketing-system
```

**Expected Output:**
```
NAME                               READY   STATUS    RESTARTS   AGE
mongodb-54d8fd5599-czjs6           1/1     Running   0          Xm
payment-service-7769c8d954-l7987   1/1     Running   0          Xm
payment-service-7769c8d954-r9g8v   1/1     Running   0          Xm
redis-bdbf5dd99-gkk87              1/1     Running   0          Xm
```

**📸 Take Screenshot:** This shows all microservices running in Kubernetes

---

#### B. Show Services
```powershell
kubectl get svc -n ticketing-system
```

**Expected Output:**
```
NAME                       TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)             AGE
mongodb-service            ClusterIP   10.108.207.84    <none>        27017/TCP           Xm
payment-service            ClusterIP   10.111.14.32     <none>        3004/TCP,9094/TCP   Xm
payment-service-nodeport   NodePort    10.107.180.163   <none>        3004:30004/TCP      Xm
redis-service              ClusterIP   10.107.30.71     <none>        6379/TCP            Xm
```

**📸 Take Screenshot:** Shows ClusterIP (internal) and NodePort (external) services

---

#### C. Show Deployment Details
```powershell
kubectl describe deployment payment-service -n ticketing-system
```

**📸 Take Screenshot:** Shows replicas, resource limits, probes configuration

---

### 2. Show Application Logs

#### View Payment Service Logs
```powershell
kubectl logs -f deployment/payment-service -n ticketing-system
```

**Or view logs from a specific pod:**
```powershell
kubectl logs payment-service-7769c8d954-l7987 -n ticketing-system
```

**📸 Take Screenshot:** Shows application startup, database connections, request logs

---

### 3. Test the API (End-to-End Flow)

#### Step 1: Get Service URL
```powershell
minikube service payment-service-nodeport -n ticketing-system --url
```

**Output:** `http://127.0.0.1:XXXXX` (port number varies)

**Or get Minikube IP:**
```powershell
minikube ip
```

**Service URL:** `http://<minikube-ip>:30004`

---

#### Step 2: Get Authentication Token
```powershell
$serviceUrl = "http://127.0.0.1:55426"  # Use your actual URL
curl "$serviceUrl/auth/dev-token?userId=test_user"
```

**Or in PowerShell:**
```powershell
$response = Invoke-RestMethod -Uri "$serviceUrl/auth/dev-token?userId=test_user"
$token = $response.token
Write-Host "Token: $token"
```

---

#### Step 3: Create a Payment (End-to-End Flow)

**Using PowerShell:**
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "X-Correlation-Id" = "demo-123"
    "X-Idempotency-Key" = "idemp-$(Get-Random)"
}

$paymentData = @{
    orderId = "order_$(Get-Random)"
    userId = "user_$(Get-Random)"
    amount = 5000
    currency = "USD"
    paymentMethod = "stripe"
    description = "Demo payment"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$serviceUrl/api/payments/charge" -Method Post -Headers $headers -Body $paymentData
$response | ConvertTo-Json -Depth 5
```

**Using curl:**
```bash
curl -X POST http://127.0.0.1:55426/api/payments/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -H "X-Correlation-Id: demo-123" \
  -H "X-Idempotency-Key: idemp-123" \
  -d '{
    "orderId": "order_123",
    "userId": "user_123",
    "amount": 5000,
    "currency": "USD",
    "paymentMethod": "stripe",
    "description": "Demo payment"
  }'
```

**📸 Take Screenshot:** Shows successful payment creation with JSON response

---

#### Step 4: Retrieve Payment
```powershell
$paymentId = $response.data.paymentId
Invoke-RestMethod -Uri "$serviceUrl/api/payments/$paymentId" -Method Get -Headers $headers | ConvertTo-Json -Depth 5
```

**📸 Take Screenshot:** Shows payment retrieval

---

#### Step 5: Health Check
```powershell
Invoke-RestMethod -Uri "$serviceUrl/health" -Method Get | ConvertTo-Json
```

**📸 Take Screenshot:** Shows service health status

---

### 4. Show Kubernetes Features

#### A. Show Resource Usage
```powershell
kubectl top pods -n ticketing-system
```

**📸 Take Screenshot:** Shows CPU and memory usage (if metrics-server installed)

---

#### B. Show Pod Details
```powershell
kubectl describe pod payment-service-7769c8d954-l7987 -n ticketing-system
```

**📸 Take Screenshot:** Shows pod configuration, events, resource limits

---

#### C. Show ConfigMap
```powershell
kubectl get configmap payment-service-config -n ticketing-system -o yaml
```

**📸 Take Screenshot:** Shows configuration (sensitive data redacted)

---

#### D. Show PersistentVolumeClaims
```powershell
kubectl get pvc -n ticketing-system
```

**📸 Take Screenshot:** Shows persistent storage for MongoDB and Redis

---

### 5. Demonstrate Scaling

#### Scale Payment Service
```powershell
kubectl scale deployment payment-service --replicas=3 -n ticketing-system
kubectl get pods -n ticketing-system
```

**📸 Take Screenshot:** Shows scaling from 2 to 3 replicas

---

### 6. Complete End-to-End Test Script

Run the automated test:
```powershell
.\test-minikube-e2e.ps1
```

**📸 Take Screenshot:** Shows complete test output

---

## Quick Reference Commands

```powershell
# Get service URL
minikube service payment-service-nodeport -n ticketing-system --url

# View all resources
kubectl get all -n ticketing-system

# View logs
kubectl logs -f deployment/payment-service -n ticketing-system

# Get pod details
kubectl describe pod <pod-name> -n ticketing-system

# Check service endpoints
kubectl get endpoints -n ticketing-system

# View events
kubectl get events -n ticketing-system --sort-by='.lastTimestamp'
```

## Screenshots Checklist for Submission

- [ ] `kubectl get pods -n ticketing-system` - All pods running
- [ ] `kubectl get svc -n ticketing-system` - Services including NodePort
- [ ] `kubectl logs -f deployment/payment-service -n ticketing-system` - Application logs
- [ ] Successful API call (curl/Postman) - Payment creation
- [ ] `kubectl describe deployment payment-service -n ticketing-system` - Deployment details
- [ ] `kubectl get pvc -n ticketing-system` - Persistent volumes
- [ ] End-to-end test output - Complete flow demonstration

## Troubleshooting

### If Service Not Accessible

1. **Check if pods are running:**
   ```powershell
   kubectl get pods -n ticketing-system
   ```

2. **Check service:**
   ```powershell
   kubectl get svc payment-service-nodeport -n ticketing-system
   ```

3. **Check logs:**
   ```powershell
   kubectl logs -l app=payment-service -n ticketing-system
   ```

### If MongoDB Connection Fails

The ConfigMap should have: `MONGODB_URI: "mongodb://mongodb-service:27017/payment-service"`

Verify:
```powershell
kubectl get configmap payment-service-config -n ticketing-system -o yaml
```

