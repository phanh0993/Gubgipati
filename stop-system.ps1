# Script dừng hệ thống SAPO
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

Write-Log "=========================================="
Write-Log "Bắt đầu dừng hệ thống SAPO..."
Write-Log "=========================================="

# 1. Dừng React App (npm/node processes)
Write-Log "Đang dừng React App..."
$reactProcesses = Get-WmiObject Win32_Process -Filter "name='node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*react-scripts*" -or 
    $_.CommandLine -like "*npm*start*" -or
    $_.CommandLine -like "*react-scripts start*"
}

$reactCount = 0
foreach ($process in $reactProcesses) {
    try {
        if ($process.CommandLine -like "*react-scripts*" -or $process.CommandLine -like "*npm*start*") {
            Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
            Write-Log "✅ Đã dừng React App process (PID: $($process.ProcessId))"
            $reactCount++
        }
    } catch {
        Write-Log "⚠️  Không thể dừng process (PID: $($process.ProcessId)): $_"
    }
}

if ($reactCount -eq 0) {
    Write-Log "ℹ️  Không tìm thấy React App process đang chạy"
}

# 2. Dừng Printer Server
Write-Log "Đang dừng Printer Server..."
$printerProcesses = Get-WmiObject Win32_Process -Filter "name='node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*printer-server.js*"
}

$printerCount = 0
foreach ($process in $printerProcesses) {
    try {
        if ($process.CommandLine -like "*printer-server.js*") {
            Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
            Write-Log "✅ Đã dừng Printer Server process (PID: $($process.ProcessId))"
            $printerCount++
        }
    } catch {
        Write-Log "⚠️  Không thể dừng process (PID: $($process.ProcessId)): $_"
    }
}

if ($printerCount -eq 0) {
    Write-Log "ℹ️  Không tìm thấy Printer Server process đang chạy"
}

# 3. Dừng tất cả node processes liên quan (fallback)
Write-Log "Đang kiểm tra các node processes còn lại..."
$allNodeProcesses = Get-WmiObject Win32_Process -Filter "name='node.exe'" -ErrorAction SilentlyContinue
$remainingCount = $allNodeProcesses.Count

if ($remainingCount -gt 0) {
    Write-Log "⚠️  Còn $remainingCount node process(es) đang chạy"
    Write-Log "   (Có thể là các process khác, không tự động dừng)"
} else {
    Write-Log "✅ Tất cả node processes đã được dừng"
}

Write-Log "=========================================="
Write-Log "Hoàn tất dừng hệ thống!"
Write-Log "=========================================="
Write-Log ""

# Hiển thị thông báo
$wshell = New-Object -ComObject WScript.Shell
$wshell.Popup("Hệ thống SAPO đã được dừng!`n`nĐã dừng:`n- React App: $reactCount process(es)`n- Printer Server: $printerCount process(es)", 3, "SAPO - Đã dừng", 0x40)

