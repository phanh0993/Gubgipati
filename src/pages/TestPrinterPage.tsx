import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';

interface BillItem {
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

const defaultItems: BillItem[] = [
  { name: 'Vú heo nướng', quantity: 2, price: 0, note: 'nướng chín' },
  { name: 'Soju + Tiger', quantity: 1, price: 95000 },
  { name: 'Khoai tây chiên', quantity: 1, price: 35000 },
];

const TestPrinterPage: React.FC = () => {
  const [canvasWidth, setCanvasWidth] = useState(576);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [printerName, setPrinterName] = useState('POS-80C');
  const [tableName, setTableName] = useState('Bàn 11');
  const [zoneName, setZoneName] = useState('Khu A');
  const [staffName, setStaffName] = useState('Lộc Phúc Anh');
  const [orderNote, setOrderNote] = useState('Không đá, ít đường');
  const [items, setItems] = useState([{ name: 'Vú heo nướng', quantity: 2, price: 0, note: 'nướng chín' }, { name: 'Soju + Tiger', quantity: 1, price: 95000 }, { name: 'Khoai tây chiên', quantity: 1, price: 35000 }]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  // Render template dòng bill
  const templateLines = useMemo(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const lines: string[] = [];
    lines.push(`HOÁ ĐƠN MẪU`);
    lines.push('==============================');
    lines.push(`Thời gian: ${timeStr}`);
    lines.push(`${tableName} - ${zoneName}`);
    lines.push(`${staffName}`);
    if (orderNote) lines.push(`Ghi chú: ${orderNote}`);
    lines.push('==============================');
    for (const it of items) {
      lines.push(`${it.name} - x${it.quantity}`);
      if (it.note) lines.push(`Note: ${it.note}`);
    }
    lines.push('==============================');
    return lines;
  }, [tableName, zoneName, staffName, orderNote, items]);

  // Vẽ bill lên canvas
  const drawBillImage = () => {
    const canvas = previewRef.current;
    if (!canvas) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background trắng
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Chữ đen
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = 'bold 38px "Courier New", monospace';
    
    // Vẽ từng dòng
    let y = 24;
    const lineHeight = 48;
    for (const line of templateLines) {
      ctx.fillText(line, 16, y);
      y += lineHeight;
      if (y > canvas.height - lineHeight) break;
    }
  };

  // Auto preview khi dữ liệu thay đổi
  useEffect(() => {
    drawBillImage();
  }, [templateLines, canvasWidth, canvasHeight]);

  // Nút tải ảnh bill (download PNG)
  const handleDownload = () => {
    drawBillImage();
    const canvas = previewRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `bill_${Date.now()}.png`;
    link.click();
    setSnackbar({ open: true, message: 'Đã tải ảnh bill', severity: 'success' });
  };

  // Nút gửi in (gửi ảnh sang server printer exe)
  const handlePrint = async () => {
    try {
      drawBillImage();
      const canvas = previewRef.current;
      if (!canvas) throw new Error('Không tìm thấy canvas bill');
      
      // Chuyển canvas thành blob PNG
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve as BlobCallback, 'image/png'));
      if (!blob) throw new Error('Không thể tạo ảnh bill');
      
      // Convert blob sang base64
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const image_base64 = `data:image/png;base64,${base64}`;

      // Payload gửi tới server
      const payload = {
        printer_name: printerName,
        image_base64,
        filename: `bill_${Date.now()}.png`,
        meta: { tableName, zoneName, staffName, orderNote, items }
      };
      
      console.log('📤 Gửi lệnh in tới server...');
      const resp = await fetch('http://localhost:9000/print/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await resp.json();
      
      if (!resp.ok) {
        throw new Error(result.message || 'In bill không thành công');
      }
      
      console.log('✅ Kết quả in:', result);
      setSnackbar({ 
        open: true, 
        message: result.message || 'Đã gửi lệnh in bill thành công!', 
        severity: 'success' 
      });
    } catch (err: any) {
      console.error('❌ Lỗi in bill:', err);
      setSnackbar({ 
        open: true, 
        message: err?.message || 'Lỗi kết nối server in. Hãy kiểm tra server đã chạy chưa.', 
        severity: 'error' 
      });
    }
  };

  return (
    <Box className="p-6 max-w-4xl mx-auto">
      <Typography variant="h4" className="mb-6 font-bold">In Bill - Phương án Duy nhất</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Card className="shadow">
            <CardContent>
              <div className="flex flex-col gap-3 mb-3">
                <TextField label="Tên máy in (Windows)" fullWidth value={printerName} onChange={(e) => setPrinterName(e.target.value)} />
                <TextField label="Bàn" fullWidth value={tableName} onChange={(e) => setTableName(e.target.value)} />
                <TextField label="Khu" fullWidth value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
                <TextField label="Nhân viên" fullWidth value={staffName} onChange={(e) => setStaffName(e.target.value)} />
                <TextField label="Ghi chú đơn" fullWidth value={orderNote} onChange={(e) => setOrderNote(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="contained" color="primary" onClick={handleDownload}>Tải ảnh bill</Button>
                <Button variant="contained" color="secondary" onClick={handlePrint}>In bill qua server</Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card className="shadow">
            <CardContent>
              <Typography variant="h6" className="mb-2">Preview Bill</Typography>
              <Box className="overflow-auto border border-dashed p-4 bg-gray-50" aria-label="Preview hóa đơn">
                <canvas ref={previewRef} width={canvasWidth} height={canvasHeight} tabIndex={0} aria-label="Canvas hóa đơn" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TestPrinterPage;


