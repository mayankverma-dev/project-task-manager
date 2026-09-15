import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const details = error.errors.map(err => ({ field: err.path.join('.'), issue: err.message }));
      next(new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', details));
    } else {
      next(error);
    }
  }
};
