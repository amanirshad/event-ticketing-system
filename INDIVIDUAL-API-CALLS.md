# Individual API Calls - Run One by One

## Make sure port-forward is running:
```powershell
kubectl port-forward svc/payment-service-nodeport 8080:3004 -n ticketing-system
```

---

## API Call 1: Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health" | ConvertTo-Json -Depth 3
```
**📸 Screenshot this** - Shows service is healthy

---

## API Call 2: Get Authentication Token
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/dev-token?userId=test_user").token
Write-Host "Token: $token"
```
**📸 Screenshot this** - Shows token obtained

---

## API Call 3: Create Payment (End-to-End Flow)
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "Idempotency-Key" = (New-Guid).ToString()
}
$payment = @{
    orderId = "order_123"
    userId = "user_123"
    amount = 5000
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_123"
    description = "Demo payment"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/payments/charge" -Method Post -Headers $headers -Body $payment | ConvertTo-Json -Depth 5
```
**📸 Screenshot this** - Shows payment created successfully

---

## API Call 4: Get Payment by ID
```powershell
# Use the paymentId from previous response (e.g., "pay_1234567890_abc123")
$paymentId = "pay_XXXXX"  # Replace with actual paymentId
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/$paymentId" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5
```
**📸 Screenshot this** - Shows payment retrieved

---

## API Call 5: Get Payments by Order
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/order/order_123" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5
```
**📸 Screenshot this** - Shows payments for order

---

## API Call 6: Get User Payments (List)
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/payments?page=1&limit=10" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5
```
**📸 Screenshot this** - Shows user payment list

---

## API Call 7: Get Payment Statistics
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/stats/overview" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5
```
**📸 Screenshot this** - Shows payment statistics

---

## API Call 8: Refund Payment
```powershell
# Use paymentId from API Call 3
$paymentId = "pay_XXXXX"  # Replace with actual paymentId
$refundHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "Idempotency-Key" = (New-Guid).ToString()
}
$refundData = @{
    amount = 2500
    reason = "requested_by_customer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/payments/$paymentId/refund" -Method Post -Headers $refundHeaders -Body $refundData | ConvertTo-Json -Depth 5
```
**📸 Screenshot this** - Shows refund processed

---

## Quick Copy-Paste (All in One)
```powershell
# 1. Health
Invoke-RestMethod -Uri "http://localhost:8080/health" | ConvertTo-Json

# 2. Token
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/dev-token?userId=test_user").token

# 3. Create Payment
$headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"; "Idempotency-Key"=(New-Guid).ToString()}
$payment = @{orderId="order_123"; userId="user_123"; amount=5000; currency="USD"; paymentMethod="stripe"; paymentMethodId="pm_test_123"; description="Demo"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8080/api/payments/charge" -Method Post -Headers $headers -Body $payment
$response | ConvertTo-Json -Depth 5
$paymentId = $response.data.paymentId

# 4. Get Payment
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/$paymentId" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5

# 5. Get by Order
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/order/order_123" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5

# 6. List Payments
Invoke-RestMethod -Uri "http://localhost:8080/api/payments?page=1&limit=10" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5

# 7. Statistics
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/stats/overview" -Method Get -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json -Depth 5
```

