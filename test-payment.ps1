Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Payment Service - Complete Test" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Authentication Token
Write-Host "[Step 1] Getting authentication token..." -ForegroundColor Yellow
try {
    $tokenResponse = Invoke-RestMethod -Uri "http://localhost:3004/auth/dev-token?userId=dubeyakanksha28_db_user" -Method Get
    $TOKEN = $tokenResponse.token
    Write-Host "  Token received successfully" -ForegroundColor Green
} catch {
    Write-Host "  Failed to get token: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Generate Idempotency Key
$IDEMPOTENCY_KEY = [guid]::NewGuid().Guid
Write-Host "[Step 2] Generated Idempotency Key" -ForegroundColor Yellow
Write-Host "  Key: $IDEMPOTENCY_KEY" -ForegroundColor Gray
Write-Host ""

# Step 3: Prepare Payment Request
Write-Host "[Step 3] Preparing payment request..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Idempotency-Key" = $IDEMPOTENCY_KEY
    "Content-Type" = "application/json"
}

$paymentBody = @{
    orderId = "O98765"
    amount = 20000
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_123"
    description = "Test payment"
}

Write-Host "  Request Details:" -ForegroundColor Gray
Write-Host "    Order ID: $($paymentBody.orderId)" -ForegroundColor Gray
Write-Host "    Amount: $($paymentBody.amount) cents" -ForegroundColor Gray
Write-Host "    Currency: $($paymentBody.currency)" -ForegroundColor Gray
Write-Host "    Payment Method: $($paymentBody.paymentMethod)" -ForegroundColor Gray
Write-Host ""

# Step 4: Process Payment
Write-Host "[Step 4] Processing payment..." -ForegroundColor Yellow
try {
    $paymentJson = $paymentBody | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $paymentJson -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "  Payment processed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  PAYMENT RESPONSE DETAILS" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Success: " -NoNewline -ForegroundColor Gray
    if ($response.success) {
        Write-Host "TRUE" -ForegroundColor Green
    } else {
        Write-Host "FALSE" -ForegroundColor Red
    }
    
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host ""
    
    if ($response.data) {
        Write-Host "Payment Details:" -ForegroundColor Yellow
        Write-Host "  Payment ID:     $($response.data.paymentId)" -ForegroundColor White
        Write-Host "  Status:         $($response.data.status)" -ForegroundColor $(if ($response.data.status -eq 'SUCCESS') { 'Green' } else { 'Yellow' })
        Write-Host "  Amount:         $($response.data.amount) cents" -ForegroundColor White
        Write-Host "  Currency:       $($response.data.currency)" -ForegroundColor White
        if ($response.data.gatewayTransactionId) {
            Write-Host "  Gateway TX ID:  $($response.data.gatewayTransactionId)" -ForegroundColor Gray
        }
        if ($response.data.expiresAt) {
            Write-Host "  Expires At:     $($response.data.expiresAt)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "Correlation ID: $($response.correlationId)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  FULL JSON RESPONSE" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    $jsonOutput = $response | ConvertTo-Json -Depth 10
    Write-Host $jsonOutput
    Write-Host ""
    
    # Also show as formatted list to ensure nothing is truncated
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  DETAILED FIELD-BY-FIELD VIEW" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "success       : $($response.success)" -ForegroundColor White
    Write-Host "message       : $($response.message)" -ForegroundColor White
    Write-Host "correlationId : $($response.correlationId)" -ForegroundColor White
    Write-Host ""
    Write-Host "data.paymentId            : $($response.data.paymentId)" -ForegroundColor White
    Write-Host "data.status               : $($response.data.status)" -ForegroundColor White
    Write-Host "data.amount               : $($response.data.amount)" -ForegroundColor White
    Write-Host "data.currency             : $($response.data.currency)" -ForegroundColor White
    Write-Host "data.gatewayTransactionId : $($response.data.gatewayTransactionId)" -ForegroundColor White
    Write-Host "data.expiresAt            : $($response.data.expiresAt)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "  Payment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    
    if ($_.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response Body: $responseBody" -ForegroundColor Red
    }
    
    Write-Host ""
    exit 1
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Test Complete" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
