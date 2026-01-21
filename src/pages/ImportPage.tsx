import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  FileUpload,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import axios from 'axios';

interface ImportResult {
  message: string;
  total: number;
  success: number;
  errors: number;
  errorDetails: string[];
}

const ImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Vui lòng chọn file Excel');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/import/customers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi import file');
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
        <FileUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
        Import Khách Hàng từ Excel
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Hướng dẫn:</strong> File Excel cần có các cột sau:
          </Typography>
          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
            • <strong>Bắt buộc:</strong> Tên khách hàng, Điện thoại
            <br />
            • <strong>Tùy chọn:</strong> Email, Địa chỉ, Ngày sinh, Giới tính, Ghi chú, Mã khách hàng, 
            Công ty, Mã số thuế, Nguồn khách, Facebook, Nhóm khách hàng, Chi nhánh, Khu vực, 
            Phường/Xã, Tổng bán, Ngày giao dịch cuối, Nợ cần thu hiện tại, Số dư thẻ TK, 
            Số buổi còn lại gói DV, Trạng thái
          </Typography>
        </Alert>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              size="large"
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              Chọn File Excel
            </Button>
          </label>
          
          {file && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                File đã chọn: <strong>{file.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kích thước: {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
          )}
        </Box>

        {file && !result && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleImport}
              disabled={loading}
              startIcon={<FileUpload />}
            >
              {loading ? 'Đang import...' : 'Bắt đầu Import'}
            </Button>
            <Button
              variant="text"
              onClick={resetImport}
              sx={{ ml: 2 }}
            >
              Hủy
            </Button>
          </Box>
        )}

        {loading && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Đang xử lý file Excel và import dữ liệu...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {result && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
              Kết quả Import
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip 
                label={`Tổng: ${result.total}`} 
                color="default" 
                icon={<Info />}
              />
              <Chip 
                label={`Thành công: ${result.success}`} 
                color="success" 
                icon={<CheckCircle />}
              />
              {result.errors > 0 && (
                <Chip 
                  label={`Lỗi: ${result.errors}`} 
                  color="error" 
                  icon={<Error />}
                />
              )}
            </Box>

            <Typography variant="body1" sx={{ mb: 2 }}>
              {result.message}
            </Typography>

            {result.errorDetails && result.errorDetails.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom color="error">
                  Chi tiết lỗi:
                </Typography>
                <List dense>
                  {result.errorDetails.map((errorDetail, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={errorDetail}
                        sx={{ color: 'error.main' }}
                      />
                    </ListItem>
                  ))}
                </List>
                {result.errors > result.errorDetails.length && (
                  <Typography variant="body2" color="text.secondary">
                    ... và {result.errors - result.errorDetails.length} lỗi khác
                  </Typography>
                )}
              </>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={resetImport}
              >
                Import File Khác
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ImportPage;
