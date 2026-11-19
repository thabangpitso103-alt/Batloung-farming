const { pool } = require('../config/db');

exports.findAll = async () => (await pool.query(`
  SELECT p.purchase_id, p.supplier_id, s.business_name AS supplier, p.purchase_date, p.total_amount
  FROM purchases p JOIN suppliers s ON s.supplier_id = p.supplier_id ORDER BY p.purchase_date DESC, p.purchase_id DESC`))[0];

exports.findById = async (id) => {
  const [[header]] = await pool.query(`
    SELECT p.purchase_id, p.supplier_id, s.business_name AS supplier, s.province, p.purchase_date, p.total_amount
    FROM purchases p JOIN suppliers s ON s.supplier_id = p.supplier_id WHERE p.purchase_id = ?`, [id]);
  if (!header) return null;
  const [items] = await pool.query(`
    SELECT pd.purchase_detail_id, pd.fruit_id, f.fruit_name, pd.packaging_size, pd.quantity, pd.unit_cost,
           (pd.quantity * pd.unit_cost) AS line_total
    FROM purchase_details pd JOIN fruits f ON f.fruit_id = pd.fruit_id WHERE pd.purchase_id = ?`, [id]);
  return { ...header, items };
};
