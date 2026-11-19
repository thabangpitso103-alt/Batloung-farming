const service = require('../services/purchaseService');
const model = require('../models/purchaseModel');
const AppError = require('../utils/AppError');
const { PURCHASE_UNIT_COSTS } = require('../utils/constants');

exports.getUnitCosts = (req, res) => {
  res.status(200).json({ success: true, data: PURCHASE_UNIT_COSTS });
};
exports.create = async (req, res) => {
  const purchase = await service.createPurchase(req.body);
  res.status(201).json({ success: true, message: 'Purchase recorded and stock updated', data: purchase });
};
exports.getAll = async (req, res) => {
  const data = await model.findAll();
  res.status(200).json({ success: true, count: data.length, data });
};
exports.getById = async (req, res) => {
  const p = await model.findById(req.params.id);
  if (!p) throw new AppError(404, `Purchase ${req.params.id} not found`);
  res.status(200).json({ success: true, data: p });
};
