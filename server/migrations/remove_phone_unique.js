const db = require('../database');

// Remove UNIQUE constraint from phone column
function removePhoneUnique() {
  console.log('Removing UNIQUE constraint from phone column...');
  
  // SQLite doesn't support dropping constraints directly
  // We need to recreate the table without the UNIQUE constraint
  db.serialize(() => {
    // Create new table without UNIQUE constraint on phone
    db.run(`
      CREATE TABLE IF NOT EXISTS customers_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        birthday DATE,
        gender TEXT,
        notes TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent DECIMAL(12,2) DEFAULT 0,
        last_visit DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        customer_code TEXT,
        company TEXT,
        tax_code TEXT,
        source TEXT,
        facebook TEXT,
        customer_group TEXT,
        branch TEXT,
        area TEXT,
        ward TEXT,
        last_transaction DATE,
        debt_amount DECIMAL(12,2) DEFAULT 0,
        card_balance DECIMAL(12,2) DEFAULT 0,
        service_sessions INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        customer_type TEXT,
        created_by TEXT,
        created_date DATE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating new customers table:', err);
        return;
      }

      // Copy data from old table to new table
      db.run(`
        INSERT INTO customers_new 
        SELECT id, fullname, phone, email, address, birthday, gender, notes,
               loyalty_points, total_spent, last_visit, created_at, updated_at,
               customer_code, company, tax_code, source, facebook, customer_group,
               branch, area, ward, last_transaction, debt_amount, card_balance,
               service_sessions, status, customer_type, created_by, created_date
        FROM customers
      `, (err) => {
        if (err) {
          console.error('Error copying data:', err);
          return;
        }

        // Drop old table
        db.run('DROP TABLE customers', (err) => {
          if (err) {
            console.error('Error dropping old table:', err);
            return;
          }

          // Rename new table to original name
          db.run('ALTER TABLE customers_new RENAME TO customers', (err) => {
            if (err) {
              console.error('Error renaming table:', err);
            } else {
              console.log('Successfully removed UNIQUE constraint from phone column');
            }
          });
        });
      });
    });
  });
}

module.exports = { removePhoneUnique };
