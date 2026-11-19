const { pool } = require('../config/db');
const { outstanding } = require('../utils/calculations');

exports.findAll = async ({ vendorId, status } = {}) => {
  const where = []; const params = [];
  if (vendorId) { where.push('s.vendor_id = ?'); params.push(vendorId); }
  if (status) { where.push('s.payment_status = ?'); params.push(status); }
  const [rows] = await pool.query(`
    SELECT s.sale_id, s.vendor_id, v.vendor_name, s.sale_date, s.payment_method, s.payment_status,
           s.total_amount, s.amount_paid, (s.total_amount - s.amount_paid) AS outstanding_balance
    FROM sales s JOIN vendors v ON v.vendor_id = s.vendor_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY s.sale_date DESC, s.sale_id DESC`, params);
  return rows;
};

exports.findById = async (id, conn = pool) => {
  const [[header]] = await conn.query(`
    SELECT s.sale_id, s.vendor_id, v.vendor_name, s.sale_date, s.payment_method, s.payment_status,
           s.total_amount, s.amount_paid
    FROM sales s JOIN vendors v ON v.vendor_id = s.vendor_id WHERE s.sale_id = ?`, [id]);
  if (!header) return null;
  const [items] = await conn.query(`
    SELECT sd.sales_detail_id, sd.fruit_id, f.fruit_name, sd.packaging_size, sd.quantity, sd.unit_price,
           (sd.quantity * sd.unit_price) AS line_total
    FROM sales_details sd JOIN fruits f ON f.fruit_id = sd.fruit_id WHERE sd.sale_id = ?`, [id]);
  const [payments] = await conn.query(
    'SELECT payment_id, amount, payment_method, reference, paid_at FROM payments WHERE sale_id = ? ORDER BY paid_at, payment_id', [id]);
  return { ...header, outstanding_balance: outstanding(header.total_amount, header.amount_paid), items, payments };
};
