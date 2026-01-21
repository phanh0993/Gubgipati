' Script cập nhật shortcut trên desktop
' Tác giả: Auto-generated

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Lấy đường dẫn
ScriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
VbsFile = ScriptPath & "\START-FINAL-HIDDEN.vbs"
DesktopPath = WshShell.SpecialFolders("Desktop")
ShortcutPath = DesktopPath & "\SAPO - NEW.lnk"

' Tạo/cập nhật shortcut
Set oShellLink = WshShell.CreateShortcut(ShortcutPath)
oShellLink.TargetPath = "wscript.exe"
oShellLink.Arguments = """" & VbsFile & """"
oShellLink.WorkingDirectory = ScriptPath
oShellLink.Description = "Khởi động hệ thống SAPO (Chạy ngầm)"
oShellLink.IconLocation = "wscript.exe,0"
oShellLink.WindowStyle = 7 ' Minimized
oShellLink.Save

' Thông báo
WshShell.Popup "Đã cập nhật shortcut 'SAPO - NEW' trên Desktop!" & vbCrLf & vbCrLf & _
               "Shortcut này sẽ chạy hệ thống ngầm (không hiện cửa sổ CMD)." & vbCrLf & vbCrLf & _
               "Double-click vào shortcut để khởi động hệ thống.", 0, "SAPO - Cập nhật thành công", 64

Set oShellLink = Nothing
Set WshShell = Nothing
Set fso = Nothing













