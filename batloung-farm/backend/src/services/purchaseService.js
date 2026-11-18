const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const validateItems = require('../utils/validateItems');
const { calculateTotal } = require('../utils/calculations');
const purchaseModel = require('../models/purchaseModel');

/**
 * Records a purchase from a supplier in ONE database transaction:
 *   BEGIN -> check supplier & fruits -> insert purchase + details -> increase stock -> COMMIT
 * Any failure -> ROLLBACK, so nothing is saved and stock is untouched.
 */
exports.createPurchase = async ({ supplier_id, items, purchase_date }) => {
  const clean = validateItems(items, { needsCost: true });
  const total = calculateTotal(clean);               // total is calculated, never typed in

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [sup] = await conn.query('SELECT supplier_id FROM suppliers WHERE supplier_id = ?', [supplier_id]);
    if (!sup.length) throw new AppError(404, `Supplier ${supplier_id} not found`);

    const [res] = await conn.query(
      'INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES (?, COALESCE(?, NOW()), ?)',
      [supplier_id, purchase_date || null, total]);
    const purchaseId = res.insertId;

    for (const [idx, item] of clean.entries()) {
      const [fruit] = await conn.query('SELECT fruit_name, status FROM fruits WHERE fruit_id = ?', [item.fruit_id]);
      if (!fruit.length) throw new AppError(404, `item ${idx + 1}: fruit ${item.fruit_id} not found`);
      if (fruit[0].status !== 'ACTIVE') throw new AppError(400, `item ${idx + 1}: ${fruit[0].fruit_name} is INACTIVE and cannot be purchased`);

      await conn.query(
        'INSERT INTO purchase_details (purchase_id, fruit_id, packaging_size, quantity, unit_cost) VALUES (?,?,?,?,?)',
        [purchaseId, item.fruit_id, item.packaging_size, item.quantity, item.unit_cost]);

      // stock increases for that exact fruit + packaging size
      await conn.query(
        `INSERT INTO stock (fruit_id, packaging_size, available_quantity) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE available_quantity = available_quantity + VALUES(available_quantity)`,
        [item.fruit_id, item.packaging_size, item.quantity]);
    }

    await conn.commit();
    return purchaseModel.findById(purchaseId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
