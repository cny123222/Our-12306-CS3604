const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../railway.db');

console.log('\n🚀 Starting addresses table migration...\n');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully');
    createAddressesTable();
  }
});

function createAddressesTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      recipient TEXT NOT NULL,
      phone TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      street TEXT NOT NULL,
      surrounding TEXT,
      detail_address TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('❌ Failed to create addresses table:', err);
      process.exit(1);
    } else {
      console.log('✅ Addresses table created successfully');
      
      // Verify table creation
      db.all("PRAGMA table_info(addresses)", (err, rows) => {
        if (err) {
          console.error('❌ Failed to verify table info:', err);
        } else {
          console.log('\n📋 Table Structure:');
          console.table(rows);
        }
        db.close();
      });
    }
  });
}
