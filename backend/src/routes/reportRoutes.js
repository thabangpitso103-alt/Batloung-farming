const router = require('express').Router();
const c = require('../controllers/reportController');
const h = require('../middleware/asyncHandler');

router.get('/top-fruits', h(c.topFruits));
router.get('/revenue', h(c.revenue));
router.get('/top-vendor', h(c.topVendor));
router.get('/stock-levels', h(c.stockLevels));
module.exports = router;
