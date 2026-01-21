# Printer Server Windows (In Bill qua ảnh PNG cho POS-80C)

## Cách sử dụng
1. Cài Node.js (khuyên dùng v18+ nếu muốn build lại)
2. Đảm bảo đã cắm đúng máy in qua mạng (IP: 192.168.0.3:9100)
3. Copy file printer-server.exe vào bất kỳ thư mục nào trên Windows
4. Chạy: double click hoặc `printer-server.exe` trong CMD
5. Khi có request HTTP POST tới http://localhost:9977/print/image, file ảnh bill sẽ gửi sang máy in POS IP 192.168.0.3
6. Nếu thành công/log báo 'Đã gửi tới máy in POS-80C...', kiểm tra giấy ra bill

## Troubleshooting
- Nếu không in được, kiểm tra lại IP máy in, cổng mạng
- Đảm bảo firewall không chặn cổng 9100
- Xem log trên CMD nếu có lỗi, máy in không giấy sẽ không in ra gì
- Nếu cần build lại, cài Node.js + pkg rồi chạy: npm install, npm run build

## Liên hệ developer để support khi thấy log lỗi network/socket.
