const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = process.env.NODE_ENV === 'test' 
  ? process.env.TEST_DB_PATH || path.join(__dirname, '../database/test.db')
  : process.env.DB_PATH || path.join(__dirname, '../database/railway.db');

let dbInstance = null;

/**
 * 获取数据库实例
 */
function getDatabase() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
      }
    });
  }
  return dbInstance;
}

/**
 * 执行查询（返回多行）
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 * @returns {Promise<Array>} 查询结果
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * 执行查询（返回单行）
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 * @returns {Promise<Object|null>} 查询结果
 */
function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

/**
 * 执行更新/插入/删除操作
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 * @returns {Promise<Object>} 包含lastID和changes的对象
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
}

/**
 * 关闭数据库连接
 */
function close() {
  if (dbInstance) {
    dbInstance.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err.message);
      }
      dbInstance = null;
    });
  }
}

module.exports = {
  getDatabase,
  query,
  queryOne,
  run,
  close
};
