const mysql = require('mysql2/promise');
require('dotenv').config();

// Credentials come ONLY from the .env file / environment variables.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'batloung_farm',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  connectTimeout: 10000,
  decimalNumbers: true,   // DECIMAL columns come back as numbers, not strings
  dateStrings: true,      // DATE/DATETIME come back as plain strings
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

/** Never throws - returns { ok, message } so the server keeps running if MySQL is down. */
async function checkConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return { ok: true, message: 'Connected to MySQL' };
  } catch (err) {
    return { ok: false, message: describeDbError(err) };
  }
}

function describeDbError(err) {
  switch (err.code) {
    case 'ECONNREFUSED': return 'MySQL refused the connection. Is the MySQL server running and are DB_HOST / DB_PORT correct?';
    case 'ER_ACCESS_DENIED_ERROR': return 'MySQL rejected the username or password. Check DB_USER and DB_PASSWORD in .env.';
    case 'ER_BAD_DB_ERROR': return 'Database not found. Run "npm run db:setup" to create it.';
    case 'ENOTFOUND': return 'MySQL host not found. Check DB_HOST in .env.';
    case 'ETIMEDOUT': return 'Connection to MySQL timed out.';
    case 'PROTOCOL_CONNECTION_LOST': return 'The MySQL connection was lost.';
    default: return `Database error: ${err.message}`;
  }
}

module.exports = { pool, checkConnection, describeDbError };
