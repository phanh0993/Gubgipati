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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrinter, setNewPrinter] = useState({
    name: '',
    ip: '',
    port: '',
    driver: ''
  });

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

  const handleAddPrinter = async () => {
    if (!newPrinter.name.trim()) {
      alert('Vui lòng nhập tên máy in');
      return;
    }

    try {
      setLoading(true);
      
      // Tạo máy in mới
      const manualPrinter: DiscoveredPrinter = {
        id: `manual_${Date.now()}`,
        name: newPrinter.name.trim(),
        driver: newPrinter.driver.trim() || 'Manual Entry',
        port: newPrinter.ip && newPrinter.port ? `${newPrinter.ip}:${newPrinter.port}` : newPrinter.port || 'Manual',
        status: 'manual'
      };

      // Thêm vào danh sách máy in
      setPrinters(prev => [...prev, manualPrinter]);
      
      // Reset form
      setNewPrinter({ name: '', ip: '', port: '', driver: '' });
      setShowAddForm(false);
      
      console.log('✅ Manual printer added:', manualPrinter);
      alert('Đã thêm máy in thủ công thành công!');
      
    } catch (error: any) {
      console.error('❌ Error adding manual printer:', error);
      alert('Lỗi khi thêm máy in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePrinter = (printerId: string) => {
    if (confirm('Bạn có chắc muốn xóa máy in này?')) {
      setPrinters(prev => prev.filter(p => p.id !== printerId));
      
      // Xóa khỏi mappings nếu có
      setMappings(prev => {
        const newMappings = { ...prev };
        Object.keys(newMappings).forEach(key => {
          if (newMappings[key]?.printer_name === printers.find(p => p.id === printerId)?.name) {
            newMappings[key] = null;
          }
        });
        return newMappings;
      });
      
      console.log('✅ Printer removed:', printerId);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Quản lý máy in</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-gray-100 rounded" onClick={loadPrinters}>Quét máy in</button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => setShowAddForm(true)}>Thêm thủ công</button>
          <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu cấu hình'}</button>
        </div>
      </div>
      {error && <div className="text-red-600 mb-3">{error}</div>}

      {/* Form thêm máy in thủ công */}
      {showAddForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-3">Thêm máy in thủ công</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tên máy in *</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="VD: HP LaserJet Pro"
                value={newPrinter.name}
                onChange={(e) => setNewPrinter(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Driver</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="VD: HP Universal Printing PS"
                value={newPrinter.driver}
                onChange={(e) => setNewPrinter(prev => ({ ...prev, driver: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IP Address</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="VD: 192.168.1.100"
                value={newPrinter.ip}
                onChange={(e) => setNewPrinter(prev => ({ ...prev, ip: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Port</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="VD: 9100, USB001, LPT1"
                value={newPrinter.port}
                onChange={(e) => setNewPrinter(prev => ({ ...prev, port: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              onClick={handleAddPrinter}
              disabled={loading}
            >
              {loading ? 'Đang thêm...' : 'Thêm máy in'}
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded"
              onClick={() => {
                setShowAddForm(false);
                setNewPrinter({ name: '', ip: '', port: '', driver: '' });
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-medium mb-2">Máy in tìm thấy ({printers.length})</h2>
        <div className="border rounded">
          {printers.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {p.name}
                  {p.status === 'manual' && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Thủ công</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Driver: {p.driver || 'Unknown'} | Port: {p.port || 'Unknown'} | Status: {p.status || 'Unknown'}
                </div>
              </div>
              {p.status === 'manual' && (
                <button
                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                  onClick={() => handleRemovePrinter(p.id)}
                  title="Xóa máy in"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {printers.length === 0 && (
            <div className="p-3 text-sm text-gray-500 text-center">
              Chưa có máy in nào. 
              <br />
              Bấm "Quét máy in" để tìm máy in Windows hoặc "Thêm thủ công" để thêm từ IP/Port.
            </div>
          )}
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

