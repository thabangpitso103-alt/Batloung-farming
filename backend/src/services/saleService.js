const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const validateItems = require('../utils/validateItems');
const { calculateSaleTotal, lineTotal, paymentStatus, round2 } = require('../utils/calculations');
const { SALE_PAYMENT_METHODS, PAYMENT_METHODS } = require('../utils/constants');
const saleModel = require('../models/saleModel');

/**
 * Records a sale in ONE transaction. If any single item fails (unknown fruit, no price,
 * not enough stock) the whole sale is rolled back: no sale row, no details, stock unchanged.
 */
exports.createSale = async ({ vendor_id, items, payment_method = 'CASH', amount_paid, reference }) => {
  if (!SALE_PAYMENT_METHODS.includes(payment_method)) {
    throw new AppError(400, `payment_method must be one of: ${SALE_PAYMENT_METHODS.join(', ')}`);
  }
  const clean = validateItems(items);
  // Sorting gives every transaction the same lock order -> no deadlocks between concurrent sales
  clean.sort((a, b) => a.fruit_id - b.fruit_id || a.packaging_size.localeCompare(b.packaging_size));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();                                   // BEGIN

    const [vendor] = await conn.query('SELECT vendor_id FROM vendors WHERE vendor_id = ?', [vendor_id]);
    if (!vendor.length) throw new AppError(404, `Vendor ${vendor_id} not found`);

    const lines = [];
    for (const [idx, item] of clean.entries()) {
      const label = `item ${idx + 1}`;
      const [fruit] = await conn.query('SELECT fruit_name, status FROM fruits WHERE fruit_id = ?', [item.fruit_id]);
      if (!fruit.length) throw new AppError(404, `${label}: fruit ${item.fruit_id} not found`);
      if (fruit[0].status !== 'ACTIVE') throw new AppError(400, `${label}: ${fruit[0].fruit_name} is INACTIVE and cannot be sold`);

      const [price] = await conn.query(
        'SELECT unit_price FROM selling_prices WHERE fruit_id = ? AND packaging_size = ?', [item.fruit_id, item.packaging_size]);
      if (!price.length) throw new AppError(400, `${label}: no selling price set for ${fruit[0].fruit_name} (${item.packaging_size})`);

      // Atomic guarded decrease: only succeeds if enough stock exists -> stock can never go negative
      const [upd] = await conn.query(
        `UPDATE stock SET available_quantity = available_quantity - ?
         WHERE fruit_id = ? AND packaging_size = ? AND available_quantity >= ?`,
        [item.quantity, item.fruit_id, item.packaging_size, item.quantity]);
      if (upd.affectedRows === 0) {
        const [st] = await conn.query(
          'SELECT available_quantity FROM stock WHERE fruit_id = ? AND packaging_size = ?', [item.fruit_id, item.packaging_size]);
        const available = st.length ? st[0].available_quantity : 0;
        throw new AppError(400,
          `Insufficient stock for ${fruit[0].fruit_name} (${item.packaging_size}): requested ${item.quantity}, available ${available}. Sale rejected.`);
      }
      lines.push({ ...item, unit_price: price[0].unit_price });
    }

    const total = calculateSaleTotal(lines);                         // calculated automatically
    let paid;
    if (amount_paid === undefined || amount_paid === null || amount_paid === '') {
      paid = payment_method === 'CREDIT' ? 0 : total;
    } else {
      paid = round2(Number(amount_paid));
      if (!Number.isFinite(paid) || paid < 0) throw new AppError(400, 'amount_paid must be a number of 0 or more');
      if (payment_method === 'CREDIT' && paid > 0) {
        throw new AppError(400, 'A CREDIT sale starts with no payment. Use CASH or MOBILE_MONEY for a part payment.');
      }
    }
    if (paid > total) throw new AppError(400, `amount_paid (${paid}) is more than the sale total (${total})`);
    const status = paymentStatus(total, paid);

    const [sale] = await conn.query(
      'INSERT INTO sales (vendor_id, payment_status, payment_method, total_amount, amount_paid) VALUES (?,?,?,?,?)',
      [vendor_id, status, payment_method, total, paid]);
    for (const l of lines) {
      await conn.query(
        'INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES (?,?,?,?,?)',
        [sale.insertId, l.fruit_id, l.packaging_size, l.quantity, l.unit_price]);
    }
    if (paid > 0) {
      await conn.query('INSERT INTO payments (sale_id, amount, payment_method, reference) VALUES (?,?,?,?)',
        [sale.insertId, paid, payment_method, reference || null]);
    }

    await conn.commit();                                             // COMMIT
    return saleModel.findById(sale.insertId);
  } catch (err) {
    await conn.rollback();                                           // ROLLBACK
    throw err;
  } finally {
    conn.release();
  }
};

/** Vendor pays (part of) an existing sale later: cash or mobile money. */
exports.addPayment = async (saleId, { amount, payment_method, reference }) => {
  if (!PAYMENT_METHODS.includes(payment_method)) {
    throw new AppError(400, `payment_method must be one of: ${PAYMENT_METHODS.join(', ')}`);
  }
  const pay = round2(Number(amount));
  if (!Number.isFinite(pay) || pay <= 0) throw new AppError(400, 'amount must be a number greater than 0');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT total_amount, amount_paid FROM sales WHERE sale_id = ? FOR UPDATE', [saleId]);
    if (!rows.length) throw new AppError(404, `Sale ${saleId} not found`);
    const { total_amount: total, amount_paid: paid } = rows[0];
    const balance = round2(total - paid);
    if (balance <= 0) throw new AppError(400, 'This sale is already fully paid');
    if (pay > balance) throw new AppError(400, `Payment (${pay}) is more than the outstanding balance (${balance})`);

    const newPaid = round2(paid + pay);
    await conn.query('INSERT INTO payments (sale_id, amount, payment_method, reference) VALUES (?,?,?,?)',
      [saleId, pay, payment_method, reference || null]);
    await conn.query('UPDATE sales SET amount_paid = ?, payment_status = ? WHERE sale_id = ?',
      [newPaid, paymentStatus(total, newPaid), saleId]);
    await conn.commit();
    return saleModel.findById(saleId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
