# Script khởi động hệ thống SAPO - Chạy ngầm
# Tác giả: Auto-generated
# Ngày tạo: $(Get-Date -Format "yyyy-MM-dd")

$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$logFile = Join-Path $scriptPath "system.log"

# Function để ghi log
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Add-Content -Path $logFile -Value $logMessage
    Write-Host $logMessage
}

# Function để kiểm tra port đã được sử dụng chưa
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    } catch {
        return $false
    }
}

# Function để kiểm tra process đã chạy chưa
function Test-ProcessRunning {
    param([string]$ProcessName, [string]$CommandLine)
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*$CommandLine*"
    }
    return $processes.Count -gt 0
}

Write-Log "=========================================="
Write-Log "Bắt đầu khởi động hệ thống SAPO..."
Write-Log "=========================================="

# Chuyển đến thư mục gốc
Set-Location $scriptPath
Write-Log "Thư mục làm việc: $scriptPath"

# 1. Kiểm tra và khởi động Printer Server (Port 9977)
Write-Log "Kiểm tra Printer Server (Port 9977)..."
if (Test-Port -Port 9977) {
    Write-Log "⚠️  Port 9977 đã được sử dụng. Printer Server có thể đã chạy."
} else {
    Write-Log "Khởi động Printer Server..."
    $printerServerPath = Join-Path $scriptPath "windows-printer-server\printer-server.js"
    
    if (Test-Path $printerServerPath) {
        $printerServerDir = Join-Path $scriptPath "windows-printer-server"
        $printerServerProcess = Start-Process -FilePath "node" `
            -ArgumentList "printer-server.js" `
            -WorkingDirectory $printerServerDir `
            -WindowStyle Hidden `
            -PassThru `
            -RedirectStandardOutput (Join-Path $scriptPath "printer-server.log") `
            -RedirectStandardError (Join-Path $scriptPath "printer-server-error.log")
        
        Start-Sleep -Seconds 2
        
        if (Test-Port -Port 9977) {
            Write-Log "✅ Printer Server đã khởi động thành công (PID: $($printerServerProcess.Id))"
        } else {
            Write-Log "❌ Printer Server khởi động thất bại"
        }
    } else {
        Write-Log "❌ Không tìm thấy file printer-server.js"
    }
}

# 2. Kiểm tra và khởi động React App (Port 3000)
Write-Log "Kiểm tra React App (Port 3000)..."
if (Test-Port -Port 3000) {
    Write-Log "⚠️  Port 3000 đã được sử dụng. React App có thể đã chạy."
} else {
    Write-Log "Khởi động React App..."
    
    # Kiểm tra node_modules
    if (-not (Test-Path (Join-Path $scriptPath "node_modules"))) {
        Write-Log "⚠️  node_modules chưa được cài đặt. Đang cài đặt dependencies..."
        npm install
    }
    
    # Khởi động React App
    $reactProcess = Start-Process -FilePath "npm" `
        -ArgumentList "start" `
        -WorkingDirectory $scriptPath `
        -WindowStyle Hidden `
        -PassThru `
        -RedirectStandardOutput (Join-Path $scriptPath "react-app.log") `
        -RedirectStandardError (Join-Path $scriptPath "react-app-error.log")
    
    Start-Sleep -Seconds 5
    
    if (Test-Port -Port 3000) {
        Write-Log "✅ React App đã khởi động thành công (PID: $($reactProcess.Id))"
        Write-Log "🌐 Truy cập: http://localhost:3000"
    } else {
        Write-Log "⚠️  React App đang khởi động... (có thể mất vài giây)"
    }
}

Write-Log "=========================================="
Write-Log "Hoàn tất khởi động hệ thống!"
Write-Log "=========================================="
Write-Log ""
Write-Log "📋 Thông tin hệ thống:"
Write-Log "   - React App: http://localhost:3000"
Write-Log "   - Printer Server: http://localhost:9977"
Write-Log "   - Log file: $logFile"
Write-Log ""
Write-Log "💡 Để dừng hệ thống, chạy file: stop-system.ps1"
Write-Log ""

# Hiển thị thông báo
$wshell = New-Object -ComObject WScript.Shell
$wshell.Popup("Hệ thống SAPO đã được khởi động!`n`n- React App: http://localhost:3000`n- Printer Server: http://localhost:9977`n`nXem log tại: $logFile", 5, "SAPO - Khởi động thành công", 0x40)














