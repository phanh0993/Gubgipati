const { pool } = require('./supabase');

// Wrapper functions to maintain compatibility with SQLite API
const db = {
  // Execute a query that returns no results (INSERT, UPDATE, DELETE)
  run: (sql, params = [], callback) => {
    pool.query(sql, params)
      .then(result => {
        if (callback) {
          callback.call({ 
            lastID: result.rows[0]?.id || null,
            changes: result.rowCount || 0 
          }, null);
        }
      })
      .catch(err => {
        if (callback) callback(err);
      });
  },

  // Execute a query that returns a single row
  get: (sql, params = [], callback) => {
    pool.query(sql, params)
      .then(result => {
        if (callback) {
          callback(null, result.rows[0] || null);
        }
      })
      .catch(err => {
        if (callback) callback(err);
      });
  },

  // Execute a query that returns multiple rows
  all: (sql, params = [], callback) => {
    pool.query(sql, params)
      .then(result => {
        if (callback) {
          callback(null, result.rows || []);
        }
      })
      .catch(err => {
        if (callback) callback(err);
      });
  },

  // Serialize operations (not needed for PostgreSQL but kept for compatibility)
  serialize: (callback) => {
    if (callback) callback();
  },

  // Close connection
  close: (callback) => {
    pool.end().then(() => {
      if (callback) callback();
    }).catch(err => {
      if (callback) callback(err);
    });
  }
};

module.exports = db;
