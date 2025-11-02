# Payment Service - Complete Test Scenarios

This document provides a comprehensive list of test scenarios for the payment service with ready-to-run commands.

## Quick Start

Run all scenarios:
```powershell
.\test-all-scenarios.ps1
```

---

## Test Scenarios

### 1. Health Check & Service Status

**Purpose**: Verify service is running and dependencies are connected

**Commands**:
```powershell
# Basic health check
curl.exe http://localhost:3004/health

# Readiness check
curl.exe http://localhost:3004/health/ready

# Liveness check
curl.exe http://localhost:3004/health/live

# Metrics endpoint
curl.exe http://localhost:3004/metrics
```

**Expected**: All endpoints return 200 OK

---

### 2. Authentication

**Purpose**: Test token generation and authentication

**Commands**:
```powershell
# Get dev token
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
Write-Host "Token: $TOKEN"

# Use token in request
$headers = @{
    "Authorization" = "Bearer $TOKEN"
}
Invoke-RestMethod -Uri "http://localhost:3004/api/payments" -Headers $headers
```

**Expected**: Token generated successfully and can be used for authenticated requests

---

### 3. Payment Processing - Success Cases

#### 3.1 Basic Payment
```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
$IDEMPOTENCY = [guid]::NewGuid().Guid

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Idempotency-Key" = $IDEMPOTENCY
    "Content-Type" = "application/json"
}

$body = @{
    orderId = "ORDER_001"
    amount = 5000
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_123"
    description = "Test payment"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

#### 3.2 Large Amount Payment
```powershell
# Same as above, but change amount to 100000 (¥1000.00)
$body = @{
    orderId = "ORDER_002"
    amount = 100000
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_456"
    description = "Large payment"
} | ConvertTo-Json
```

#### 3.3 Payment with Metadata
```powershell
$body = @{
    orderId = "ORDER_003"
    amount = 7500
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_789"
    description = "Payment with metadata"
    metadata = @{
        eventId = "EVENT_123"
        ticketType = "VIP"
        seatNumber = "A1"
    }
} | ConvertTo-Json -Depth 3
```

**Expected**: All payments return `"success": true` with status `"SUCCESS"`

---

### 4. Payment Processing - Validation Errors

#### 4.1 Missing Required Fields
```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
$IDEMPOTENCY = [guid]::NewGuid().Guid

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Idempotency-Key" = $IDEMPOTENCY
    "Content-Type" = "application/json"
}

# Missing orderId and paymentMethod
$body = @{
    amount = 5000
    currency = "USD"
} | ConvertTo-Json

# Should return 400 Bad Request
try {
    Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $body -ContentType "application/json"
} catch {
    Write-Host "Error (expected): $($_.Exception.Message)"
}
```

#### 4.2 Invalid Amount (Negative)
```powershell
$body = @{
    orderId = "ORDER_INVALID"
    amount = -100
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_123"
} | ConvertTo-Json
```

#### 4.3 Invalid Payment Method
```powershell
$body = @{
    orderId = "ORDER_INVALID"
    amount = 5000
    currency = "USD"
    paymentMethod = "invalid_method"
    paymentMethodId = "pm_test_123"
} | ConvertTo-Json
```

#### 4.4 Missing Idempotency Key
```powershell
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
    # Missing Idempotency-Key
}

$body = @{
    orderId = "ORDER_NO_IDEMPOTENCY"
    amount = 5000
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_123"
} | ConvertTo-Json
```

**Expected**: All return 400 Bad Request with validation error messages

---

### 5. Idempotency Testing

**Purpose**: Ensure duplicate requests with same idempotency key return same result

```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
$IDEMPOTENCY = [guid]::NewGuid().Guid  # Same key for both requests

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Idempotency-Key" = $IDEMPOTENCY
    "Content-Type" = "application/json"
}

$body = @{
    orderId = "ORDER_IDEMPOTENCY"
    amount = 3000
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_idempotency"
    description = "Idempotency test"
} | ConvertTo-Json

# First request
$response1 = Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $body -ContentType "application/json"
Write-Host "First Payment ID: $($response1.data.paymentId)"

# Second request with SAME idempotency key
$response2 = Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $body -ContentType "application/json"
Write-Host "Second Payment ID: $($response2.data.paymentId)"

# Should be the same
if ($response1.data.paymentId -eq $response2.data.paymentId) {
    Write-Host "✓ Idempotency works correctly" -ForegroundColor Green
}
```

**Expected**: Both requests return the same payment ID

---

### 6. Get Payment by ID

#### 6.1 Valid Payment ID
```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
$PAYMENT_ID = "pay_1762058196964_f7b9a032"  # Use actual payment ID from previous test

