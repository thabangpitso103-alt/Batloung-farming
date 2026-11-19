const router = require('express').Router();
const c = require('../controllers/vendorController');
const h = require('../middleware/asyncHandler');
const { validateBody, validateIdParam } = require('../middleware/validate');
const validateCoordinates = require('../middleware/validateCoordinates');

const rules = {
  vendor_name: { type: 'string', required: true, maxLength: 100 },
  phone_number: { type: 'string', required: true, maxLength: 20, pattern: /^\+?[0-9 ()-]{7,20}$/, patternMessage: 'phone_number must be a valid phone number' },
  location: { type: 'string', required: true, maxLength: 150 },
  registration_date: { type: 'date' },
  latitude: { type: 'number', min: -90, max: 90 },
  longitude: { type: 'number', min: -180, max: 180 },
};

router.post('/', validateBody(rules), h(validateCoordinates), h(c.create));
router.get('/', h(c.getAll));
router.get('/search', h(c.search));            // must be before /:id
router.get('/outstanding', h(c.outstanding));  // vendors who still owe money
router.get('/:id', validateIdParam(), h(c.getById));
router.get('/:id/balance', validateIdParam(), h(c.balance));
router.put('/:id', validateIdParam(), validateBody(rules, { partial: true }), h(validateCoordinates), h(c.update));
module.exports = router;
