/**
 * ============================================================
 * 🚀 PAGINATION MIDDLEWARE
 * ============================================================
 * Standardizes pagination across all list endpoints
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 200)
 * - sort: Column to sort by (default: created_at)
 * - order: Sort direction (asc|desc, default: desc)
 * - search: Search term (optional)
 * 
 * Usage:
 *   router.get('/', paginationMiddleware, controller.getAll);
 */

const paginationMiddleware = (req, res, next) => {
  // Extract and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  const sort = req.query.sort || 'created_at';
  const order = (req.query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const search = req.query.search?.trim() || null;

  // Attach to request object for use in controllers/models
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
    sort,
    order,
    search,
  };

  next();
};

module.exports = paginationMiddleware;