$headers = @{
    "Authorization" = "Bearer $TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:3004/api/payments/$PAYMENT_ID" -Method Get -Headers $headers
```

#### 6.2 Invalid Payment ID
```powershell
# Should return 404 Not Found
try {
    Invoke-RestMethod -Uri "http://localhost:3004/api/payments/invalid_payment_id" -Method Get -Headers $headers
} catch {
    Write-Host "Error (expected): $($_.Exception.Message)"
}
```

**Expected**: Valid ID returns payment, invalid ID returns 404

---

### 7. List User Payments

#### 7.1 Basic List
```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token

$headers = @{
    "Authorization" = "Bearer $TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:3004/api/payments?page=1&limit=10" -Method Get -Headers $headers
```

#### 7.2 Pagination
```powershell
# Page 1, limit 2
Invoke-RestMethod -Uri "http://localhost:3004/api/payments?page=1&limit=2" -Method Get -Headers $headers

# Page 2, limit 2
Invoke-RestMethod -Uri "http://localhost:3004/api/payments?page=2&limit=2" -Method Get -Headers $headers
```

**Expected**: Returns paginated list of payments

---

### 8. Refund Payment

#### 8.1 Partial Refund
```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
$PAYMENT_ID = "pay_1762058196964_f7b9a032"  # Use actual payment ID

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    amount = 2500  # Partial refund (50% of $50 payment)
    reason = "requested_by_customer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3004/api/payments/$PAYMENT_ID/refund" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

#### 8.2 Full Refund
```powershell
$body = @{
    reason = "event_cancelled"
    # No amount specified = full refund
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3004/api/payments/$PAYMENT_ID/refund" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

**Expected**: Refund processed successfully, payment status updated

---

### 9. Authentication Errors

#### 9.1 Missing Token
```powershell
$headers = @{
    "Content-Type" = "application/json"
    # No Authorization header
}

$body = @{
    orderId = "ORDER_NO_AUTH"
    amount = 5000
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_123"
} | ConvertTo-Json

# Should return 401 Unauthorized
try {
    Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $body -ContentType "application/json"
} catch {
    Write-Host "Error (expected): $($_.Exception.Message)"
}
```

#### 9.2 Invalid Token
```powershell
$headers = @{
    "Authorization" = "Bearer invalid_token_12345"
    "Idempotency-Key" = [guid]::NewGuid().Guid
    "Content-Type" = "application/json"
}
```

**Expected**: Both return 401 Unauthorized

---

### 10. Payment Statistics

```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token

$headers = @{
    "Authorization" = "Bearer $TOKEN"
}

# Get all statistics
Invoke-RestMethod -Uri "http://localhost:3004/api/payments/stats/overview" -Method Get -Headers $headers

# Get statistics for date range
Invoke-RestMethod -Uri "http://localhost:3004/api/payments/stats/overview?startDate=2024-01-01&endDate=2024-12-31" -Method Get -Headers $headers
```

**Expected**: Returns payment statistics (total payments, total amount, by status)

---

## Manual Test Commands (Quick Reference)

### Single Payment Test
```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
$IDEMPOTENCY = [guid]::NewGuid().Guid
$headers = @{"Authorization"="Bearer $TOKEN"; "Idempotency-Key"=$IDEMPOTENCY; "Content-Type"="application/json"}
$body = '{"orderId":"ORDER_001","amount":5000,"currency":"USD","paymentMethod":"stripe","paymentMethodId":"pm_test_123","description":"Test"}' | ConvertFrom-Json | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

### Get Payment
```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
Invoke-RestMethod -Uri "http://localhost:3004/api/payments/PAYMENT_ID" -Headers @{"Authorization"="Bearer $TOKEN"}
```

### List Payments
```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
Invoke-RestMethod -Uri "http://localhost:3004/api/payments?page=1&limit=10" -Headers @{"Authorization"="Bearer $TOKEN"}
```

### Refund Payment
```powershell
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=test_user").token
$body = '{"amount":2500,"reason":"requested_by_customer"}' | ConvertFrom-Json | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3004/api/payments/PAYMENT_ID/refund" -Method Post -Headers @{"Authorization"="Bearer $TOKEN"; "Content-Type"="application/json"} -Body $body -ContentType "application/json"
```

---

## Test Checklist

- [ ] Health endpoints return 200 OK
- [ ] Authentication token generation works
- [ ] Basic payment processing succeeds
- [ ] Large amount payment succeeds
- [ ] Payment with metadata succeeds
- [ ] Validation errors return 400
- [ ] Missing fields return 400
- [ ] Invalid data returns 400
- [ ] Idempotency works (same key = same result)
- [ ] Get payment by ID works
- [ ] Invalid payment ID returns 404
- [ ] List payments works with pagination
- [ ] Partial refund works
- [ ] Full refund works
- [ ] Missing auth token returns 401
- [ ] Invalid auth token returns 401
- [ ] Payment statistics endpoint works

---

## Notes

- All test commands assume service is running on `http://localhost:3004`
- Replace `PAYMENT_ID` with actual payment IDs from previous tests
- Replace `test_user` with your actual user ID
- Test mode is enabled, so payments will simulate success even without real Stripe keys

