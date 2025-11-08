# Minikube Deployment Screenshots Guide

This document lists all the screenshots you need to capture for Task 5 submission.

## Required Screenshots

### 1. Pod Status (`kubectl get pods`)

**Command:**
```bash
kubectl get pods -n ticketing-system
```

**What to capture:**
- All pods showing `Running` status
- `READY` column showing `1/1` or `2/2`
- Pod names for payment-service, mongodb, and redis

**Expected output:**
```
NAME                               READY   STATUS    RESTARTS   AGE
mongodb-xxxxxxxxx-xxxxx            1/1     Running   0          2m
payment-service-xxxxxxxxx-xxxxx    2/2     Running   0          1m
redis-xxxxxxxxx-xxxxx              1/1     Running   0          2m
```

---

### 2. Services (`kubectl get svc`)

**Command:**
```bash
kubectl get svc -n ticketing-system
```

**What to capture:**
- All services listed
- `payment-service-nodeport` showing `NodePort` type
- NodePort number (e.g., `30004`)

**Expected output:**
```
NAME                        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
mongodb-service             ClusterIP   10.96.x.x       <none>        27017/TCP        2m
payment-service             ClusterIP   10.96.x.x       <none>        3004/TCP         1m
payment-service-nodeport    NodePort    10.96.x.x       <none>        3004:30004/TCP   1m
redis-service               ClusterIP   10.96.x.x       <none>        6379/TCP         2m
```

---

### 3. Pod Logs (`kubectl logs`)

**Command:**
```bash
kubectl logs -f deployment/payment-service -n ticketing-system
```

**Alternative (specific pod):**
```bash
kubectl logs <pod-name> -n ticketing-system
```

**What to capture:**
- Application startup logs
- Database connection success messages
- Service running messages
- Any request logs

**Expected content:**
- "🚀 Payment Service running on port 3004"
- "✅ MongoDB connected"
- "✅ Redis connected"
- Request logs showing API calls

---

### 4. Working API Call (curl/Postman)

#### Option A: Using curl

**Command:**
```bash
# Get token
TOKEN=$(curl -s http://<minikube-ip>:30004/auth/dev-token?userId=test_user | jq -r '.token')

# Create payment
curl -X POST http://<minikube-ip>:30004/api/payments/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
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

**What to capture:**
- Full curl command
- Successful JSON response showing payment creation
- Status code `200` or `201`

#### Option B: Using Postman

**What to capture:**
- Postman request configuration
- Response showing successful payment creation
- Status code and response body

**Request details:**
- **Method:** POST
- **URL:** `http://<minikube-ip>:30004/api/payments/charge`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
  - `X-Correlation-Id: test-123`
  - `X-Idempotency-Key: idemp-123`
- **Body:**
```json
{
  "orderId": "order_123",
  "userId": "user_123",
  "amount": 5000,
  "currency": "USD",
  "paymentMethod": "stripe",
  "description": "Test payment"
}
```

---

### 5. End-to-End Flow Demonstration

**Command:**
```powershell
.\test-minikube-e2e.ps1
```

**What to capture:**
- Complete test output showing:
  1. ✅ Token obtained
  2. ✅ Payment created successfully
  3. ✅ Payment retrieved successfully
  4. ✅ Order payments retrieved
  5. ✅ Statistics retrieved
  6. ✅ Service is healthy

**Expected flow:**
1. Create customer/user → Get auth token
2. Create payment → Payment record created
3. Retrieve payment → View payment details
4. View payment logs → Check kubectl logs

---

### 6. Additional Useful Screenshots (Optional but Recommended)

#### Deployment Details
```bash
kubectl describe deployment payment-service -n ticketing-system
```
Shows: Replicas, resource limits, probes configuration

#### ConfigMap
```bash
kubectl get configmap payment-service-config -n ticketing-system -o yaml
```
Shows: Configuration values (sensitive data redacted)

#### PersistentVolumeClaim Status
```bash
kubectl get pvc -n ticketing-system
```
Shows: Storage claims for MongoDB and Redis

#### Resource Usage
```bash
kubectl top pods -n ticketing-system
```
Shows: CPU and memory usage (if metrics-server is installed)

---

## Screenshot Checklist

- [ ] Pod status showing all pods running
- [ ] Services showing NodePort service
- [ ] Pod logs showing application startup and requests
- [ ] Successful API call (curl or Postman)
- [ ] End-to-end test output
- [ ] (Optional) Deployment details
- [ ] (Optional) PVC status

---

## Tips for Better Screenshots

1. **Use full-screen terminal** for better visibility
2. **Highlight important information** (pod names, status, URLs)
3. **Show complete commands** in the terminal
4. **Include timestamps** if possible
5. **Use consistent terminal theme** for professional look
6. **Capture error-free output** - retry if needed
7. **Include context** - show command prompt and working directory

---

## Quick Commands Reference

```bash
# Get Minikube IP
minikube ip

# Get NodePort
kubectl get svc payment-service-nodeport -n ticketing-system -o jsonpath='{.spec.ports[0].nodePort}'

# Get service URL
minikube service payment-service-nodeport -n ticketing-system --url

# View all resources
kubectl get all -n ticketing-system

# Describe pod (for troubleshooting)
kubectl describe pod <pod-name> -n ticketing-system

# Follow logs
kubectl logs -f <pod-name> -n ticketing-system
```

