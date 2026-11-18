const model = require('../models/vendorModel');
const AppError = require('../utils/AppError');

const getOr404 = async (id) => {
  const v = await model.findById(id);
  if (!v) throw new AppError(404, `Vendor ${id} not found`);
  return v;
};

exports.create = async (req, res) => {
  const id = await model.create(req.body);
  res.status(201).json({ success: true, message: 'Vendor registered', data: await model.findById(id) });
};
exports.getAll = async (req, res) => {
  const data = await model.findAll(req.query.search);
  res.status(200).json({ success: true, count: data.length, data });
};
exports.search = async (req, res) => {
  const q = (req.query.q || req.query.name || req.query.phone || '').trim();
  if (!q) throw new AppError(400, 'Provide a search term: ?q=<name or phone number>');
  const data = await model.findAll(q);
  res.status(200).json({ success: true, count: data.length, data });
};
exports.getById = async (req, res) => res.status(200).json({ success: true, data: await getOr404(req.params.id) });
exports.update = async (req, res) => {
  await getOr404(req.params.id);
  await model.update(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Vendor updated', data: await model.findById(req.params.id) });
};
exports.outstanding = async (req, res) => {
  const data = await model.outstandingBalances();
  res.status(200).json({ success: true, count: data.length, data });
};
exports.balance = async (req, res) => {
  const vendor = await getOr404(req.params.id);
  res.status(200).json({ success: true, data: { vendor, ...(await model.balance(req.params.id)) } });
};
