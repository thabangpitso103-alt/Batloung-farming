
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  let conn;

  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 4000,
      user: process.env.DB_USER || process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
      ssl: {
        rejectUnauthorized: false
      },
      connectTimeout: 20000
    });

    const dbName =
      process.env.DB_NAME ||
      process.env.DB_DATABASE ||
      'batloung_farm';

    for (const file of ['schema.sql', 'seed.sql']) {
      let sql = fs.readFileSync(
        path.join(__dirname, file),
        'utf8'
      );

      sql = sql.replace(/batloung_farm/g, dbName);

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
