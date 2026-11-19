const { pool } = require('../config/db');

const COLS = 'vendor_id, vendor_name, phone_number, location, registration_date, latitude, longitude';

exports.create = async (v) => {
  const [r] = await pool.query(
    'INSERT INTO vendors (vendor_name, phone_number, location, registration_date, latitude, longitude) VALUES (?,?,?,COALESCE(?, CURDATE()),?,?)',
    [v.vendor_name, v.phone_number, v.location, v.registration_date || null, v.latitude ?? null, v.longitude ?? null]);
  return r.insertId;
};
exports.findAll = async (search) => {
  if (search) {
    const like = `%${search}%`;
    return (await pool.query(`SELECT ${COLS} FROM vendors WHERE vendor_name LIKE ? OR phone_number LIKE ? ORDER BY vendor_name`, [like, like]))[0];
  }
  return (await pool.query(`SELECT ${COLS} FROM vendors ORDER BY vendor_name`))[0];
};
exports.findById = async (id) => (await pool.query(`SELECT ${COLS} FROM vendors WHERE vendor_id = ?`, [id]))[0][0];
exports.update = async (id, v) => {
  const fields = ['vendor_name', 'phone_number', 'location', 'registration_date', 'latitude', 'longitude'].filter((f) => v[f] !== undefined);
  if (!fields.length) return 0;
  const [r] = await pool.query(`UPDATE vendors SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE vendor_id = ?`,
    [...fields.map((f) => v[f]), id]);
  return r.affectedRows;
};

/** Outstanding balance per vendor (only vendors that owe money). */
exports.outstandingBalances = async () => (await pool.query(`
  SELECT v.vendor_id, v.vendor_name, v.phone_number,
         COUNT(s.sale_id) AS unsettled_sales,
         SUM(s.total_amount) AS total_billed,
         SUM(s.amount_paid)  AS total_paid,
         SUM(s.total_amount - s.amount_paid) AS outstanding_balance
  FROM vendors v JOIN sales s ON s.vendor_id = v.vendor_id AND s.payment_status <> 'PAID'
  GROUP BY v.vendor_id, v.vendor_name, v.phone_number
  ORDER BY outstanding_balance DESC`))[0];

exports.balance = async (id) => {
  const [[totals]] = await pool.query(`
    SELECT COALESCE(SUM(total_amount),0) AS total_billed, COALESCE(SUM(amount_paid),0) AS total_paid,
           COALESCE(SUM(total_amount - amount_paid),0) AS outstanding_balance
    FROM sales WHERE vendor_id = ?`, [id]);
  const [unpaid] = await pool.query(`
    SELECT sale_id, sale_date, payment_status, total_amount, amount_paid, (total_amount - amount_paid) AS balance
    FROM sales WHERE vendor_id = ? AND payment_status <> 'PAID' ORDER BY sale_date`, [id]);
  return { ...totals, unpaid_sales: unpaid };
};
