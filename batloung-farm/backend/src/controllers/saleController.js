const service = require('../services/saleService');
const model = require('../models/saleModel');
const AppError = require('../utils/AppError');

const STATUSES = ['PAID', 'PARTIALLY_PAID', 'UNPAID'];

exports.create = async (req, res) => {
  const sale = await service.createSale(req.body);
  res.status(201).json({ success: true, message: 'Sale recorded and stock reduced', data: sale });
};
exports.getAll = async (req, res) => {
  const { vendor_id: vendorId, payment_status: status } = req.query;
  if (status && !STATUSES.includes(status)) throw new AppError(400, `payment_status must be one of: ${STATUSES.join(', ')}`);
  if (vendorId && !/^\d+$/.test(vendorId)) throw new AppError(400, 'vendor_id must be a whole number');
  const data = await model.findAll({ vendorId, status });
  res.status(200).json({ success: true, count: data.length, data });
};
exports.getById = async (req, res) => {
  const sale = await model.findById(req.params.id);
  if (!sale) throw new AppError(404, `Sale ${req.params.id} not found`);
  res.status(200).json({ success: true, data: sale });
};
exports.addPayment = async (req, res) => {
  const sale = await service.addPayment(req.params.id, req.body);
  res.status(201).json({ success: true, message: 'Payment recorded', data: sale });
};
