const db = require('../database');

// Add new fields to customers table for import functionality
function addCustomerFields() {
  const newColumns = [
    'customer_code TEXT',
    'company TEXT',
    'tax_code TEXT',
    'source TEXT',
    'facebook TEXT',
    'customer_group TEXT',
    'branch TEXT',
    'area TEXT',
    'ward TEXT',
    'last_transaction DATE',
    'debt_amount DECIMAL(12,2) DEFAULT 0',
    'card_balance DECIMAL(12,2) DEFAULT 0',
    'service_sessions INTEGER DEFAULT 0',
    'status TEXT DEFAULT "active"',
    'customer_type TEXT',
    'created_by TEXT',
    'created_date DATE'
  ];

  newColumns.forEach(column => {
    const columnName = column.split(' ')[0];
    
    // Check if column exists
    db.all("PRAGMA table_info(customers)", (err, columns) => {
      if (err) {
        console.error('Error checking table info:', err);
        return;
      }
      
      const existingColumn = columns.find(col => col.name === columnName);
      if (!existingColumn) {
        db.run(`ALTER TABLE customers ADD COLUMN ${column}`, (err) => {
          if (err) {
            console.error(`Error adding column ${columnName}:`, err);
          } else {
            console.log(`Added column ${columnName} to customers table`);
          }
        });
      }
    });
  });
}

module.exports = { addCustomerFields };
