# PowerShell script to build ESC/POS Test Server as executable
Write-Host "Building ESC/POS Test Server as executable..." -ForegroundColor Green
Write-Host ""

# Check if pkg is installed
try {
    $pkgVersion = pkg --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "pkg found: $pkgVersion" -ForegroundColor Green
    } else {
        throw "pkg not found"
    }
} catch {
    Write-Host "Installing pkg globally..." -ForegroundColor Yellow
    npm install -g pkg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install pkg" -ForegroundColor Red
        Write-Host "Please install Node.js and npm first" -ForegroundColor Yellow
        Read-Host "Press Enter to continue"
        exit 1
    }
}

Write-Host "Building executable..." -ForegroundColor Cyan
pkg escpos-test-server.js --targets node18-win-x64 --output escpos-test-server.exe

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host "📁 File created: escpos-test-server.exe" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 To run: Double-click escpos-test-server.exe" -ForegroundColor Yellow
    Write-Host "📡 Server will run on port 9978" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to continue"
