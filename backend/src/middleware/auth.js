export function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Autenticación requerida.'
    }
  });
}

export function attachCsrfToken(req, res, next) {
  res.setHeader('X-CSRF-Token', req.csrfToken());
  next();
}
