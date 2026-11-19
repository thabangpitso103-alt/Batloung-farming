// Usage: npm run db:setup   -> creates the database, tables and sample data
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
    const dbName = process.env.DB_NAME || 'batloung_farm';
    for (const file of ['schema.sql', 'seed.sql']) {
      let sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      sql = sql.replace(/batloung_farm/g, dbName); // honour DB_NAME from .env
      await conn.query(sql);
      console.log(`✔ ${file} executed`);
    }
    console.log(`Database "${dbName}" is ready.`);
  } catch (err) {
    console.error('✖ Database setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.end();
  }
})();
