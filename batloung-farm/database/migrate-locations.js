require('dotenv').config();
const mysql = require('mysql2/promise');

const tables = ['suppliers', 'vendors'];
const columns = ['latitude', 'longitude'];

(async () => {
  let connection;
  try {
    const database = process.env.DB_NAME || 'batloung_farm';
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    for (const table of tables) {
      const [rows] = await connection.query(
        'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        [database, table]);
      const existing = new Set(rows.map((row) => row.COLUMN_NAME));
      for (const column of columns) {
        if (existing.has(column)) continue;
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` DECIMAL(10,7) NULL`);
        console.log(`Added ${table}.${column}`);
      }
    }

    console.log(`Location fields are ready in "${database}".`);
  } catch (error) {
    console.error('Location migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
})();
