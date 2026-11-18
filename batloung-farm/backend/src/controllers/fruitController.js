const model = require('../models/fruitModel');
const AppError = require('../utils/AppError');

exports.create = async (req, res) => {
  const id = await model.create(req.body);
  res.status(201).json({ success: true, message: 'Fruit registered', data: await model.findById(id) });
};
exports.getAll = async (req, res) => {
  const data = await model.findAll({ includeInactive: req.query.all === 'true' });
  res.status(200).json({ success: true, count: data.length, data });
};
exports.getById = async (req, res) => {
  const f = await model.findById(req.params.id);
  if (!f) throw new AppError(404, `Fruit ${req.params.id} not found`);
  res.status(200).json({ success: true, data: f });
};
exports.update = async (req, res) => {
  if (!(await model.findById(req.params.id))) throw new AppError(404, `Fruit ${req.params.id} not found`);
  await model.update(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Fruit updated', data: await model.findById(req.params.id) });
};
