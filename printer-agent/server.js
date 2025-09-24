const express = require('express');
const cors = require('cors');
const bonjour = require('bonjour-service')();
const ipp = require('ipp');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// In-memory printer cache
let printers = [];

const discoverPrinters = async () => {
  printers = [];
  // mDNS/Bonjour IPP
  bonjour.find({ type: 'ipp' }, (service) => {
    const host = service?.addresses?.[0];
    const port = service?.port || 631;
    const name = service?.name || 'IPP Printer';
    if (host) {
      const uri = `ipp://${host}:${port}${service?.txt?.rp ? '/' + service.txt.rp : ''}`;
      printers.push({ id: uri, name, host, port, protocol: 'ipp', uri });
    }
  });
  // Also check IPPS
  bonjour.find({ type: 'ipps' }, (service) => {
    const host = service?.addresses?.[0];
    const port = service?.port || 631;
    const name = service?.name || 'IPPS Printer';
    if (host) {
      const uri = `ipps://${host}:${port}${service?.txt?.rp ? '/' + service.txt.rp : ''}`;
      printers.push({ id: uri, name, host, port, protocol: 'ipps', uri });
    }
  });
};

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/printers', async (_, res) => {
  await discoverPrinters();
  // Deduplicate by id
  const map = new Map();
  for (const p of printers) {
    map.set(p.id, p);
  }
  res.json({ printers: Array.from(map.values()) });
});

// Simple IPP text print
app.post('/print', async (req, res) => {
  try {
    const { printerUri, title, rawText } = req.body || {};
    if (!printerUri || !rawText) {
      return res.status(400).json({ error: 'printerUri and rawText are required' });
    }
    const printer = ipp.Printer(printerUri);
    const msg = {
      'operation-attributes-tag': {
        'requesting-user-name': 'pos',
        'job-name': title || 'POS Job',
        'document-format': 'text/plain'
      },
      data: Buffer.from(rawText, 'utf-8')
    };
    printer.execute('Print-Job', msg, function (err, resp) {
      if (err) {
        console.error('IPP print error:', err);
        return res.status(500).json({ error: String(err) });
      }
      return res.json({ ok: true, response: resp });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PRINTER_AGENT_PORT || 9977;
app.listen(PORT, () => {
  console.log(`Printer agent listening on http://localhost:${PORT}`);
});


