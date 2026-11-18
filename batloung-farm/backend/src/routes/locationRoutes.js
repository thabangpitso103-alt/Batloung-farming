const router = require('express').Router();
const controller = require('../controllers/locationController');
const h = require('../middleware/asyncHandler');

router.get('/suggestions', h(controller.suggestions));
router.get('/validate', h(controller.validateCoordinates));

module.exports = router;
