/**
 * ============================================================
 * 🚀 CACHE SERVICE (Redis with In-Memory Fallback)
 * ============================================================
 * Provides caching layer for:
 * - Lookup tables
 * - RBAC permissions
 * - Dashboard aggregates
 * - Project summaries
 * 
 * Features:
 * - Automatic TTL management
 * - Graceful fallback to in-memory cache if Redis unavailable
 */

let redisClient = null;
const inMemoryCache = new Map();

// Try to initialize Redis (optional dependency)
try {
  const redis = require('redis');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = redis.createClient({ url: redisUrl });
  
  redisClient.on('error', (err) => {
    console.warn('⚠️ Redis connection error, falling back to in-memory cache:', err.message);
    redisClient = null;
  });
  
  redisClient.on('connect', () => {
    console.log('✅ Redis cache connected');
  });
  
  // Connect asynchronously (non-blocking)
  redisClient.connect().catch(() => {
    console.warn('⚠️ Redis connection failed, using in-memory cache');
    redisClient = null;
  });
} catch (err) {
  console.warn('⚠️ Redis not available, using in-memory cache:', err.message);
  redisClient = null;
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>}
 */
const get = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } else {
      // Fallback to in-memory cache
      const cached = inMemoryCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }
      inMemoryCache.delete(key);
      return null;
    }
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<boolean>}
 */
const set = async (key, value, ttlSeconds = 3600) => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } else {
      // Fallback to in-memory cache
      inMemoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return true;
    }
  } catch (err) {
    console.error('Cache set error:', err);
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key (supports wildcards with *)
 * @returns {Promise<boolean>}
 */
const del = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      if (key.includes('*')) {
        // Pattern delete (Redis SCAN + DEL)
        const keys = await redisClient.keys(key);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } else {
        await redisClient.del(key);
      }
      return true;
    } else {
      // Fallback to in-memory cache
      if (key.includes('*')) {
        const pattern = new RegExp('^' + key.replace(/\*/g, '.*') + '$');
        for (const k of inMemoryCache.keys()) {
          if (pattern.test(k)) {
            inMemoryCache.delete(k);
          }
        }
      } else {
        inMemoryCache.delete(key);
      }
      return true;
    }
  } catch (err) {
    console.error('Cache delete error:', err);
    return false;
  }
};

/**
 * Cache project data
 * @param {number} projectId - Project ID
 * @param {string} dataType - Type of data (summary, full, etc.)
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} ttlSeconds - Cache TTL (default: 5 minutes)
 * @returns {Promise<any>}
 */
const cacheProject = async (projectId, dataType, fetchFn, ttlSeconds = 300) => {
  const key = `project:${projectId}:${dataType}`;
  
  const cached = await get(key);
  if (cached !== null) {
    return cached;
  }
  
  const data = await fetchFn();
  await set(key, data, ttlSeconds);
  return data;
};

/**
 * Invalidate project cache
 * @param {number} projectId - Project ID (null for all projects)
 * @param {string} dataType - Type of data (null for all types)
 * @returns {Promise<boolean>}
 */
const invalidateProject = async (projectId = null, dataType = null) => {
  try {
    if (projectId !== null) {
      if (dataType !== null) {
        const key = `project:${projectId}:${dataType}`;
        return await del(key);
      } else {
        const pattern = `project:${projectId}:*`;
        return await del(pattern);
      }
    } else {
      const pattern = 'project:*';
      return await del(pattern);
    }
  } catch (err) {
    console.error(`[cacheService.invalidateProject] Error invalidating cache:`, err.message);
    return false;
  }
};

/**
 * Cache lookup table data
 * @param {string} tableName - Lookup table name
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} ttlSeconds - Cache TTL (default: 24 hours)
 * @returns {Promise<Array>}
 */
const cacheLookup = async (tableName, fetchFn, ttlSeconds = 86400) => {
  const key = `lookup:${tableName}`;
  
  // Try cache first
  const cached = await get(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch and cache
  const data = await fetchFn();
  await set(key, data, ttlSeconds);
  return data;
};

/**
 * Invalidate lookup cache
 * @param {string} tableName - Lookup table name
 * @returns {Promise<boolean>}
 */
const invalidateLookup = async (tableName) => {
  try {
    const key = `lookup:${tableName}`;
    return await del(key);
  } catch (err) {
    console.error(`[cacheService.invalidateLookup] Error invalidating cache for ${tableName}:`, err.message);
    return false;
  }
};

module.exports = {
  get,
  set,
  del,
  cacheProject,
  invalidateProject,
  cacheLookup,
  invalidateLookup,
  // Expose for testing
  _inMemoryCache: inMemoryCache,
  _redisClient: redisClient,
};

