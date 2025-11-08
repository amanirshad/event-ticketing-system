# ✅ FINAL QUICK STEPS

## Step 1: Navigate to Project Directory
```powershell
cd C:\Projects\payment-service
```

## Step 2: Make sure port-forward is running (in another window)
```powershell
kubectl port-forward svc/payment-service-nodeport 8080:3004 -n ticketing-system
```

## Step 3: Run the test script
```powershell
.\test-all-scenarios.ps1
```

**📸 Take screenshot of the test results!**

---

## OR Run Commands Directly (if script doesn't work):

```powershell
# Navigate first
cd C:\Projects\payment-service

# Health check
Invoke-RestMethod -Uri "http://localhost:8080/health"

# Get token
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/dev-token?userId=test_user").token

# Create payment
$headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"; "Idempotency-Key"=(New-Guid).ToString()}
$payment = @{orderId="order_123"; userId="user_123"; amount=5000; currency="USD"; paymentMethod="stripe"; paymentMethodId="pm_test_123"; description="Demo"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/charge" -Method Post -Headers $headers -Body $payment | ConvertTo-Json -Depth 5
```

