export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Recurso no encontrado.'
    }
  });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: {
        code: 'INVALID_CSRF',
        message: 'Token CSRF inválido o ausente.'
      }
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Error inesperado.',
      details: err.details
    }
  });
}
