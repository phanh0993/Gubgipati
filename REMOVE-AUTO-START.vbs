' Script xóa khởi động cùng Windows
' Tác giả: Auto-generated

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Lấy đường dẫn Startup folder
StartupFolder = WshShell.SpecialFolders("Startup")
ShortcutPath = StartupFolder & "\SAPO - Auto Start.lnk"

' Xóa shortcut nếu tồn tại
If fso.FileExists(ShortcutPath) Then
    fso.DeleteFile ShortcutPath, True
    WshShell.Popup "Đã xóa khởi động cùng Windows!" & vbCrLf & vbCrLf & _
                   "Hệ thống SAPO sẽ không tự động khởi động nữa.", 0, "SAPO - Đã xóa", 64
Else
    WshShell.Popup "Không tìm thấy shortcut khởi động cùng Windows." & vbCrLf & vbCrLf & _
                   "Có thể đã bị xóa trước đó.", 0, "SAPO - Thông báo", 48
End If

Set WshShell = Nothing
Set fso = Nothing













