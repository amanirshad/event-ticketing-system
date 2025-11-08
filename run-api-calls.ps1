# Individual API Calls - Easy to Run
$serviceUrl = "http://localhost:8080"

Write-Host "=== API Call 1: Health Check ===" -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$serviceUrl/health"
$health | ConvertTo-Json -Depth 3
Write-Host ""

Write-Host "=== API Call 2: Get Token ===" -ForegroundColor Cyan
$token = (Invoke-RestMethod -Uri "$serviceUrl/auth/dev-token?userId=test_user").token
Write-Host "Token obtained: $($token.Substring(0, [Math]::Min(30, $token.Length)))..." -ForegroundColor Green
Write-Host ""

Write-Host "=== API Call 3: Create Payment ===" -ForegroundColor Cyan
$headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"; "Idempotency-Key"=(New-Guid).ToString()}
$payment = @{orderId="order_123"; amount=5000; currency="USD"; paymentMethod="stripe"; paymentMethodId="pm_test_123"; description="Demo payment"} | ConvertTo-Json
$paymentResponse = Invoke-RestMethod -Uri "$serviceUrl/api/payments/charge" -Method Post -Headers $headers -Body $payment
$paymentResponse | ConvertTo-Json -Depth 5
$paymentId = $paymentResponse.data.paymentId
Write-Host "Payment ID: $paymentId" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== API Call 4: Get Payment by ID ===" -ForegroundColor Cyan
$getPayment = Invoke-RestMethod -Uri "$serviceUrl/api/payments/$paymentId" -Method Get -Headers @{"Authorization"="Bearer $token"}
$getPayment | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "=== API Call 5: Get Payments by Order ===" -ForegroundColor Cyan
$orderPayments = Invoke-RestMethod -Uri "$serviceUrl/api/payments/order/order_123" -Method Get -Headers @{"Authorization"="Bearer $token"}
$orderPayments | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "=== API Call 6: Get Payment Statistics ===" -ForegroundColor Cyan
$stats = Invoke-RestMethod -Uri "$serviceUrl/api/payments/stats/overview" -Method Get -Headers @{"Authorization"="Bearer $token"}
$stats | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "=== All API Calls Completed! ===" -ForegroundColor Green
Write-Host "Take screenshots of the outputs above!" -ForegroundColor Yellow

