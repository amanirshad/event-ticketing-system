# ✅ Run These Commands Now (Copy & Paste)

## Your health check worked! Now run these:

### 1. Get Token:
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/dev-token?userId=test_user").token
```

### 2. Create Payment:
```powershell
$headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"; "X-Correlation-Id"="demo-123"; "X-Idempotency-Key"="idemp-123"}
$payment = @{orderId="order_123"; userId="user_123"; amount=5000; currency="USD"; paymentMethod="stripe"; description="Demo"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/payments/charge" -Method Post -Headers $headers -Body $payment | ConvertTo-Json -Depth 5
```

**📸 Take screenshot of the payment response!**

---

## That's it! You're done! 🎉

