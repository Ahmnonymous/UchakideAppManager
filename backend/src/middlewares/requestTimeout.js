/**
 * ============================================================
 * 🚀 REQUEST TIMEOUT MIDDLEWARE
 * ============================================================
 * Prevents requests from hanging indefinitely
 * Default timeout: 30 seconds
 * 
 * Usage:
 *   app.use(requestTimeout(30000)); // 30 seconds
 */

const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    // Set timeout
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: 'Request timeout',
          message: `Request exceeded ${timeoutMs}ms timeout`,
        });
      }
    }, timeoutMs);

    // Clear timeout on response
    const originalEnd = res.end;
    res.end = function (...args) {
      clearTimeout(timeout);
      originalEnd.apply(this, args);
    };

    next();
  };
};

module.exports = requestTimeout;

