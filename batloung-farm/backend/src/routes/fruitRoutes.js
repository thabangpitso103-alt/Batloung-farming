const router = require('express').Router();
const c = require('../controllers/fruitController');
const h = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const { validateBody, validateIdParam } = require('../middleware/validate');
const { FRUIT_STATUS } = require('../utils/constants');

const rules = {
  fruit_name: { type: 'string', required: true, maxLength: 60 },
  description: { type: 'string', maxLength: 255 },
  status: { type: 'enum', values: FRUIT_STATUS },
};

// prices: { small, medium, large } must each be > 0 when supplied
const checkPrices = (req, res, next) => {
  const p = req.body.prices;
  if (p === undefined) return next();
  if (typeof p !== 'object' || p === null) return next(new AppError(400, 'prices must be an object like { "small": 100, "medium": 150, "large": 200 }'));
  for (const size of ['small', 'medium', 'large']) {
    if (p[size] !== undefined && (!Number.isFinite(Number(p[size])) || Number(p[size]) <= 0)) {
      return next(new AppError(400, `prices.${size} must be a number greater than 0`));
    }
  }
  next();
};

router.post('/', validateBody(rules), checkPrices, h(c.create));
router.get('/', h(c.getAll));
router.get('/:id', validateIdParam(), h(c.getById));
router.put('/:id', validateIdParam(), validateBody(rules, { partial: true }), checkPrices, h(c.update));
module.exports = router;
