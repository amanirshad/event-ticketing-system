# Simple API Calls - One Line at a Time

## Make sure port-forward is running first!
In another window: `kubectl port-forward svc/payment-service-nodeport 8080:3004 -n ticketing-system`

## Then run these one by one:

```powershell
# 1. Health check
Invoke-RestMethod -Uri "http://localhost:8080/health"
```

```powershell
# 2. Get token
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/dev-token?userId=test_user").token
```

```powershell
# 3. Create payment
$headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"; "X-Correlation-Id"="demo-123"; "X-Idempotency-Key"="idemp-123"}
$payment = @{orderId="order_123"; userId="user_123"; amount=5000; currency="USD"; paymentMethod="stripe"; description="Demo"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/charge" -Method Post -Headers $headers -Body $payment | ConvertTo-Json -Depth 5
```

## OR just run the script:
```powershell
.\CALL-API.ps1
```

