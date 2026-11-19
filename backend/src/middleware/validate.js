const AppError = require('../utils/AppError');

/**
 * validateBody({ field: { type: 'string'|'int'|'number'|'enum'|'date', required, values, min, maxLength } })
 * Collects every problem and answers 400 with the list.
 */
function validateBody(rules, { partial = false } = {}) {
  return (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return next(new AppError(400, 'Request body must be a JSON object'));
    }
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field];
      const missing = value === undefined || value === null || value === '';
      if (missing) {
        if (rule.required && !partial) errors.push(`${field} is required`);
        continue;
      }
      const msg = checkValue(field, value, rule);
      if (msg) errors.push(msg);
    }
    if (partial && !Object.keys(rules).some((f) => body[f] !== undefined)) {
      errors.push(`Provide at least one of: ${Object.keys(rules).join(', ')}`);
    }
    if (errors.length) return next(new AppError(400, 'Validation failed', errors));
    for (const [f, r] of Object.entries(rules)) {
      if (r.type === 'string' && typeof body[f] === 'string') body[f] = body[f].trim();
    }
    next();
  };
}

function checkValue(field, value, rule) {
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string' || !value.trim()) return `${field} must be a non-empty string`;
      if (rule.maxLength && value.trim().length > rule.maxLength) return `${field} must be at most ${rule.maxLength} characters`;
      if (rule.pattern && !rule.pattern.test(value.trim())) return rule.patternMessage || `${field} has an invalid format`;
      return null;
    case 'int':
      if (typeof value === 'boolean' || !Number.isInteger(Number(value))) return `${field} must be a whole number`;
      if (rule.min !== undefined && Number(value) < rule.min) return `${field} must be at least ${rule.min}`;
      return null;
    case 'number':
      if (typeof value === 'boolean' || !Number.isFinite(Number(value))) return `${field} must be a number`;
      if (rule.min !== undefined && Number(value) < rule.min) return `${field} must be at least ${rule.min}`;
      if (rule.max !== undefined && Number(value) > rule.max) return `${field} must be at most ${rule.max}`;
      return null;
    case 'enum':
      if (!rule.values.includes(value)) return `${field} must be one of: ${rule.values.join(', ')}`;
      return null;
    case 'date':
      if (!isValidDate(value)) return `${field} must be a valid date (YYYY-MM-DD)`;
      return null;
    default:
      return null;
  }
}

const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s)) && !Number.isNaN(Date.parse(s));

/** Rejects non-numeric / non-positive URL ids with 400. */
function validateIdParam(...names) {
  return (req, res, next) => {
    for (const name of names.length ? names : ['id']) {
      const v = req.params[name];
      if (!/^\d+$/.test(v) || Number(v) < 1) {
        return next(new AppError(400, `${name} must be a positive whole number`));
      }
    }
    next();
  };
}

module.exports = { validateBody, validateIdParam, isValidDate, checkValue };
