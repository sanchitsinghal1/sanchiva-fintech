/** Zod schema validator: validate(schema) -> parses & replaces req.body. */
const { ApiError } = require('../utils/apiResponse');

const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return next(new ApiError('VALIDATION', msg, 422));
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
