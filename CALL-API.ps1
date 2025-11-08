$serviceUrl = "http://localhost:8080"

Write-Host "Getting token..." -ForegroundColor Yellow
$token = (Invoke-RestMethod -Uri "$serviceUrl/auth/dev-token?userId=test_user").token

Write-Host "Creating payment..." -ForegroundColor Yellow
$headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"; "X-Correlation-Id"="demo-123"; "X-Idempotency-Key"="idemp-123"}
$payment = @{orderId="order_123"; userId="user_123"; amount=5000; currency="USD"; paymentMethod="stripe"; description="Demo"} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "$serviceUrl/api/payments/charge" -Method Post -Headers $headers -Body $payment
$result | ConvertTo-Json -Depth 5

