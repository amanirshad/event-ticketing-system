# ✅ CORRECT COMMANDS - Copy & Paste

## Step 1: Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
```

## Step 2: Get Token
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/dev-token?userId=test_user").token
```

## Step 3: Create Payment (WITH PROPER UUID)
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "X-Correlation-Id" = "demo-123"
    "Idempotency-Key" = "550e8400-e29b-41d4-a716-446655440000"
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

**📸 Take screenshot of the payment response!**

---

## OR Use This Single Command (Generates UUID automatically):
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/dev-token?userId=test_user").token; $headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"; "X-Correlation-Id"="demo-123"; "Idempotency-Key"=(New-Guid).ToString()}; $payment = @{orderId="order_123"; userId="user_123"; amount=5000; currency="USD"; paymentMethod="stripe"; description="Demo"} | ConvertTo-Json; Invoke-RestMethod -Uri "http://localhost:8080/api/payments/charge" -Method Post -Headers $headers -Body $payment | ConvertTo-Json -Depth 5
```

