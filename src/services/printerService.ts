export type DiscoveredPrinter = {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  uri: string;
};

const AGENT_BASE = ((): string => {
  const host = (typeof window !== 'undefined' && window.location) ? window.location.hostname : 'localhost';
  const isHttps = typeof window !== 'undefined' ? window.location.protocol === 'https:' : false;
  const protocol = isHttps ? 'https' : 'http';
  return `${protocol}://${host}:9977`;
})();

export const printerService = {
  discover: async (): Promise<DiscoveredPrinter[]> => {
    const res = await fetch(`${AGENT_BASE}/printers`);
    if (!res.ok) throw new Error(`Discover printers failed: ${res.status}`);
    const json = await res.json();
    return json.printers || [];
  },
  printText: async (printerUri: string, title: string, rawText: string): Promise<void> => {
    const res = await fetch(`${AGENT_BASE}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printerUri, title, rawText })
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Print failed: ${res.status} ${t}`);
    }
  }
};


