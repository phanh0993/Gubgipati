import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';

type AlignOption = 'left' | 'center' | 'right';

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
  const [leftMargin, setLeftMargin] = useState(0);
  const [topMargin, setTopMargin] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(576); // 80mm printable width
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [headerFont, setHeaderFont] = useState(48);
  const [tableFont, setTableFont] = useState(58); // table line
  const [staffFont, setStaffFont] = useState(34);
  const [itemFont, setItemFont] = useState(44);
  const [noteFont, setNoteFont] = useState(40);
  const [align, setAlign] = useState<AlignOption>('left');
  const [printerName, setPrinterName] = useState('POS-80C');
  const [printerIp, setPrinterIp] = useState('192.168.10.3');
  const [printerPort, setPrinterPort] = useState(9100);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({ open: false, message: '', severity: 'success' });

  const [tableName, setTableName] = useState('Bàn 11');
  const [zoneName, setZoneName] = useState('Khu A');
  const [staffName, setStaffName] = useState('Lộc Phúc Anh');
  const [orderNote, setOrderNote] = useState('Không đá, ít đường');
  const [items, setItems] = useState<BillItem[]>(defaultItems);

  const previewRef = useRef<HTMLCanvasElement | null>(null);

  const templateLines = useMemo(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const lines: string[] = [];
    lines.push(`DON HANG - BEP`);
    lines.push('================================');
    lines.push(`Thoi gian: ${timeStr}`);
    lines.push(`${tableName} - ${zoneName}`);
    lines.push(`${staffName}`);
    if (orderNote) lines.push(`Ghi chú: ${orderNote}`);
    lines.push('================================');
    for (const it of items) {
      lines.push(`${it.name} - x${it.quantity}`);
      if (it.note) lines.push(`Note: ${it.note}`);
    }
    lines.push('================================');
    return lines;
  }, [tableName, zoneName, staffName, orderNote, items]);

  const drawPreview = () => {
    const canvas = previewRef.current;
    if (!canvas) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    let y = topMargin;
    const lineHeight = Math.max(56, Math.round(itemFont * 1.25));

    for (const line of templateLines) {
      let fontToUse = headerFont;
      if (line.includes('===')) fontToUse = headerFont;
      else if (line.startsWith('Thoi gian:')) fontToUse = headerFont;
      else if (line === staffName) fontToUse = staffFont;
      else if (line.startsWith('Note:')) fontToUse = noteFont;
      else if (line.includes(' - ') && line.includes('x')) fontToUse = itemFont;
      else if (line.includes(' - ') && !line.includes('x')) fontToUse = tableFont;

      ctx.font = `bold ${fontToUse}px "Courier New", monospace`;
      ctx.textAlign = align;

      let x = leftMargin;
      if (align === 'center') x = Math.round(canvas.width / 2);
      if (align === 'right') x = canvas.width - leftMargin;

      ctx.fillText(line, x, y);
      y += lineHeight;
      if (y > canvas.height - lineHeight) break;
    }
  };

  const handlePrint = async () => {
    try {
      // Draw latest preview first
      drawPreview();
      const canvas = previewRef.current;
      if (!canvas) throw new Error('Canvas not ready');
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve as BlobCallback, 'image/png'));
      if (!blob) throw new Error('Failed to create image blob');
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const image_base64 = `data:image/png;base64,${base64}`;

      const payload = {
        printer_name: printerName,
        image_base64,
        filename: `test_printer_${Date.now()}.png`,
        meta: {
          leftMargin,
          topMargin,
          canvasWidth,
          canvasHeight,
          headerFont,
          tableFont,
          staffFont,
          itemFont,
          noteFont,
          align,
          tableName,
          zoneName,
          staffName,
          orderNote,
          items,
        },
      };

      // Log chi tiết payload gửi đi
      console.log('🖨️ TestPrinter payload:', payload);

      const windowsServerUrl = 'http://localhost:9977/print/image';
      const resp = await fetch(windowsServerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('🔍 Windows server response status:', resp.status, resp.ok);
      const text = await resp.text();
      console.log('🔍 Windows server response body:', text);

      if (!resp.ok) throw new Error(`Windows server error: ${resp.status} ${text}`);
      setSnackbar({ open: true, severity: 'success', message: 'Đã gửi lệnh in thành công' });
    } catch (err: any) {
      console.error('❌ Print error:', err);
      setSnackbar({ open: true, severity: 'error', message: err?.message || 'Lỗi in' });
    }
  };

  const handleTestInvoice = async () => {
    try {
      console.log('🧪 Testing Invoice with ESC/POS RAW...');
      
      // Tạo hóa đơn test
      const testInvoice = {
        printer_ip: printerIp,
        port: printerPort,
        orderData: {
          order_number: 'TEST-001',
          table_name: tableName,
          zone_name: zoneName,
          staff_name: staffName,
          checkin_time: new Date().toLocaleString('vi-VN'),
          notes: orderNote
        },
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          notes: item.notes || ''
        }))
      };
      
      console.log('📤 Invoice payload:', testInvoice);
      
      const response = await fetch('http://localhost:9978/test/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testInvoice)
      });
      
      const result = await response.json();
      console.log('🔍 Invoice server response status:', response.status, response.ok);
      console.log('🔍 Invoice server response:', result);
      
      if (result.success) {
        setSnackbar({ open: true, message: 'Invoice printed successfully!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: `Invoice error: ${result.error}`, severity: 'error' });
      }
    } catch (error) {
      console.error('❌ Invoice error:', error);
      setSnackbar({ open: true, message: 'Invoice test failed', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test Printer (Ảnh 80mm + Cấu hình lề)
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cấu hình ảnh & lề
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="Canvas width (px)" type="number" fullWidth value={canvasWidth} onChange={(e) => setCanvasWidth(parseInt(e.target.value || '0'))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Canvas height (px)" type="number" fullWidth value={canvasHeight} onChange={(e) => setCanvasHeight(parseInt(e.target.value || '0'))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Left margin (px)" type="number" fullWidth value={leftMargin} onChange={(e) => setLeftMargin(parseInt(e.target.value || '0'))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Top margin (px)" type="number" fullWidth value={topMargin} onChange={(e) => setTopMargin(parseInt(e.target.value || '0'))} />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Căn chữ</InputLabel>
                    <Select
                      label="Căn chữ"
                      value={align}
                      onChange={(e) => setAlign(e.target.value as AlignOption)}
                    >
                      <MenuItem value="left">Trái</MenuItem>
                      <MenuItem value="center">Giữa</MenuItem>
                      <MenuItem value="right">Phải</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}><TextField label="Header font" type="number" fullWidth value={headerFont} onChange={(e) => setHeaderFont(parseInt(e.target.value || '0'))} /></Grid>
                <Grid item xs={6}><TextField label="Table font" type="number" fullWidth value={tableFont} onChange={(e) => setTableFont(parseInt(e.target.value || '0'))} /></Grid>
                <Grid item xs={6}><TextField label="Staff font" type="number" fullWidth value={staffFont} onChange={(e) => setStaffFont(parseInt(e.target.value || '0'))} /></Grid>
                <Grid item xs={6}><TextField label="Item font" type="number" fullWidth value={itemFont} onChange={(e) => setItemFont(parseInt(e.target.value || '0'))} /></Grid>
                <Grid item xs={12}><TextField label="Note font" type="number" fullWidth value={noteFont} onChange={(e) => setNoteFont(parseInt(e.target.value || '0'))} /></Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12}><TextField label="Tên máy in (Windows)" fullWidth value={printerName} onChange={(e) => setPrinterName(e.target.value)} /></Grid>
                
                <Grid item xs={12}><Divider /></Grid>
                
                <Grid item xs={8}><TextField label="Printer IP" fullWidth value={printerIp} onChange={(e) => setPrinterIp(e.target.value)} /></Grid>
                <Grid item xs={4}><TextField label="Port" type="number" fullWidth value={printerPort} onChange={(e) => setPrinterPort(parseInt(e.target.value || '9100'))} /></Grid>

                <Grid item xs={6}><TextField label="Bàn" fullWidth value={tableName} onChange={(e) => setTableName(e.target.value)} /></Grid>
                <Grid item xs={6}><TextField label="Khu" fullWidth value={zoneName} onChange={(e) => setZoneName(e.target.value)} /></Grid>
                <Grid item xs={12}><TextField label="Nhân viên" fullWidth value={staffName} onChange={(e) => setStaffName(e.target.value)} /></Grid>
                <Grid item xs={12}><TextField label="Ghi chú đơn" fullWidth value={orderNote} onChange={(e) => setOrderNote(e.target.value)} /></Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    Console sẽ in đầy đủ template lines và JSON payload gửi tới Windows server.
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Test Methods:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" onClick={drawPreview}>Preview</Button>
                    <Button variant="contained" onClick={handlePrint}>In ảnh (MSPaint)</Button>
                    <Button variant="contained" color="success" onClick={handleTestInvoice}>In hóa đơn (ESC/POS RAW)</Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info">
                    <strong>Phương pháp in:</strong><br/>
                    1. "In ảnh" = MSPaint (có thể có lề driver)<br/>
                    2. "In hóa đơn" = ESC/POS RAW (không lề, in trực tiếp)<br/>
                    <br/>
                    <strong>Yêu cầu:</strong> Chạy ESC/POS server: <code>escpos-test-server-v2.exe</code>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview (Canvas {canvasWidth}x{canvasHeight})
              </Typography>
              <Box sx={{ overflow: 'auto', border: '1px dashed #ccc', p: 2, display: 'inline-block', background: '#f9f9f9' }}>
                <canvas ref={previewRef} style={{ imageRendering: 'pixelated' }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Template lines:</Typography>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>{templateLines.join('\n')}</pre>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TestPrinterPage;


