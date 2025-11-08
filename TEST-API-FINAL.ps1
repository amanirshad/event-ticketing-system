# Test API using Minikube IP directly (No port-forward needed!)
Write-Host "Testing Payment Service via Minikube IP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$minikubeIP = "192.168.49.2"
$serviceUrl = "http://${minikubeIP}:30004"

Write-Host "Service URL: $serviceUrl`n" -ForegroundColor Green

# Step 1: Health Check
Write-Host "Step 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$serviceUrl/health" -Method Get
    Write-Host "Service is healthy!" -ForegroundColor Green
    Write-Host "   Database: $($health.database)" -ForegroundColor White
    Write-Host "   Redis: $($health.redis)`n" -ForegroundColor White
} catch {
    Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get Auth Token
Write-Host "Step 2: Getting Authentication Token" -ForegroundColor Yellow
try {
    $tokenResponse = Invoke-RestMethod -Uri "$serviceUrl/auth/dev-token?userId=test_user" -Method Get
    $token = $tokenResponse.token
    Write-Host "Token obtained`n" -ForegroundColor Green
} catch {
    Write-Host "Failed to get token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create Payment
Write-Host "Step 3: Creating Payment (End-to-End Flow)" -ForegroundColor Yellow
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "X-Correlation-Id" = "demo-$(Get-Date -Format 'yyyyMMddHHmmss')"
    "X-Idempotency-Key" = "idemp-$(New-Guid)"
}

$paymentData = @{
    orderId = "order_demo_$(Get-Random -Minimum 1000 -Maximum 9999)"
    userId = "user_demo_$(Get-Random -Minimum 1000 -Maximum 9999)"
    amount = 5000
    currency = "USD"
    paymentMethod = "stripe"
    description = "Kubernetes Demo Payment"
} | ConvertTo-Json

try {
    Write-Host "Sending payment request..." -ForegroundColor Cyan
    $paymentResponse = Invoke-RestMethod -Uri "$serviceUrl/api/payments/charge" -Method Post -Headers $headers -Body $paymentData
    Write-Host "Payment Created Successfully!`n" -ForegroundColor Green
    
    Write-Host "Payment Response:" -ForegroundColor Yellow
    $paymentResponse | ConvertTo-Json -Depth 5 | Write-Host
    Write-Host ""
    
    $paymentId = $paymentResponse.data.paymentId
    
    # Step 4: Retrieve Payment
    Write-Host "Step 4: Retrieving Payment" -ForegroundColor Yellow
    $retrievedPayment = Invoke-RestMethod -Uri "$serviceUrl/api/payments/$paymentId" -Method Get -Headers $headers
    Write-Host "Payment Retrieved!" -ForegroundColor Green
    Write-Host "   Payment ID: $paymentId" -ForegroundColor White
    Write-Host "   Status: $($retrievedPayment.data.status)" -ForegroundColor White
    Write-Host "   Amount: $($retrievedPayment.data.amount / 100) $($retrievedPayment.data.currency)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host "Test Completed!" -ForegroundColor Green
Write-Host "Take a screenshot of the successful payment creation above!" -ForegroundColor Yellow

