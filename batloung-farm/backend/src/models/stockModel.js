const { pool } = require('../config/db');

const BASE = `
  SELECT st.stock_id, f.fruit_id, f.fruit_name, st.packaging_size, st.available_quantity
  FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id`;
const ORDER = "ORDER BY f.fruit_name, FIELD(st.packaging_size,'SMALL','MEDIUM','LARGE')";

exports.findAll = async () => (await pool.query(`${BASE} ${ORDER}`))[0];
exports.findByFruit = async (fruitId) => (await pool.query(`${BASE} WHERE f.fruit_id = ? ${ORDER}`, [fruitId]))[0];
exports.findLow = async (threshold) =>
  (await pool.query(`${BASE} WHERE st.available_quantity <= ? AND f.status = 'ACTIVE' ORDER BY st.available_quantity, f.fruit_name`, [threshold]))[0];
