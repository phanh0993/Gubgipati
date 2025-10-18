# PowerShell script to start ESC/POS RAW Test Server
Write-Host "Starting ESC/POS RAW Test Server..." -ForegroundColor Green
Write-Host ""
Write-Host "This server provides endpoints to test ESC/POS RAW printing" -ForegroundColor Yellow
Write-Host "without Windows driver margins." -ForegroundColor Yellow
Write-Host ""
Write-Host "Server will run on port 9978" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:9978/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
        Write-Host "Starting server..." -ForegroundColor Green
        Write-Host ""
        
        # Start the server
        node windows-printer-server/escpos-raw-server.js
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Or add Node.js to your system PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Run this command manually:" -ForegroundColor Cyan
    Write-Host "  node windows-printer-server/escpos-raw-server.js" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
