const model = require('../models/stockModel');
const fruitModel = require('../models/fruitModel');
const AppError = require('../utils/AppError');

exports.getAll = async (req, res) => {
  const data = await model.findAll();
  res.status(200).json({ success: true, count: data.length, data });
};
exports.getByFruit = async (req, res) => {
  if (!(await fruitModel.findById(req.params.fruitId))) throw new AppError(404, `Fruit ${req.params.fruitId} not found`);
  const data = await model.findByFruit(req.params.fruitId);
  res.status(200).json({ success: true, count: data.length, data });
};
exports.getLow = async (req, res) => {
  const raw = req.query.threshold ?? process.env.LOW_STOCK_THRESHOLD ?? 10;
  const threshold = Number(raw);
  if (!Number.isInteger(threshold) || threshold < 0) throw new AppError(400, 'threshold must be a whole number of 0 or more');
  const data = await model.findLow(threshold);
  res.status(200).json({ success: true, threshold, count: data.length, data });
};
