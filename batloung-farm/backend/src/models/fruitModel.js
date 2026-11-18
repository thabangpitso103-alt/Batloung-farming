const { pool } = require('../config/db');
const { PACKAGING_SIZES } = require('../utils/constants');

const priceSelect = `
  SELECT f.fruit_id, f.fruit_name, f.description, f.status,
         MAX(CASE WHEN sp.packaging_size='SMALL'  THEN sp.unit_price END) AS price_small,
         MAX(CASE WHEN sp.packaging_size='MEDIUM' THEN sp.unit_price END) AS price_medium,
         MAX(CASE WHEN sp.packaging_size='LARGE'  THEN sp.unit_price END) AS price_large
  FROM fruits f LEFT JOIN selling_prices sp ON sp.fruit_id = f.fruit_id`;

/** Registers the fruit, creates a zero-stock row for every packaging size and stores prices (one transaction). */
exports.create = async ({ fruit_name, description, status, prices }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query('INSERT INTO fruits (fruit_name, description, status) VALUES (?,?,?)',
      [fruit_name, description || null, status || 'ACTIVE']);
    const id = r.insertId;
    for (const size of PACKAGING_SIZES) {
      await conn.query('INSERT INTO stock (fruit_id, packaging_size, available_quantity) VALUES (?,?,0)', [id, size]);
    }
    await savePrices(conn, id, prices);
    await conn.commit();
    return id;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

async function savePrices(conn, fruitId, prices) {
  if (!prices) return;
  for (const size of PACKAGING_SIZES) {
    const price = prices[size.toLowerCase()];
    if (price !== undefined && price !== null) {
      await conn.query(
        `INSERT INTO selling_prices (fruit_id, packaging_size, unit_price) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE unit_price = VALUES(unit_price)`, [fruitId, size, price]);
    }
  }
}

exports.findAll = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? '' : "WHERE f.status = 'ACTIVE'";
  return (await pool.query(`${priceSelect} ${where} GROUP BY f.fruit_id ORDER BY f.fruit_name`))[0];
};
exports.findById = async (id) =>
  (await pool.query(`${priceSelect} WHERE f.fruit_id = ? GROUP BY f.fruit_id`, [id]))[0][0];

exports.update = async (id, data) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const fields = ['fruit_name', 'description', 'status'].filter((f) => data[f] !== undefined);
    if (fields.length) {
      await conn.query(`UPDATE fruits SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE fruit_id = ?`,
        [...fields.map((f) => data[f]), id]);
    }
    await savePrices(conn, id, data.prices);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
