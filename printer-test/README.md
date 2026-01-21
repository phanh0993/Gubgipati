# PRINTER TEST TOOL

Thư mục này chứa các công cụ để test kết nối máy in.

## Danh sách máy in

1. **BEP NONG**
   - IP: 192.168.1.235:9100
   - Vị trí: Bếp nóng
   - Loại: Network Printer (IP)
   - Trạng thái: ✅ Hoạt động

2. **BEP THIT**
   - IP: 192.168.1.236:9100
   - Vị trí: Bếp thịt
   - Loại: Network Printer (IP)
   - Trạng thái: ✅ Hoạt động

3. **QUAY BARR**
   - IP: 192.168.1.234:9100
   - Vị trí: Quầy Bar
   - Loại: Network Printer (IP)
   - Trạng thái: ✅ Hoạt động

**Tất cả 3 máy in đã kết nối thành công và sẵn sàng sử dụng!**

## Cách sử dụng

### Test kết nối máy in

```bash
node test-printers.js
```

Script này sẽ:
- Lấy danh sách máy in từ database
- Test kết nối TCP tới từng máy in
- Hiển thị kết quả thành công/thất bại

### File cấu hình

- `printers-list.json`: Danh sách máy in dạng JSON
- `test-printers.js`: Script test kết nối

## Yêu cầu

1. Máy in phải được bật và kết nối mạng
2. IP address phải đúng
3. Port 9100 phải mở (raw printing port)
4. PC và máy in phải cùng mạng LAN
5. Firewall không chặn port 9100

## Kiểm tra thủ công

### Ping máy in
```bash
ping 192.168.1.235
ping 192.168.1.236
ping 192.168.2.234
```

### Test port 9100
```bash
telnet 192.168.1.235 9100
```

Nếu kết nối được (không báo lỗi) thì port đã mở.

## Lưu ý

- Server printer (`windows-printer-server/printer-server.js`) tự động lấy danh sách máy in từ database
- Không cần cài driver Windows cho máy in network
- Máy in sử dụng giao thức raw printing (ESC/POS) qua TCP port 9100

