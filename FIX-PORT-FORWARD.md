# 🔧 Fix Port Forwarding Issue

## Problem: Port 3004 is already in use

## ✅ Solution 1: Use Different Port (Easiest)

### In NEW PowerShell Window:
```powershell
kubectl port-forward svc/payment-service-nodeport 8080:3004 -n ticketing-system
```

### Then use port 8080 instead:
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8080/health"

# Get token
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/dev-token?userId=test_user").token

# Create payment
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "X-Correlation-Id" = "demo-123"
    "X-Idempotency-Key" = "idemp-123"
}
$payment = @{
    orderId = "order_123"
    userId = "user_123"
    amount = 5000
    currency = "USD"
    paymentMethod = "stripe"
    description = "Demo payment"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/payments/charge" -Method Post -Headers $headers -Body $payment | ConvertTo-Json -Depth 5
```

---

## ✅ Solution 2: Port Forward to Pod Directly

### Get Pod Name:
```powershell
kubectl get pods -n ticketing-system -l app=payment-service
```

### Use First Pod:
```powershell
kubectl port-forward payment-service-7769c8d954-l7987 8080:3004 -n ticketing-system
```

Then use `http://localhost:8080` for all API calls.

---

## ✅ Solution 3: Use Minikube Service (No Port Forward Needed!)

### Just run:
```powershell
minikube service payment-service-nodeport -n ticketing-system
```

This will open your browser automatically with the service URL!

---

## ✅ Solution 4: Use Minikube IP Directly

### Get Minikube IP:
```powershell
minikube ip
```

### Use NodePort directly:
```powershell
# Replace <MINIKUBE_IP> with actual IP (e.g., 192.168.49.2)
$minikubeIP = minikube ip
$serviceUrl = "http://${minikubeIP}:30004"

# Health check
Invoke-RestMethod -Uri "$serviceUrl/health"

# Get token
$token = (Invoke-RestMethod -Uri "$serviceUrl/auth/dev-token?userId=test_user").token

# Create payment (use $serviceUrl instead of localhost:3004)
```

---

## 🎯 RECOMMENDED: Use Solution 1 (Different Port)

**Step 1:** Open NEW PowerShell window
```powershell
kubectl port-forward svc/payment-service-nodeport 8080:3004 -n ticketing-system
```

**Step 2:** In your ORIGINAL window, test with port 8080:
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
```

If this works, use `8080` instead of `3004` in all your API calls!

