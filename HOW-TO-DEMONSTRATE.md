# How to Demonstrate Payment Service on Kubernetes - Step by Step

## ✅ Current Status
- ✅ Minikube installed and running
- ✅ All pods deployed and running (MongoDB, Redis, Payment Service x2)
- ✅ Services created (ClusterIP and NodePort)
- ✅ Ready for demonstration!

---

## 📸 Step 1: Take Required Screenshots

### Screenshot 1: Show All Pods Running
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

**📸 Take Screenshot** - This proves all microservices are running in Kubernetes

---

### Screenshot 2: Show Services
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

**📸 Take Screenshot** - Shows ClusterIP (internal) and NodePort (external access)

---

### Screenshot 3: Show Application Logs
```powershell
kubectl logs -f deployment/payment-service -n ticketing-system
```

**📸 Take Screenshot** - Shows application logs, then press `Ctrl+C` to stop

---

### Screenshot 4: Show Deployment Details
```powershell
kubectl describe deployment payment-service -n ticketing-system
```

**📸 Take Screenshot** - Shows replicas, resource limits, probes, etc.

---

### Screenshot 5: Show PersistentVolumeClaims
```powershell
kubectl get pvc -n ticketing-system
```

**📸 Take Screenshot** - Shows persistent storage for databases

---

## 🧪 Step 2: Test the API (End-to-End Flow)

### Option A: Using Port Forwarding (Recommended for Windows)

**Step 1:** Open a NEW PowerShell window and run:
```powershell
kubectl port-forward svc/payment-service-nodeport 3004:3004 -n ticketing-system
```
**Keep this window open!**

**Step 2:** In your original PowerShell window, run:
```powershell
.\demo-k8s-port-forward.ps1
```

Or test manually:

```powershell
# 1. Health Check
Invoke-RestMethod -Uri "http://localhost:3004/health" -Method Get

# 2. Get Token
$token = (Invoke-RestMethod -Uri "http://localhost:3004/auth/dev-token?userId=test_user").token

# 3. Create Payment
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

$response = Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $payment
$response | ConvertTo-Json -Depth 5
```

**📸 Take Screenshot** - Shows successful API call and response

---

### Option B: Using Minikube Service Command

```powershell
# This will open browser automatically
minikube service payment-service-nodeport -n ticketing-system
```

Then test in browser or use the URL shown.

---

## 📋 Complete Demonstration Checklist

### For Your Submission:

- [ ] **Screenshot 1:** `kubectl get pods -n ticketing-system` - All pods running
- [ ] **Screenshot 2:** `kubectl get svc -n ticketing-system` - Services (NodePort visible)
- [ ] **Screenshot 3:** `kubectl logs -f deployment/payment-service -n ticketing-system` - Application logs
- [ ] **Screenshot 4:** `kubectl describe deployment payment-service -n ticketing-system` - Deployment details
- [ ] **Screenshot 5:** Successful API call (curl/Postman/PowerShell) - Payment creation
- [ ] **Screenshot 6:** `kubectl get pvc -n ticketing-system` - Persistent volumes
- [ ] **Screenshot 7:** End-to-end flow - Complete payment flow demonstration

---

## 🎯 What Each Screenshot Proves

1. **Pods Running** → Microservices deployed and running in Kubernetes
2. **Services** → Network configuration (ClusterIP for internal, NodePort for external)
3. **Logs** → Application is working and processing requests
4. **Deployment Details** → Resource limits, probes, replicas configured
5. **API Call** → Service is accessible and functional
6. **PVCs** → Persistent storage for databases
7. **End-to-End Flow** → Complete workflow demonstration

---

## 🚀 Quick Commands Reference

```powershell
# View all resources
kubectl get all -n ticketing-system

# View pods
kubectl get pods -n ticketing-system

# View services
kubectl get svc -n ticketing-system

# View logs
kubectl logs -f deployment/payment-service -n ticketing-system

# Describe deployment
kubectl describe deployment payment-service -n ticketing-system

# Port forward (for API testing)
kubectl port-forward svc/payment-service-nodeport 3004:3004 -n ticketing-system

# Get service URL
minikube service payment-service-nodeport -n ticketing-system --url
```

---

## 💡 Tips for Better Screenshots

1. **Use full-screen terminal** for better visibility
2. **Highlight important parts** (pod names, status, URLs)
3. **Show complete commands** in terminal
4. **Include timestamps** if possible
5. **Use consistent terminal theme**
6. **Capture error-free output** - retry if needed

---

## 🎓 What You're Demonstrating

1. **Kubernetes Deployment** - All services running in pods
2. **Service Discovery** - Services communicating via ClusterIP
3. **External Access** - NodePort service for external access
4. **Persistent Storage** - PVCs for database persistence
5. **Health Checks** - Liveness and readiness probes
6. **Resource Management** - CPU and memory limits
7. **Scaling** - Multiple replicas of payment service
8. **End-to-End Flow** - Complete payment processing workflow

---

## 📝 Summary

You have successfully:
- ✅ Deployed payment service on Minikube (local Kubernetes)
- ✅ Created all required Kubernetes resources (Deployments, Services, ConfigMaps, Secrets, PVCs)
- ✅ Configured probes, resource limits, and scaling
- ✅ Set up persistent storage for databases
- ✅ Made service accessible via NodePort

**Now just take the screenshots and test the API!** 🎉

