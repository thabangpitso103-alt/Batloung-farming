// Forwards rejected promises to the Express error handler (no unhandled rejections).
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
