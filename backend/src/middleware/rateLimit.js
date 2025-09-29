import rateLimit from 'express-rate-limit';

export const redirectRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.ip,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes, intenta de nuevo en un minuto.'
    }
  }
});
