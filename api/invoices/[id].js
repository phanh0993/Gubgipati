const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'july-spa-secret');

    const dbPool = getPool();
    const client = await dbPool.connect();

    try {
      if (req.method === 'GET') {
        const invoiceId = parseInt(req.query.id);
        
        console.log('🔍 Getting invoice details for ID:', invoiceId);
        
        if (!invoiceId || isNaN(invoiceId)) {
          return res.status(400).json({ error: 'Invalid invoice ID' });
        }
        
        // Get specific invoice with details
        const invoiceQuery = `
          SELECT i.*, 
                 c.fullname as customer_name, c.phone as customer_phone, c.email as customer_email,
                 COALESCE(e.fullname, e.employee_code) as employee_name
          FROM invoices i
          LEFT JOIN customers c ON i.customer_id = c.id
          LEFT JOIN employees e ON i.employee_id = e.id
          WHERE i.id = $1
        `;
        
        const invoiceResult = await client.query(invoiceQuery, [invoiceId]);
        
        if (invoiceResult.rows.length === 0) {
          return res.status(404).json({ error: 'Invoice not found' });
        }
        
        const invoice = invoiceResult.rows[0];
        
        // Get invoice items with employee and service details
        const itemsQuery = `
          SELECT ii.*, 
                 s.name as service_name, s.description as service_description,
                 COALESCE(e.fullname, e.employee_code) as employee_name,
                 s.commission_rate,
                 ii.unit_price * ii.quantity as total_price,
                 ii.unit_price * ii.quantity * COALESCE(s.commission_rate, 0) / 100 as commission_amount
          FROM invoice_items ii
          LEFT JOIN services s ON ii.service_id = s.id
          LEFT JOIN employees e ON ii.employee_id = e.id
          WHERE ii.invoice_id = $1
          ORDER BY ii.id
        `;
        
        const itemsResult = await client.query(itemsQuery, [invoiceId]);
        
        console.log('📊 Invoice details:', {
          invoiceId,
          invoice: invoice.invoice_number,
          itemsCount: itemsResult.rows.length,
          items: itemsResult.rows
        });
        
        return res.json({
          invoice: invoice,
          items: itemsResult.rows
        });

      } else if (req.method === 'DELETE') {
        const invoiceId = parseInt(req.query.id);
        
        console.log('🗑️ Deleting invoice ID:', invoiceId);
        
        if (!invoiceId || isNaN(invoiceId)) {
          return res.status(400).json({ error: 'Invalid invoice ID' });
        }
        
        // Start transaction for cascading delete
        await client.query('BEGIN');
        
        try {
          // First, delete all invoice items (child records)
          const deleteItemsResult = await client.query(
            'DELETE FROM invoice_items WHERE invoice_id = $1',
            [invoiceId]
          );
          
          console.log(`📦 Deleted ${deleteItemsResult.rowCount} invoice items`);
          
          // Then, delete the invoice (parent record)
          const deleteInvoiceResult = await client.query(
            'DELETE FROM invoices WHERE id = $1 RETURNING *',
            [invoiceId]
          );
          
          if (deleteInvoiceResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invoice not found' });
          }
          
          const deletedInvoice = deleteInvoiceResult.rows[0];
          
          await client.query('COMMIT');
          
          console.log('✅ Invoice deleted successfully:', {
            invoiceId,
            invoiceNumber: deletedInvoice.invoice_number,
            itemsDeleted: deleteItemsResult.rowCount
          });
          
          return res.json({
            message: 'Invoice deleted successfully',
            deletedInvoice: deletedInvoice,
            itemsDeleted: deleteItemsResult.rowCount
          });
          
        } catch (deleteError) {
          await client.query('ROLLBACK');
          console.error('Delete transaction error:', deleteError);
          throw deleteError;
        }

      } else if (req.method === 'PUT') {
        const invoiceId = parseInt(req.query.id);
        const updateData = req.body;
        
        console.log('✏️ Updating invoice ID:', invoiceId, 'with data:', updateData);
        
        if (!invoiceId || isNaN(invoiceId)) {
          return res.status(400).json({ error: 'Invalid invoice ID' });
        }
        
        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (updateData.payment_status) {
          updateFields.push(`payment_status = $${paramIndex}`);
          updateValues.push(updateData.payment_status);
          paramIndex++;
        }
        
        if (updateData.payment_method) {
          updateFields.push(`payment_method = $${paramIndex}`);
          updateValues.push(updateData.payment_method);
          paramIndex++;
        }
        
        if (updateData.notes !== undefined) {
          updateFields.push(`notes = $${paramIndex}`);
          updateValues.push(updateData.notes);
          paramIndex++;
        }
        
        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }
        
        // Add updated_at and invoice ID
        updateFields.push(`updated_at = NOW()`);
        updateValues.push(invoiceId);
        
        const updateQuery = `
          UPDATE invoices 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Invoice not found' });
        }
        
        console.log('✅ Invoice updated successfully:', updateResult.rows[0]);
        
        return res.json({
          message: 'Invoice updated successfully',
          invoice: updateResult.rows[0]
        });

      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Invoice details API error:', error);
    res.status(500).json({ error: 'Invoice details API failed: ' + error.message });
  }
};
