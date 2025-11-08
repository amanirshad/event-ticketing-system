# Quick Demo Script for Kubernetes Deployment
Write-Host "🚀 Payment Service Kubernetes Demo" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Get service URL
Write-Host "Getting service URL..." -ForegroundColor Yellow
$minikubeIP = minikube ip
$nodePort = kubectl get svc payment-service-nodeport -n ticketing-system -o jsonpath='{.spec.ports[0].nodePort}'
$serviceUrl = "http://${minikubeIP}:${nodePort}"

Write-Host "Service URL: $serviceUrl`n" -ForegroundColor Green

# Step 1: Health Check
Write-Host "Step 1: Health Check" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$serviceUrl/health" -Method Get
    Write-Host "✅ Service is healthy!" -ForegroundColor Green
    Write-Host "   Database: $($health.database)" -ForegroundColor White
    Write-Host "   Redis: $($health.redis)`n" -ForegroundColor White
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Step 2: Get Auth Token
Write-Host "Step 2: Getting Authentication Token" -ForegroundColor Cyan
try {
    $tokenResponse = Invoke-RestMethod -Uri "$serviceUrl/auth/dev-token?userId=demo_user" -Method Get
    $token = $tokenResponse.token
    Write-Host "✅ Token obtained`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get token: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Step 3: Create Payment
Write-Host "Step 3: Creating Payment (End-to-End Flow)" -ForegroundColor Cyan
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "X-Correlation-Id" = "demo-$(Get-Date -Format 'yyyyMMddHHmmss')"
    "X-Idempotency-Key" = "idemp-$(New-Guid)"
}

$paymentData = @{
    orderId = "order_demo_$(Get-Random -Minimum 1000 -Maximum 9999)"
    userId = "user_demo_$(Get-Random -Minimum 1000 -Maximum 9999)"
    amount = 5000  # $50.00
    currency = "USD"
    paymentMethod = "stripe"
    description = "Kubernetes Demo Payment"
} | ConvertTo-Json

try {
    Write-Host "Sending payment request..." -ForegroundColor Yellow
    $paymentResponse = Invoke-RestMethod -Uri "$serviceUrl/api/payments/charge" -Method Post -Headers $headers -Body $paymentData
    Write-Host "✅ Payment Created Successfully!" -ForegroundColor Green
    Write-Host "`nPayment Details:" -ForegroundColor Yellow
    $paymentResponse.data | ConvertTo-Json -Depth 3 | Write-Host
    Write-Host ""
    
    $paymentId = $paymentResponse.data.paymentId
    
    # Step 4: Retrieve Payment
    Write-Host "Step 4: Retrieving Payment" -ForegroundColor Cyan
    $retrievedPayment = Invoke-RestMethod -Uri "$serviceUrl/api/payments/$paymentId" -Method Get -Headers $headers
    Write-Host "✅ Payment Retrieved!" -ForegroundColor Green
    Write-Host "   Payment ID: $paymentId" -ForegroundColor White
    Write-Host "   Status: $($retrievedPayment.data.status)" -ForegroundColor White
    Write-Host "   Amount: $($retrievedPayment.data.amount / 100) $($retrievedPayment.data.currency)`n" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n✅ Demo Completed!" -ForegroundColor Green
Write-Host "`n📸 Screenshots Taken:" -ForegroundColor Yellow
Write-Host "   - kubectl get pods -n ticketing-system" -ForegroundColor White
Write-Host "   - kubectl get svc -n ticketing-system" -ForegroundColor White
Write-Host "   - kubectl logs -f deployment/payment-service -n ticketing-system" -ForegroundColor White
Write-Host "   - API calls (above)" -ForegroundColor White

