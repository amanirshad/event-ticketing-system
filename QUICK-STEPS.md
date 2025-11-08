# 🚀 QUICK STEPS - Complete Guide

## ✅ STEP 1: Take Required Screenshots (5 minutes)

Run these commands in PowerShell and take screenshots:

### Screenshot 1: All Pods Running
```powershell
kubectl get pods -n ticketing-system
```
**📸 Screenshot this** - Shows all microservices running

---

### Screenshot 2: All Services
```powershell
kubectl get svc -n ticketing-system
```
**📸 Screenshot this** - Shows NodePort service (port 30004)

---

### Screenshot 3: Deployment Details
```powershell
kubectl describe deployment payment-service -n ticketing-system
```
**📸 Screenshot this** - Shows replicas, probes, resource limits

---

### Screenshot 4: Persistent Volumes
```powershell
kubectl get pvc -n ticketing-system
```
**📸 Screenshot this** - Shows persistent storage

---

### Screenshot 5: Application Logs
```powershell
kubectl logs -f deployment/payment-service -n ticketing-system
```
**📸 Screenshot this** (then press Ctrl+C to stop)

---

## ✅ STEP 2: Set Up Port Forwarding (1 minute)

### Open a NEW PowerShell Window

Run this command (keep window open):
```powershell
kubectl port-forward svc/payment-service-nodeport 3004:3004 -n ticketing-system
```

You should see:
```
Forwarding from 127.0.0.1:3004 -> 3004
Forwarding from [::1]:3004 -> 3004
```

**⚠️ Keep this window open!**

---

## ✅ STEP 3: Test the API (2 minutes)

### In Your ORIGINAL PowerShell Window

Run these commands one by one:

### 3.1: Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3004/health"
```
**📸 Screenshot this** - Shows service is healthy

---

### 3.2: Get Auth Token
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:3004/auth/dev-token?userId=test_user").token
Write-Host "Token: $token"
```

---

### 3.3: Create Payment (End-to-End Flow)
```powershell
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

Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $payment | ConvertTo-Json -Depth 5
```
**📸 Screenshot this** - Shows successful payment creation

---

### 3.4: Retrieve Payment
```powershell
$paymentId = "pay_XXXXX"  # Use the paymentId from previous response
Invoke-RestMethod -Uri "http://localhost:3004/api/payments/$paymentId" -Method Get -Headers $headers | ConvertTo-Json -Depth 5
```

---

## 📋 Complete Checklist

### Screenshots Needed:
- [ ] `kubectl get pods -n ticketing-system` - All pods running
- [ ] `kubectl get svc -n ticketing-system` - Services (NodePort visible)
- [ ] `kubectl describe deployment payment-service -n ticketing-system` - Deployment config
- [ ] `kubectl get pvc -n ticketing-system` - Persistent volumes
- [ ] `kubectl logs -f deployment/payment-service -n ticketing-system` - Application logs
- [ ] Health check response - Service is healthy
- [ ] Payment creation response - Successful API call

---

## 🎯 What This Demonstrates

1. ✅ **Kubernetes Deployment** - All services running in pods
2. ✅ **Service Discovery** - Services communicating via ClusterIP
3. ✅ **External Access** - NodePort service for external access
4. ✅ **Persistent Storage** - PVCs for database persistence
5. ✅ **Health Checks** - Liveness and readiness probes configured
6. ✅ **Resource Management** - CPU and memory limits set
7. ✅ **Scaling** - Multiple replicas (2) of payment service
8. ✅ **End-to-End Flow** - Complete payment processing workflow

---

## ⚡ Quick Copy-Paste Commands

```powershell
# Screenshots
kubectl get pods -n ticketing-system
kubectl get svc -n ticketing-system
kubectl describe deployment payment-service -n ticketing-system
kubectl get pvc -n ticketing-system
kubectl logs -f deployment/payment-service -n ticketing-system

# Port forward (NEW window)
kubectl port-forward svc/payment-service-nodeport 3004:3004 -n ticketing-system

# API Test (ORIGINAL window)
Invoke-RestMethod -Uri "http://localhost:3004/health"
$token = (Invoke-RestMethod -Uri "http://localhost:3004/auth/dev-token?userId=test_user").token
$headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"; "X-Correlation-Id"="demo-123"; "X-Idempotency-Key"="idemp-123"}
$payment = @{orderId="order_123"; userId="user_123"; amount=5000; currency="USD"; paymentMethod="stripe"; description="Demo"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $payment | ConvertTo-Json -Depth 5
```

---

## 🆘 Troubleshooting

**If port-forward fails:**
- Make sure Minikube is running: `minikube status`
- Check pods are running: `kubectl get pods -n ticketing-system`

**If API calls fail:**
- Make sure port-forward is running in the other window
- Check service URL: Should be `http://localhost:3004`

**If pods not running:**
- Check status: `kubectl get pods -n ticketing-system`
- View logs: `kubectl logs <pod-name> -n ticketing-system`

---

## ✅ You're Done!

Once you have all 7 screenshots, you're ready to submit! 🎉

