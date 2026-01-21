# Script tạo shortcut trên desktop
# Tác giả: Auto-generated

$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "SAPO - NEW.lnk"
$startScriptPath = Join-Path $scriptPath "start-system.ps1"

Write-Host "Đang tạo shortcut trên desktop..."
Write-Host "Đường dẫn: $shortcutPath"

# Tạo shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScriptPath`""
$Shortcut.WorkingDirectory = $scriptPath
$Shortcut.Description = "Khởi động hệ thống SAPO"
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Save()

Write-Host "✅ Đã tạo shortcut thành công!"
Write-Host "   Tên: SAPO - NEW"
Write-Host "   Vị trí: $desktopPath"
Write-Host ""
Write-Host "💡 Double-click vào shortcut để khởi động hệ thống"








