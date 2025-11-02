# Payment Service API Test Script
# This script tests the payment service endpoints

$BASE = "http://localhost:3004"

Write-Host "=== Payment Service API Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Health Check
Write-Host "1. Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$BASE/health" -Method Get
$health | ConvertTo-Json -Depth 3
Write-Host ""

# Step 2: Get Dev Token
Write-Host "2. Getting Dev Token..." -ForegroundColor Yellow
$userId = "dubeyakanksha28_db_user"
$tokenResponse = Invoke-RestMethod -Uri "$BASE/auth/dev-token?userId=$userId" -Method Get
$TOKEN = $tokenResponse.token
Write-Host "Token received (first 30 chars): $($TOKEN.Substring(0, [Math]::Min(30, $TOKEN.Length)))..." -ForegroundColor Green
Write-Host ""

# Step 3: Generate Idempotency Key (UUID)
$IDEMPOTENCY_KEY = [guid]::NewGuid().Guid
Write-Host "3. Idempotency Key: $IDEMPOTENCY_KEY" -ForegroundColor Yellow
Write-Host ""

# Step 4: Process Payment Charge
Write-Host "4. Processing Payment Charge..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Idempotency-Key" = $IDEMPOTENCY_KEY
    "Content-Type" = "application/json"
}

$paymentBody = @{
    orderId = "O98765"
    amount = 20000  # $200.00 in cents
    currency = "USD"
    paymentMethod = "stripe"  # Note: paymentMethod not "method"
    paymentMethodId = "pm_test_1234567890"  # Required for Stripe
    description = "Test payment"
} | ConvertTo-Json

try {
    $chargeResponse = Invoke-RestMethod -Uri "$BASE/api/payments/charge" -Method Post -Headers $headers -Body $paymentBody -ContentType "application/json"
    Write-Host "✅ Payment Charge Successful!" -ForegroundColor Green
    $chargeResponse | ConvertTo-Json -Depth 6
    Write-Host ""
    
    $paymentId = $chargeResponse.data.paymentId
    if ($paymentId) {
        Write-Host "Payment ID: $paymentId" -ForegroundColor Cyan
        Write-Host ""
        
        # Step 5: Get Payment by ID
        Write-Host "5. Getting Payment by ID..." -ForegroundColor Yellow
        $getHeaders = @{
            "Authorization" = "Bearer $TOKEN"
        }
        try {
            $payment = Invoke-RestMethod -Uri "$BASE/api/payments/$paymentId" -Method Get -Headers $getHeaders
            $payment | ConvertTo-Json -Depth 6
            Write-Host ""
        } catch {
            Write-Host "⚠️ Could not fetch payment: $_" -ForegroundColor Yellow
        }
        
        # Step 6: List User Payments
        Write-Host "6. Listing User Payments..." -ForegroundColor Yellow
        try {
            $payments = Invoke-RestMethod -Uri "$BASE/api/payments?page=1&limit=10" -Method Get -Headers $getHeaders
            Write-Host "Found $($payments.data.payments.Count) payments" -ForegroundColor Green
            $payments | ConvertTo-Json -Depth 4
            Write-Host ""
        } catch {
            Write-Host "⚠️ Could not list payments: $_" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Payment Charge Failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
