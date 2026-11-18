const router = require('express').Router();
const c = require('../controllers/stockController');
const h = require('../middleware/asyncHandler');
const { validateIdParam } = require('../middleware/validate');

router.get('/', h(c.getAll));
router.get('/low', h(c.getLow));
router.get('/fruit/:fruitId', validateIdParam('fruitId'), h(c.getByFruit));
module.exports = router;
