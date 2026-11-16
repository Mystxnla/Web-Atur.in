import { ZodError } from 'zod';

/**
 * Middleware factory — validasi req.body dengan skema Zod.
 * Kalau gagal, langsung balas 400 dengan pesan per field.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = {};
      result.error.errors.forEach((e) => {
        const key = e.path.join('.') || 'general';
        errors[key] = e.message;
      });
      return res.status(400).json({ error: 'Data tidak valid.', fields: errors });
    }
    req.body = result.data; // sanitized + coerced
    next();
  };
}
