/**
 * Centralized Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Tracker]:', err.stack || err.message || err);

  const statusCode = err.statusCode || err.code || 500;
  const message = err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';

  res.status(statusCode >= 100 && statusCode < 600 ? statusCode : 500).json({
    status: 'error',
    message,
  });
}

module.exports = errorHandler;
