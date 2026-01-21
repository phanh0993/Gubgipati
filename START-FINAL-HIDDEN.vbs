' Script VBScript để chạy START-FINAL-HIDDEN.bat ngầm (ẩn cửa sổ CMD)
' Tác giả: Auto-generated

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Lấy đường dẫn thư mục chứa script này
ScriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
BatFile = ScriptPath & "\START-FINAL-HIDDEN.bat"

' Chạy file BAT với cửa sổ ẩn (0 = ẩn, 1 = hiện)
WshShell.Run """" & BatFile & """", 0, False

' Thông báo
WshShell.Popup "Hệ thống SAPO đã được khởi động ngầm!" & vbCrLf & vbCrLf & _
               "Services:" & vbCrLf & _
               "- Backend API: http://localhost:8000" & vbCrLf & _
               "- Printer Server: http://localhost:9977" & vbCrLf & _
               "- React Webapp: http://localhost:3000" & vbCrLf & vbCrLf & _
               "Truy cập: http://localhost:3000" & vbCrLf & _
               "(Sẽ tự động chuyển đến /pos-login)" & vbCrLf & vbCrLf & _
               "Chờ 30-60 giây để React compile xong...", 5, "SAPO - Khởi động thành công", 64

Set WshShell = Nothing
Set fso = Nothing
