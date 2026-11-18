const router = require('express').Router();
const c = require('../controllers/purchaseController');
const h = require('../middleware/asyncHandler');
const { validateBody, validateIdParam } = require('../middleware/validate');

router.post('/', validateBody({ supplier_id: { type: 'int', required: true, min: 1 }, purchase_date: { type: 'date' } }), h(c.create));
router.get('/', h(c.getAll));
router.get('/unit-costs', h(c.getUnitCosts));
router.get('/:id', validateIdParam(), h(c.getById));
module.exports = router;
