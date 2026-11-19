const model = require('../models/supplierModel');
const AppError = require('../utils/AppError');

const getOr404 = async (id) => {
  const s = await model.findById(id);
  if (!s) throw new AppError(404, `Supplier ${id} not found`);
  return s;
};

exports.create = async (req, res) => {
  const id = await model.create(req.body);
  res.status(201).json({ success: true, message: 'Supplier registered', data: await model.findById(id) });
};
exports.getAll = async (req, res) => {
  const data = await model.findAll();
  res.status(200).json({ success: true, count: data.length, data });
};
exports.getById = async (req, res) => res.status(200).json({ success: true, data: await getOr404(req.params.id) });
exports.update = async (req, res) => {
  await getOr404(req.params.id);
  await model.update(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Supplier updated', data: await model.findById(req.params.id) });
};
exports.remove = async (req, res) => {
  const s = await getOr404(req.params.id);
  const n = await model.countPurchases(req.params.id);
  if (n > 0) {
    // business constraint: suppliers with purchase history are kept for record integrity
    throw new AppError(409, `Cannot delete "${s.business_name}": it has ${n} recorded purchase(s). Suppliers with purchase history must be kept.`);
  }
  await model.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Supplier deleted' });
};
