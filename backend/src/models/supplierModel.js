const { pool } = require('../config/db');

const COLS = 'supplier_id, business_name, contact_person, phone, province, address, latitude, longitude';

exports.create = async (s) => {
  const [r] = await pool.query(
    'INSERT INTO suppliers (business_name, contact_person, phone, province, address, latitude, longitude) VALUES (?,?,?,?,?,?,?)',
    [s.business_name, s.contact_person, s.phone, s.province, s.address, s.latitude ?? null, s.longitude ?? null]);
  return r.insertId;
};
exports.findAll = async () => (await pool.query(`SELECT ${COLS} FROM suppliers ORDER BY business_name`))[0];
exports.findById = async (id) => (await pool.query(`SELECT ${COLS} FROM suppliers WHERE supplier_id = ?`, [id]))[0][0];
exports.update = async (id, s) => {
  const fields = ['business_name', 'contact_person', 'phone', 'province', 'address', 'latitude', 'longitude'].filter((f) => s[f] !== undefined);
  if (!fields.length) return 0;
  const [r] = await pool.query(`UPDATE suppliers SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE supplier_id = ?`,
    [...fields.map((f) => s[f]), id]);
  return r.affectedRows;
};
exports.countPurchases = async (id) =>
  (await pool.query('SELECT COUNT(*) AS n FROM purchases WHERE supplier_id = ?', [id]))[0][0].n;
exports.remove = async (id) => (await pool.query('DELETE FROM suppliers WHERE supplier_id = ?', [id]))[0].affectedRows;
