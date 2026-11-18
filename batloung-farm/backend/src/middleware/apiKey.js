const AppError = require('../utils/AppError');
// Optional admin protection: only active when ADMIN_API_KEY is set in .env
module.exports = (req, res, next) => {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return next();
  if (req.get('x-api-key') === key) return next();
  next(new AppError(401, 'Missing or invalid x-api-key header'));
};
