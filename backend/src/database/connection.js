const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/database.sqlite');
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.initializeTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async disconnect() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getConnection() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  // 清理验证码表（用于测试）
  async clearVerificationCodes() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.run('DELETE FROM verification_codes', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async initializeTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE,
          phone VARCHAR(11) UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          id_card_last4 VARCHAR(4),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login_time DATETIME,
          login_ip VARCHAR(45),
          user_agent TEXT
        )
      `;

      const createVerificationCodesTable = `
        CREATE TABLE IF NOT EXISTS verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          code VARCHAR(6) NOT NULL,
          purpose VARCHAR(20) DEFAULT 'login',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `;

      const insertTestUsers = `
        INSERT OR IGNORE INTO users (username, email, phone, password_hash, id_card_last4) VALUES
        ('testuser', 'test@example.com', '13800138000', 'password123', '1234'),
        ('user2', 'user2@example.com', '13800138001', 'password123', '5678'),
        ('user3', 'user3@example.com', '13800138002', 'password123', '9012')
      `;

      this.db.serialize(() => {
        this.db.run(createUsersTable, (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            reject(err);
            return;
          }
        });

        this.db.run(createVerificationCodesTable, (err) => {
          if (err) {
            console.error('Error creating verification_codes table:', err);
            reject(err);
            return;
          }
        });

        this.db.run(insertTestUsers, (err) => {
          if (err) {
            console.error('Error inserting test users:', err);
          } else {
            console.log('Test users inserted successfully');
          }
          resolve();
        });
      });
    });
  }
}

module.exports = DatabaseConnection;