export type DiscoveredPrinter = {
  id: string;
  name: string;
  driver?: string;
  port?: string;
  status?: string;
};

const AGENT_BASE = ((): string => {
  // Ưu tiên biến môi trường nếu có
  if (process.env.REACT_APP_PRINTER_AGENT_URL) {
    return process.env.REACT_APP_PRINTER_AGENT_URL;
  }
  
  // Fallback: tự động detect
  const host = (typeof window !== 'undefined' && window.location) ? window.location.hostname : 'localhost';
  const protocol = (typeof window !== 'undefined' && window.location) ? window.location.protocol : 'http:';
  // Dùng cùng protocol với web app để tránh mixed-content
  return `${protocol}//${host}:9977`;
})();

export const printerService = {
  discover: async (): Promise<DiscoveredPrinter[]> => {
    try {
      console.log('🔍 Discovering printers...');
      
      // Thử dùng restaurant API trước (quét Windows trực tiếp)
      try {
        const res = await fetch('/api/printers');
        if (res.ok) {
          const printers = await res.json();
          console.log('✅ Found printers from restaurant API:', printers);
          return printers || [];
        }
      } catch (apiError) {
        console.log('⚠️ Restaurant API not available, trying agent...');
      }
      
      // Fallback: thử dùng agent
      console.log('🔍 Trying printer agent:', AGENT_BASE);
      try {
        const res = await fetch(`${AGENT_BASE}/printers`);
        if (res.ok) {
          const json = await res.json();
          console.log('✅ Found printers from agent:', json.printers);
          return json.printers || [];
        }
      } catch (agentError) {
        console.log('⚠️ Agent not available:', agentError);
      }
      
      // Fallback cuối cùng: trả về mảng rỗng
      console.log('⚠️ No printer discovery method available');
      return [];
    } catch (error) {
      console.error('❌ Printer discovery error:', error);
      // Trả về mảng rỗng thay vì throw error
      return [];
    }
  },
  
  printText: async (printerName: string, content: string, title: string = 'Restaurant Order'): Promise<void> => {
    try {
      console.log('🖨️ Printing to:', printerName);
      
      // Thử dùng restaurant API trước (in trực tiếp Windows)
      try {
        const res = await fetch('/api/printers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printerName, content, title })
        });
        
        if (res.ok) {
          console.log('✅ Print command sent via restaurant API');
          return;
        }
      } catch (apiError) {
        console.log('⚠️ Restaurant API print failed, trying agent...');
      }
      
      // Fallback: thử dùng agent
      const res = await fetch(`${AGENT_BASE}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerName, content, title })
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Print failed: ${res.status} ${errorText}`);
      }
      console.log('✅ Print command sent via agent');
    } catch (error) {
      console.error('❌ Print error:', error);
      throw error;
    }
  },
  
  // Async print - không đợi kết quả (Cách 1)
  printTextAsync: (printerName: string, content: string, title: string = 'Restaurant Order'): void => {
    printerService.printText(printerName, content, title)
      .then(() => console.log('✅ Print completed'))
      .catch(err => console.error('❌ Print failed (async):', err));
  }
};


