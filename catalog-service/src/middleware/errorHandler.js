module.exports = (err, _req, res, _next) => {
  const status = err.status || 500;
  const response = {
    error: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};
