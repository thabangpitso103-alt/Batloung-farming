const model = require('../models/reportModel');
const AppError = require('../utils/AppError');
const { isValidDate } = require('../middleware/validate');

exports.topFruits = async (req, res) => {
  const limit = req.query.limit === undefined ? 5 : Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new AppError(400, 'limit must be a whole number from 1 to 50');
  const data = await model.topFruits(limit);
  res.status(200).json({ success: true, count: data.length, data });
};
exports.revenue = async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) throw new AppError(400, 'Provide both ?from=YYYY-MM-DD and ?to=YYYY-MM-DD');
  if (!isValidDate(from) || !isValidDate(to)) throw new AppError(400, 'from and to must be valid dates (YYYY-MM-DD)');
  if (from > to) throw new AppError(400, '"from" must not be after "to"');
  const data = await model.revenue(from, to);
  res.status(200).json({ success: true, data: { from, to, ...data } });
};
exports.topVendor = async (req, res) => {
  const data = await model.topVendor();
  if (!data) throw new AppError(404, 'No sales have been recorded yet');
  res.status(200).json({ success: true, data });
};
exports.stockLevels = async (req, res) => {
  const data = await model.stockLevels();
  res.status(200).json({ success: true, count: data.length, data });
};
