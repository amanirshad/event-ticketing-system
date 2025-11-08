# Quick Minikube Installation Script for Windows
# This script downloads and installs Minikube

Write-Host "Downloading Minikube..." -ForegroundColor Yellow

# Create temp directory
$tempDir = "$env:TEMP\minikube-install"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Download Minikube
$minikubeUrl = "https://github.com/kubernetes/minikube/releases/latest/download/minikube-windows-amd64.exe"
$minikubePath = "$tempDir\minikube.exe"

Write-Host "Downloading from: $minikubeUrl" -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $minikubeUrl -OutFile $minikubePath -UseBasicParsing
    Write-Host "Download completed!" -ForegroundColor Green
} catch {
    Write-Host "Error downloading Minikube: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check if a common bin directory exists
$binPaths = @(
    "$env:ProgramFiles\minikube",
    "$env:LOCALAPPDATA\minikube",
    "$env:USERPROFILE\bin"
)

$installPath = $null
foreach ($path in $binPaths) {
    if (-not (Test-Path $path)) {
        try {
            New-Item -ItemType Directory -Force -Path $path | Out-Null
            $installPath = $path
            break
        } catch {
            continue
        }
    } else {
        $installPath = $path
        break
    }
}

if (-not $installPath) {
    $installPath = "$env:USERPROFILE\minikube"
    New-Item -ItemType Directory -Force -Path $installPath | Out-Null
}

# Copy Minikube to install path
$finalPath = Join-Path $installPath "minikube.exe"
Copy-Item $minikubePath $finalPath -Force
Write-Host "Minikube installed to: $finalPath" -ForegroundColor Green

# Add to PATH (current session)
$env:Path += ";$installPath"
Write-Host "Added to PATH for current session" -ForegroundColor Green

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Yellow
try {
    $version = & "$finalPath" version
    Write-Host "✅ Minikube installed successfully!" -ForegroundColor Green
    Write-Host $version
} catch {
    Write-Host "⚠️  Installation completed but verification failed. You may need to:" -ForegroundColor Yellow
    Write-Host "1. Add $installPath to your system PATH manually" -ForegroundColor Yellow
    Write-Host "2. Restart PowerShell" -ForegroundColor Yellow
    Write-Host "3. Run: minikube version" -ForegroundColor Yellow
}

Write-Host "`nTo add to PATH permanently:" -ForegroundColor Cyan
Write-Host "1. Open System Properties → Environment Variables" -ForegroundColor White
Write-Host "2. Add this to PATH: $installPath" -ForegroundColor White
Write-Host "3. Restart PowerShell" -ForegroundColor White

Write-Host "`nOr run this command (requires admin):" -ForegroundColor Cyan
Write-Host "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';$installPath', 'User')" -ForegroundColor White

# Cleanup
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

