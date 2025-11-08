# Single-Line Commands - Easy to Copy

## Copy and paste these one by one:

### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health" | ConvertTo-Json -Depth 3
```

### 2. Get Token
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/dev-token?userId=test_user").token
```

### 3. Create Payment (Single Line - NO userId!)
```powershell
$headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"; "Idempotency-Key"=(New-Guid).ToString()}; $payment = @{orderId="order_123"; amount=5000; currency="USD"; paymentMethod="stripe"; paymentMethodId="pm_test_123"; description="Demo"} | ConvertTo-Json; Invoke-RestMethod -Uri "http://localhost:8080/api/payments/charge" -Method Post -Headers $headers -Body $payment | ConvertTo-Json -Depth 5
```

### 4. Get Payment by ID (Replace paymentId)
```powershell
$paymentId = "pay_XXXXX"; Invoke-RestMethod -Uri "http://localhost:8080/api/payments/$paymentId" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5
```

### 5. Get Payments by Order
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/order/order_123" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5
```

### 6. Get Statistics
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/stats/overview" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5
```

---

## OR Just Run the Script (Easiest!):
```powershell
.\run-api-calls.ps1
```

