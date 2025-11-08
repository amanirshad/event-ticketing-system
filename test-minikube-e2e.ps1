# End-to-End Test Script for Payment Service on Minikube
# This script demonstrates the complete flow: create payment -> process -> view

param(
    [string]$BaseUrl = ""
)

Write-Host "🧪 End-to-End Payment Service Test" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Get service URL if not provided
if ([string]::IsNullOrEmpty($BaseUrl)) {
    Write-Host "Getting service URL from Minikube..." -ForegroundColor Yellow
    $serviceUrl = minikube service payment-service-nodeport -n ticketing-system --url 2>&1 | Select-String -Pattern "http" | ForEach-Object { $_.Line.Trim() }
    
    if ([string]::IsNullOrEmpty($serviceUrl)) {
        $nodePort = kubectl get svc payment-service-nodeport -n ticketing-system -o jsonpath='{.spec.ports[0].nodePort}'
        $minikubeIP = minikube ip
        $BaseUrl = "http://${minikubeIP}:${nodePort}"
    } else {
        $BaseUrl = $serviceUrl
    }
}

Write-Host "Using Base URL: $BaseUrl`n" -ForegroundColor Green

# Generate test data
$userId = "user_$(Get-Random -Minimum 1000 -Maximum 9999)"
$orderId = "order_$(Get-Random -Minimum 1000 -Maximum 9999)"
$correlationId = "corr_$(New-Guid)"
$idempotencyKey = "idemp_$(New-Guid)"

Write-Host "Test Data:" -ForegroundColor Yellow
Write-Host "  User ID: $userId"
Write-Host "  Order ID: $orderId"
Write-Host "  Correlation ID: $correlationId"
Write-Host "  Idempotency Key: $idempotencyKey`n"

# Step 1: Get auth token (if auth is enabled, use dev token endpoint)
Write-Host "Step 1: Getting authentication token..." -ForegroundColor Cyan
try {
    $tokenResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/dev-token?userId=$userId" -Method Get
    $token = $tokenResponse.token
    Write-Host "✅ Token obtained: $($token.Substring(0, 20))...`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Auth token endpoint not available, proceeding without auth..." -ForegroundColor Yellow
    $token = $null
}

# Prepare headers
$headers = @{
    "Content-Type" = "application/json"
    "X-Correlation-Id" = $correlationId
    "X-Idempotency-Key" = $idempotencyKey
}

if ($token) {
    $headers["Authorization"] = "Bearer $token"
}

# Step 2: Create and process payment
Write-Host "Step 2: Creating and processing payment..." -ForegroundColor Cyan
$paymentData = @{
    orderId = $orderId
    userId = $userId
    amount = 5000  # $50.00 in cents
    currency = "USD"
    paymentMethod = "stripe"
    description = "Test payment for order $orderId"
    metadata = @{
        test = $true
        demo = $true
    }
} | ConvertTo-Json

try {
    $paymentResponse = Invoke-RestMethod -Uri "$BaseUrl/api/payments/charge" -Method Post -Headers $headers -Body $paymentData
    $paymentId = $paymentResponse.data.paymentId
    Write-Host "✅ Payment created successfully!" -ForegroundColor Green
    Write-Host "   Payment ID: $paymentId" -ForegroundColor White
    Write-Host "   Status: $($paymentResponse.data.status)" -ForegroundColor White
    Write-Host "   Amount: $($paymentResponse.data.amount / 100) $($paymentResponse.data.currency)`n" -ForegroundColor White
} catch {
    Write-Host "❌ Error creating payment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

# Step 3: Get payment details
Write-Host "Step 3: Retrieving payment details..." -ForegroundColor Cyan
try {
    $getPaymentResponse = Invoke-RestMethod -Uri "$BaseUrl/api/payments/$paymentId" -Method Get -Headers $headers
    Write-Host "✅ Payment retrieved successfully!" -ForegroundColor Green
    Write-Host "   Payment Details:" -ForegroundColor White
    $getPaymentResponse.data | ConvertTo-Json -Depth 3 | Write-Host
    Write-Host ""
} catch {
    Write-Host "❌ Error retrieving payment: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Get payments by order
Write-Host "Step 4: Retrieving payments by order..." -ForegroundColor Cyan
try {
    $orderPaymentsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/payments/order/$orderId" -Method Get -Headers $headers
    Write-Host "✅ Order payments retrieved!" -ForegroundColor Green
    Write-Host "   Found $($orderPaymentsResponse.data.Count) payment(s) for order $orderId`n" -ForegroundColor White
} catch {
    Write-Host "❌ Error retrieving order payments: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Get payment statistics
Write-Host "Step 5: Retrieving payment statistics..." -ForegroundColor Cyan
try {
    $statsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/payments/stats/overview" -Method Get -Headers $headers
    Write-Host "✅ Statistics retrieved!" -ForegroundColor Green
    Write-Host "   Statistics:" -ForegroundColor White
    $statsResponse.data | ConvertTo-Json -Depth 2 | Write-Host
    Write-Host ""
} catch {
    Write-Host "❌ Error retrieving statistics: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Health check
Write-Host "Step 6: Checking service health..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    Write-Host "✅ Service is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.message)" -ForegroundColor White
    Write-Host "   Database: $($healthResponse.database)" -ForegroundColor White
    Write-Host "   Redis: $($healthResponse.redis)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ End-to-End Test Completed!" -ForegroundColor Green
Write-Host "`n=== Summary ===" -ForegroundColor Yellow
Write-Host "Payment ID: $paymentId"
Write-Host "Order ID: $orderId"
Write-Host "User ID: $userId"
Write-Host "`nView payment in MongoDB via Mongo Express or kubectl logs"

