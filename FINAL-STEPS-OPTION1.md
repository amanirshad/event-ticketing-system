# ✅ FINAL STEPS - Option 1 (Port 8080)

## Step 1: Start Port Forward (NEW PowerShell Window)

Open a **NEW PowerShell window** and run:
```powershell
kubectl port-forward svc/payment-service-nodeport 8080:3004 -n ticketing-system
```

You should see:
```
Forwarding from 127.0.0.1:8080 -> 3004
Forwarding from [::1]:8080 -> 3004
```

**⚠️ Keep this window open!**

---

## Step 2: Test API (Your Current Window)

In your **current PowerShell window**, run:

```powershell
.\TEST-API-OPTION1.ps1
```

Or test manually:

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

**📸 Take screenshot of successful payment creation!**

---

## Summary

1. **NEW window:** `kubectl port-forward svc/payment-service-nodeport 8080:3004 -n ticketing-system`
2. **Current window:** Run `.\TEST-API-OPTION1.ps1` or manual commands above
3. **Screenshot:** Successful payment response

Done! 🎉

