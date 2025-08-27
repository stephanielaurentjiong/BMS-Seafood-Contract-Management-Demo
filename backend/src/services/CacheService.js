/**
 * @fileoverview Cache Service Layer
 * 
 * Caching layer for improved performance and reduced database load.
 * Handles Redis operations, cache invalidation, and cache warming strategies.
 * 
 * Features:
 * - Redis-based caching with fallback to memory
 * - Intelligent cache invalidation
 * - Performance metrics and monitoring
 * - Cache warming for frequently accessed data
 * - TTL management and cache policies
 * 
 */

const Redis = require('ioredis');

/**
 * Cache Service for performance optimization
 * 
 * @class CacheService
 */
class CacheService {
  static redis = null;
  static memoryCache = new Map();
  static isRedisAvailable = false;

  /**
   * Initialize Redis connection
   */
  static async initialize() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true
      });

      // Test connection
      await this.redis.ping();
      this.isRedisAvailable = true;
      console.log('Redis cache service connected');

      // Handle Redis errors gracefully
      this.redis.on('error', (error) => {
        console.warn('Redis connection error, falling back to memory cache:', error.message);
        this.isRedisAvailable = false;
      });

      this.redis.on('connect', () => {
        console.log('Redis reconnected');
        this.isRedisAvailable = true;
      });

    } catch (error) {
      console.warn('Redis not available, using memory cache:', error.message);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get value from cache
   * 
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  static async get(key) {
    try {
      if (this.isRedisAvailable && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Fallback to memory cache
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value;
        } else if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   * 
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300)
   * @returns {Promise<boolean>} Success status
   */
  static async set(key, value, ttl = 300) {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
        return true;
      } else {
        // Fallback to memory cache
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + (ttl * 1000)
        });
        
        // Prevent memory cache from growing too large
        if (this.memoryCache.size > 1000) {
          const firstKey = this.memoryCache.keys().next().value;
          this.memoryCache.delete(firstKey);
        }
        
        return true;
      }
    } catch (error) {
      console.warn('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   * 
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  static async del(key) {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      console.warn('Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   * 
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  static async delPattern(pattern) {
    try {
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return keys.length;
      } else {
        // Memory cache pattern deletion
        const regex = new RegExp(pattern.replace('*', '.*'));
        let deletedCount = 0;
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }
        return deletedCount;
      }
    } catch (error) {
      console.warn('Cache pattern delete error:', error.message);
      return 0;
    }
  }

  /**
   * Cache contract data
   * 
   * @param {string} contractId - Contract ID
   * @param {Object} contractData - Contract data
   * @param {number} ttl - Cache duration (default: 10 minutes)
   */
  static async setContract(contractId, contractData, ttl = 600) {
    const key = `contract:${contractId}`;
    await this.set(key, contractData, ttl);
  }

  /**
   * Get cached contract data
   * 
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object|null>} Cached contract or null
   */
  static async getContract(contractId) {
    const key = `contract:${contractId}`;
    return await this.get(key);
  }

  /**
   * Invalidate contract cache
   * 
   * @param {string} contractId - Contract ID
   */
  static async invalidateContract(contractId) {
    const key = `contract:${contractId}`;
    await this.del(key);
  }

  /**
   * Cache supplier contracts list
   * 
   * @param {string} supplierId - Supplier ID
   * @param {Array} contracts - Contracts array
   * @param {number} ttl - Cache duration (default: 5 minutes)
   */
  static async setSupplierContracts(supplierId, contracts, ttl = 300) {
    const key = `supplier:${supplierId}:contracts`;
    await this.set(key, contracts, ttl);
  }

  /**
   * Get cached supplier contracts
   * 
   * @param {string} supplierId - Supplier ID
   * @returns {Promise<Array|null>} Cached contracts or null
   */
  static async getSupplierContracts(supplierId) {
    const key = `supplier:${supplierId}:contracts`;
    return await this.get(key);
  }

  /**
   * Invalidate supplier contracts cache
   * 
   * @param {string} supplierId - Supplier ID
   */
  static async invalidateSupplierContracts(supplierId) {
    if (supplierId) {
      const key = `supplier:${supplierId}:contracts`;
      await this.del(key);
    }
  }

  /**
   * Cache contract analytics
   * 
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {Object} analytics - Analytics data
   * @param {number} ttl - Cache duration (default: 15 minutes)
   */
  static async setContractAnalytics(userId, userRole, analytics, ttl = 900) {
    const key = `analytics:${userRole}:${userId}`;
    await this.set(key, analytics, ttl);
  }

  /**
   * Get cached contract analytics
   * 
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Object|null>} Cached analytics or null
   */
  static async getContractAnalytics(userId, userRole) {
    const key = `analytics:${userRole}:${userId}`;
    return await this.get(key);
  }

  /**
   * Invalidate contract statistics cache
   */
  static async invalidateContractStatistics() {
    await this.delPattern('analytics:*');
    await this.del('stats:contracts');
  }

  /**
   * Cache user data
   * 
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @param {number} ttl - Cache duration (default: 30 minutes)
   */
  static async setUser(userId, userData, ttl = 1800) {
    const key = `user:${userId}`;
    await this.set(key, userData, ttl);
  }

  /**
   * Get cached user data
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Cached user or null
   */
  static async getUser(userId) {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  /**
   * Invalidate user cache
   * 
   * @param {string} userId - User ID
   */
  static async invalidateUser(userId) {
    const key = `user:${userId}`;
    await this.del(key);
  }

  /**
   * Cache suppliers list
   * 
   * @param {Array} suppliers - Suppliers array
   * @param {number} ttl - Cache duration (default: 1 hour)
   */
  static async setSuppliers(suppliers, ttl = 3600) {
    await this.set('suppliers:list', suppliers, ttl);
  }

  /**
   * Get cached suppliers list
   * 
   * @returns {Promise<Array|null>} Cached suppliers or null
   */
  static async getSuppliers() {
    return await this.get('suppliers:list');
  }

  /**
   * Invalidate suppliers cache
   */
  static async invalidateSuppliers() {
    await this.del('suppliers:list');
  }

  /**
   * Warm up cache with frequently accessed data
   */
  static async warmCache() {
    try {
      console.log('Warming up cache...');
      
      // Warm up suppliers list (most frequently accessed)
      const User = require('../models/User');
      const suppliers = await User.getSuppliers();
      await this.setSuppliers(suppliers);
      
      console.log('Cache warmed up successfully');
    } catch (error) {
      console.warn('Cache warm-up warning:', error.message);
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns {Promise<Object>} Cache statistics
   */
  static async getStats() {
    try {
      const stats = {
        redis_available: this.isRedisAvailable,
        memory_cache_size: this.memoryCache.size,
        redis_info: null
      };

      if (this.isRedisAvailable && this.redis) {
        const info = await this.redis.info('memory');
        stats.redis_info = info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {});
      }

      return stats;
    } catch (error) {
      console.warn('Cache stats error:', error.message);
      return {
        redis_available: false,
        memory_cache_size: this.memoryCache.size,
        error: error.message
      };
    }
  }

  /**
   * Clear all cache
   */
  static async clear() {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.flushdb();
      }
      this.memoryCache.clear();
      console.log('🧹 Cache cleared');
    } catch (error) {
      console.warn('Cache clear error:', error.message);
    }
  }

  /**
   * Close Redis connection
   */
  static async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
        console.log('👋 Redis connection closed');
      }
    } catch (error) {
      console.warn('Redis close error:', error.message);
    }
  }
}

module.exports = CacheService;