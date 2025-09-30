import React, { useEffect, useMemo, useState } from 'react';
import { printerService, DiscoveredPrinter } from '../services/printerService';
import { supabase } from '../services/supabaseClient';

type PrinterMapping = {
  id?: number;
  group_key: string; // e.g. 'bar', 'kitchen_grill', 'kitchen_fry'
  printer_uri: string;
  printer_name: string;
};

const GROUPS: { key: string; label: string }[] = [
  { key: 'bar', label: 'Quầy Bar / Nước' },
  { key: 'kitchen_grill', label: 'Bếp Nướng' },
  { key: 'kitchen_fry', label: 'Bếp Chiên' },
  { key: 'kitchen_other', label: 'Bếp Khác' },
  { key: 'invoice_main', label: 'Máy in hoá đơn tổng' }
];

const PrinterManagementPage: React.FC = () => {
  const [printers, setPrinters] = useState<DiscoveredPrinter[]>([]);
  const [mappings, setMappings] = useState<Record<string, PrinterMapping | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPrinters = async () => {
    setError('');
    try {
      const found = await printerService.discover();
      setPrinters(found);
    } catch (e: any) {
      setError(e.message || 'Không thể quét máy in. Hãy chạy printer-agent');
    }
  };

  const loadMappings = async () => {
    // Tắt hoàn toàn logic printer_mappings để tránh 404
    console.log('🖨️ Printer mappings disabled to avoid 404 errors');
    setMappings({});
  };

  useEffect(() => {
    loadPrinters();
    loadMappings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Tắt hoàn toàn logic lưu printer_mappings để tránh 404
      console.log('🖨️ Printer mappings save disabled to avoid 404 errors');
      alert('Cấu hình máy in đã được tắt để tránh lỗi 404. Sử dụng printer-agent trực tiếp.');
    } catch (e: any) {
      alert('Lỗi khi lưu cấu hình: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (groupKey: string, uri: string) => {
    const p = printers.find((x) => x.uri === uri);
    if (!p) return;
    setMappings((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] || { group_key: groupKey }),
        printer_uri: p.uri,
        printer_name: p.name
      }
    }));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Quản lý máy in</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-gray-100 rounded" onClick={loadPrinters}>Quét máy in</button>
          <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu cấu hình'}</button>
        </div>
      </div>
      {error && <div className="text-red-600 mb-3">{error}</div>}

      <div className="mb-6">
        <h2 className="font-medium mb-2">Máy in tìm thấy</h2>
        <div className="border rounded">
          {printers.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-500">{p.uri} {p.protocol === 'system' ? '(Đã cài trên Windows/macOS)' : ''}</div>
              </div>
            </div>
          ))}
          {printers.length === 0 && <div className="p-3 text-sm text-gray-500">Chưa tìm thấy máy in. Hãy chạy printer-agent.</div>}
        </div>
      </div>

      <div>
        <h2 className="font-medium mb-2">Gán máy in cho nhóm món</h2>
        <div className="space-y-3">
          {GROUPS.map((g) => (
            <div key={g.key} className="flex items-center gap-3">
              <div className="w-56">{g.label}</div>
              <select
                className="flex-1 border rounded px-2 py-2"
                value={mappings[g.key]?.printer_uri || ''}
                onChange={(e) => handleSelect(g.key, e.target.value)}
              >
                <option value="">-- Chọn máy in --</option>
                {printers.map((p) => (
                  <option key={p.id} value={p.uri}>{p.name} ({p.uri})</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrinterManagementPage;

