const AppError = require('../utils/AppError');
const { describeDbError } = require('../config/db');

const CONNECTION_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ECONNRESET', 'ER_CON_COUNT_ERROR'];

function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Unexpected server error';
  let details;

  if (err instanceof AppError) {
    status = err.statusCode; message = err.message; details = err.details;
  } else if (err.type === 'entity.parse.failed') {
    status = 400; message = 'Invalid JSON in request body';
  } else if (CONNECTION_CODES.includes(err.code)) {
    status = 503; message = describeDbError(err);
  } else if (err.code === 'ER_DUP_ENTRY') {
    status = 409; message = 'A record with the same unique value (name / phone) already exists';
  } else if (['ER_ROW_IS_REFERENCED_2', 'ER_ROW_IS_REFERENCED'].includes(err.code)) {
    status = 409; message = 'Cannot delete this record because other records depend on it';
  } else if (['ER_NO_REFERENCED_ROW_2', 'ER_NO_REFERENCED_ROW'].includes(err.code)) {
    status = 400; message = 'Referenced record does not exist';
  } else if (['ER_CHECK_CONSTRAINT_VIOLATED', 'ER_CONSTRAINT_FAILED'].includes(err.code)
             || err.errno === 3819 || err.errno === 4025) {
    status = 400; message = 'Value rejected by a database constraint (e.g. negative stock or invalid amount)';
  }

  if (status === 500) console.error('[ERROR]', err);
  else console.warn(`[${status}] ${req.method} ${req.originalUrl} - ${message}`);

  res.status(status).json({ success: false, error: message, ...(details ? { details } : {}) });
}

module.exports = { notFound, errorHandler };
