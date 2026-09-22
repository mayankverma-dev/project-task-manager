import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body) req.body = parsed.body;
    // req.query is a getter-only property in Node.js v24+, use Object.assign to mutate in-place
    if (parsed.query) Object.assign(req.query, parsed.query);
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const details = (error.issues || error.errors || []).map(err => ({ field: err.path.join('.'), issue: err.message }));
      next(new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', details));
    } else {
      next(error);
    }
  }
};
