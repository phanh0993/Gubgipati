' Script thiết lập khởi động cùng Windows
' Tác giả: Auto-generated

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Lấy đường dẫn
ScriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
VbsFile = ScriptPath & "\START-FINAL-HIDDEN.vbs"
StartupFolder = WshShell.SpecialFolders("Startup")
ShortcutPath = StartupFolder & "\SAPO - Auto Start.lnk"

' Tạo shortcut trong Startup folder
Set oShellLink = WshShell.CreateShortcut(ShortcutPath)
oShellLink.TargetPath = "wscript.exe"
oShellLink.Arguments = """" & VbsFile & """"
oShellLink.WorkingDirectory = ScriptPath
oShellLink.Description = "Khởi động hệ thống SAPO cùng Windows"
oShellLink.WindowStyle = 7 ' Minimized
oShellLink.Save

' Thông báo
WshShell.Popup "Đã thiết lập khởi động cùng Windows thành công!" & vbCrLf & vbCrLf & _
               "Hệ thống SAPO sẽ tự động khởi động khi bạn đăng nhập Windows." & vbCrLf & vbCrLf & _
               "Shortcut: " & ShortcutPath & vbCrLf & vbCrLf & _
               "Để tắt tự động khởi động, xóa file shortcut trong Startup folder.", 0, "SAPO - Thiết lập thành công", 64

Set oShellLink = Nothing
Set WshShell = Nothing
Set fso = Nothing













