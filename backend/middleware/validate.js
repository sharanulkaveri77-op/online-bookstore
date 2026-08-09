const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeValidator(rules) {
  return (req, res, next) => {
    const errors = {};
    const body = req.body || {};
    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field];
      if (rule.required && (value === undefined || value === null || String(value).trim() === '')) {
        errors[field] = rule.message || `${field} is required`;
        continue;
      }
      if (value === undefined || value === null || value === '') continue;
      if (rule.type === 'email' && !EMAIL_RE.test(String(value))) {
        errors[field] = rule.message || 'Enter a valid email address';
      }
      if (rule.type === 'int' && (!Number.isInteger(Number(value)) || Number(value) < (rule.min ?? -Infinity))) {
        errors[field] = rule.message || `${field} must be a whole number${rule.min !== undefined ? ` of at least ${rule.min}` : ''}`;
      }
      if (rule.type === 'number' && (isNaN(Number(value)) || Number(value) < (rule.min ?? -Infinity))) {
        errors[field] = rule.message || `${field} must be a number${rule.min !== undefined ? ` of at least ${rule.min}` : ''}`;
      }
      if (rule.type === 'string' && rule.min && String(value).trim().length < rule.min) {
        errors[field] = rule.message || `${field} must be at least ${rule.min} characters`;
      }
      if (rule.type === 'rating' && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 5)) {
        errors[field] = rule.message || 'Rating must be between 1 and 5';
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
}

module.exports = { makeValidator };
