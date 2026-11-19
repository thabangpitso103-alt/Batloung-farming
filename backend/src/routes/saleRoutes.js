const router = require('express').Router();
const c = require('../controllers/saleController');
const h = require('../middleware/asyncHandler');
const { validateBody, validateIdParam } = require('../middleware/validate');
const { SALE_PAYMENT_METHODS, PAYMENT_METHODS } = require('../utils/constants');

router.post('/', validateBody({
  vendor_id: { type: 'int', required: true, min: 1 },
  payment_method: { type: 'enum', values: SALE_PAYMENT_METHODS },
  amount_paid: { type: 'number', min: 0 },
  reference: { type: 'string', maxLength: 60 },
}), h(c.create));
router.get('/', h(c.getAll));
router.get('/:id', validateIdParam(), h(c.getById));
router.post('/:id/payments', validateIdParam(), validateBody({
  amount: { type: 'number', required: true, min: 0.01 },
  payment_method: { type: 'enum', required: true, values: PAYMENT_METHODS },
  reference: { type: 'string', maxLength: 60 },
}), h(c.addPayment));
module.exports = router;
