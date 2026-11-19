const router = require('express').Router();
const { checkConnection } = require('../config/db');

router.get('/health', async (req, res) => {
  const db = await checkConnection();
  res.status(db.ok ? 200 : 503).json({ success: db.ok, server: 'running', database: db.message });
});
router.use('/locations', require('./locationRoutes'));
router.use('/suppliers', require('./supplierRoutes'));
router.use('/fruits', require('./fruitRoutes'));
router.use('/stock', require('./stockRoutes'));
router.use('/vendors', require('./vendorRoutes'));
router.use('/purchases', require('./purchaseRoutes'));
router.use('/sales', require('./saleRoutes'));
router.use('/reports', require('./reportRoutes'));
module.exports = router;
