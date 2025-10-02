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
    try {
      console.log('🖨️ Loading printer mappings from database...');
      
      // Kiểm tra bảng có tồn tại không
      const { data, error } = await supabase
        .from('printer_mappings')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Error loading mappings:', error);
        console.log('💡 Creating printer_mappings table...');
        
        // Tạo bảng nếu chưa tồn tại
        const { error: createError } = await supabase.rpc('create_printer_mappings_table');
        if (createError) {
          console.log('⚠️ Cannot create table automatically, please run CREATE_PRINTER_MAPPINGS_TABLE.sql');
        }
        
        setMappings({});
        return;
      }
      
      // Load tất cả mappings
      const { data: allData, error: loadError } = await supabase
        .from('printer_mappings')
        .select('*');
      
      if (loadError) {
        console.error('❌ Error loading all mappings:', loadError);
        setMappings({});
        return;
      }
      
      const mappingDict: Record<string, PrinterMapping | null> = {};
      GROUPS.forEach(group => {
        const mapping = allData?.find(m => m.group_key === group.key);
        mappingDict[group.key] = mapping || null;
      });
      
      setMappings(mappingDict);
      console.log('✅ Loaded mappings:', mappingDict);
    } catch (e: any) {
      console.error('❌ Error loading mappings:', e);
      setMappings({});
    }
  };

  useEffect(() => {
    loadPrinters();
    loadMappings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('🖨️ Saving printer mappings to database...');
      
      // Xóa mappings cũ
      await supabase.from('printer_mappings').delete().neq('id', 0);
      
      // Thêm mappings mới
      const mappingsToSave = Object.values(mappings).filter(Boolean) as PrinterMapping[];
      if (mappingsToSave.length > 0) {
        const { error } = await supabase
          .from('printer_mappings')
          .insert(mappingsToSave);
        
        if (error) {
          throw error;
        }
      }
      
      console.log('✅ Saved mappings:', mappingsToSave);
      alert('Đã lưu cấu hình máy in thành công!');
    } catch (e: any) {
      console.error('❌ Error saving mappings:', e);
      alert('Lỗi khi lưu cấu hình: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (groupKey: string, printerId: string) => {
    const p = printers.find((x) => x.id === printerId);
    if (!p) return;
    setMappings((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] || { group_key: groupKey }),
        printer_uri: p.name, // Dùng tên máy in làm URI
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
                <div className="text-sm text-gray-500">
                  Driver: {p.driver || 'Unknown'} | Port: {p.port || 'Unknown'} | Status: {p.status || 'Unknown'}
                </div>
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
                value={printers.find(p => p.name === mappings[g.key]?.printer_name)?.id || ''}
                onChange={(e) => handleSelect(g.key, e.target.value)}
              >
                <option value="">-- Chọn máy in --</option>
                {printers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.driver || 'Unknown Driver'})</option>
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

