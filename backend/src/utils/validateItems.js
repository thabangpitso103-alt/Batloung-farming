const AppError = require('./AppError');
const { PACKAGING_SIZES } = require('./constants');

/** Validates the item list of a purchase or sale and returns clean, numeric items. */
module.exports = function validateItems(items, { needsCost = false } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'items must be a non-empty array');
  }
  const errors = [];
  const clean = items.map((raw, i) => {
    const n = i + 1;
    const it = raw || {};
    const fruitId = Number(it.fruit_id);
    const qty = Number(it.quantity);
    if (!Number.isInteger(fruitId) || fruitId < 1) errors.push(`item ${n}: fruit_id must be a positive whole number`);
    if (!PACKAGING_SIZES.includes(it.packaging_size)) errors.push(`item ${n}: packaging_size must be one of ${PACKAGING_SIZES.join(', ')}`);
    if (!Number.isInteger(qty) || qty < 1) errors.push(`item ${n}: quantity must be a whole number of at least 1`);
    const out = { fruit_id: fruitId, packaging_size: it.packaging_size, quantity: qty };
    if (needsCost) {
      const cost = Number(it.unit_cost);
      if (it.unit_cost === undefined || it.unit_cost === null || !Number.isFinite(cost) || cost <= 0) {
        errors.push(`item ${n}: unit_cost must be a number greater than 0`);
      }
      out.unit_cost = cost;
    }
    return out;
  });
  if (errors.length) throw new AppError(400, 'Validation failed', errors);
  return clean;
};
