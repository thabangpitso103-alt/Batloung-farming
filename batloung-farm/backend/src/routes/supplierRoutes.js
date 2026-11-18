const router = require('express').Router();
const c = require('../controllers/supplierController');
const h = require('../middleware/asyncHandler');
const { validateBody, validateIdParam } = require('../middleware/validate');
const validateCoordinates = require('../middleware/validateCoordinates');
const { PROVINCES } = require('../utils/constants');

const rules = {
  business_name: { type: 'string', required: true, maxLength: 120 },
  contact_person: { type: 'string', required: true, maxLength: 100 },
  phone: { type: 'string', required: true, maxLength: 20, pattern: /^\+?[0-9 ()-]{7,20}$/, patternMessage: 'phone must be a valid phone number' },
  province: { type: 'enum', required: true, values: PROVINCES },
  address: { type: 'string', required: true, maxLength: 255 },
  latitude: { type: 'number', min: -90, max: 90 },
  longitude: { type: 'number', min: -180, max: 180 },
};

router.post('/', validateBody(rules), h(validateCoordinates), h(c.create));
router.get('/', h(c.getAll));
router.get('/:id', validateIdParam(), h(c.getById));
router.put('/:id', validateIdParam(), validateBody(rules, { partial: true }), h(validateCoordinates), h(c.update));
router.delete('/:id', validateIdParam(), h(c.remove));
module.exports = router;
