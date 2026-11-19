// Pure business-logic helpers (no database access) so totals are never typed in by hand.
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const lineTotal = (quantity, unitPrice) => round2(Number(quantity) * Number(unitPrice));

/** items: [{ quantity, unit_price | unit_cost }] -> grand total */
const calculateTotal = (items) =>
  round2(items.reduce((sum, i) => sum + lineTotal(i.quantity, i.unit_price ?? i.unit_cost), 0));

/** Total amount the vendor must pay for a sale. */
const calculateSaleTotal = (items) => calculateTotal(items);

const paymentStatus = (total, paid) => {
  if (paid <= 0) return 'UNPAID';
  return paid >= total ? 'PAID' : 'PARTIALLY_PAID';
};

const outstanding = (total, paid) => round2(Number(total) - Number(paid));

module.exports = { round2, lineTotal, calculateTotal, calculateSaleTotal, paymentStatus, outstanding };
