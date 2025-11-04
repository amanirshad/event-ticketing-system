# Quick test to verify refund fix
$TOKEN = (Invoke-RestMethod "http://localhost:3004/auth/dev-token?userId=dubeyakanksha28_db_user").token
$IDEMPOTENCY = [guid]::NewGuid().Guid

Write-Host "Creating payment..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Idempotency-Key" = $IDEMPOTENCY
    "Content-Type" = "application/json"
}

$body = @{
    orderId = "ORDER_REFUND_TEST"
    amount = 5000
    currency = "USD"
    paymentMethod = "stripe"
    paymentMethodId = "pm_test_123"
    description = "Refund test"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3004/api/payments/charge" -Method Post -Headers $headers -Body $body -ContentType "application/json"
$PAYMENT_ID = $response.data.paymentId

Write-Host "Payment ID: $PAYMENT_ID" -ForegroundColor Green
Write-Host "Status: $($response.data.status)" -ForegroundColor Green
Write-Host ""

Write-Host "Testing refund..." -ForegroundColor Yellow
$refundHeaders = @{
    "Authorization" = "Bearer $TOKEN"
    "Idempotency-Key" = [guid]::NewGuid().Guid
    "Content-Type" = "application/json"
}

$refundBody = @{
    amount = 2500
    reason = "requested_by_customer"
} | ConvertTo-Json

try {
    $refundResponse = Invoke-RestMethod -Uri "http://localhost:3004/api/payments/$PAYMENT_ID/refund" -Method Post -Headers $refundHeaders -Body $refundBody -ContentType "application/json"
    Write-Host "Refund SUCCESS!" -ForegroundColor Green
    $refundResponse | ConvertTo-Json -Depth 6
} catch {
    Write-Host "Refund FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

