/**
 * ============================================================
 * 🚀 SLOW QUERY LOGGER MIDDLEWARE
 * ============================================================
 * Logs queries that exceed threshold (default: 500ms)
 * Helps identify performance bottlenecks
 */

const slowQueryLogger = (thresholdMs = 500) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json;

    // Override res.json to capture response time
    res.json = function (data) {
      const duration = Date.now() - startTime;
      
      if (duration > thresholdMs) {
        console.warn(`⚠️ SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
        console.warn(`   Query params:`, req.query);
        console.warn(`   User:`, req.user?.username || 'anonymous');
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = slowQueryLogger;

