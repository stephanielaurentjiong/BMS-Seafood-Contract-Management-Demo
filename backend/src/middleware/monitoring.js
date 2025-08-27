/**
 * @fileoverview Performance Monitoring Middleware
 * 
 * Application performance monitoring and health check infrastructure.
 * Tracks response times, error rates, and system health metrics.
 * 
 * Features:
 * - Request/response time tracking
 * - Error rate monitoring
 * - Memory and CPU usage tracking
 * - Database connection health
 * - Custom metrics collection
 * - Health check endpoints
 * 
 */

const morgan = require('morgan');
const os = require('os');

/**
 * Performance monitoring service
 */
class MonitoringService {
  static metrics = {
    requests: {
      total: 0,
      successful: 0,
      failed: 0,
      avg_response_time: 0,
      response_times: []
    },
    errors: {
      total: 0,
      by_status: {},
      recent: []
    },
    system: {
      uptime: 0,
      memory: {},
      cpu: {}
    },
    database: {
      connections: 0,
      query_times: [],
      errors: 0
    },
    cache: {
      hits: 0,
      misses: 0,
      hit_rate: 0
    }
  };

  static startTime = Date.now();

  /**
   * Initialize monitoring service
   */
  static initialize() {
    console.log('Initializing performance monitoring...');
    
    // Start collecting system metrics
    this.startSystemMetrics();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Cleanup every minute

    console.log('Performance monitoring initialized');
  }

  /**
   * Start collecting system metrics
   */
  static startSystemMetrics() {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Update system metrics
   */
  static updateSystemMetrics() {
    this.metrics.system.uptime = process.uptime();
    this.metrics.system.memory = {
      used: process.memoryUsage(),
      free: os.freemem(),
      total: os.totalmem(),
      usage_percent: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
    };
    
    this.metrics.system.cpu = {
      load_avg: os.loadavg(),
      cpu_count: os.cpus().length
    };
  }

  /**
   * Record request metrics
   */
  static recordRequest(duration, statusCode, method, path) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
      this.recordError(statusCode, method, path);
    }

    // Track response time
    this.metrics.requests.response_times.push({
      duration,
      timestamp: Date.now(),
      method,
      path,
      status: statusCode
    });

    // Calculate average response time (last 100 requests)
    const recentTimes = this.metrics.requests.response_times.slice(-100);
    this.metrics.requests.avg_response_time = 
      recentTimes.reduce((sum, req) => sum + req.duration, 0) / recentTimes.length;
  }

  /**
   * Record error metrics
   */
  static recordError(statusCode, method, path, error = null) {
    this.metrics.errors.total++;
    
    if (!this.metrics.errors.by_status[statusCode]) {
      this.metrics.errors.by_status[statusCode] = 0;
    }
    this.metrics.errors.by_status[statusCode]++;

    // Keep recent errors for debugging
    this.metrics.errors.recent.push({
      timestamp: Date.now(),
      status: statusCode,
      method,
      path,
      error: error ? error.message : null
    });

    // Keep only last 50 errors
    if (this.metrics.errors.recent.length > 50) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(-50);
    }
  }

  /**
   * Record database query metrics
   */
  static recordDatabaseQuery(duration, success = true) {
    if (success) {
      this.metrics.database.query_times.push({
        duration,
        timestamp: Date.now()
      });
      
      // Keep only last 100 query times
      if (this.metrics.database.query_times.length > 100) {
        this.metrics.database.query_times = this.metrics.database.query_times.slice(-100);
      }
    } else {
      this.metrics.database.errors++;
    }
  }

  /**
   * Record cache metrics
   */
  static recordCacheHit() {
    this.metrics.cache.hits++;
    this.updateCacheHitRate();
  }

  /**
   * Record cache miss
   */
  static recordCacheMiss() {
    this.metrics.cache.misses++;
    this.updateCacheHitRate();
  }

  /**
   * Update cache hit rate
   */
  static updateCacheHitRate() {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hit_rate = total > 0 ? 
      Math.round((this.metrics.cache.hits / total) * 100) : 0;
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  static cleanupOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean old response times
    this.metrics.requests.response_times = this.metrics.requests.response_times
      .filter(req => req.timestamp > oneHourAgo);
    
    // Clean old database query times
    this.metrics.database.query_times = this.metrics.database.query_times
      .filter(query => query.timestamp > oneHourAgo);
    
    // Clean old errors (keep last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.metrics.errors.recent = this.metrics.errors.recent
      .filter(error => error.timestamp > oneDayAgo);
  }

  /**
   * Get current metrics
   */
  static getMetrics() {
    return {
      ...this.metrics,
      collection_time: new Date().toISOString(),
      uptime_formatted: this.formatUptime(this.metrics.system.uptime)
    };
  }

  /**
   * Get health status
   */
  static async getHealthStatus() {
    const metrics = this.getMetrics();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.uptime_formatted,
      checks: {}
    };

    // Check memory usage
    health.checks.memory = {
      status: metrics.system.memory.usage_percent < 90 ? 'healthy' : 'warning',
      usage_percent: metrics.system.memory.usage_percent,
      details: metrics.system.memory
    };

    // Check error rate
    const errorRate = metrics.requests.total > 0 ? 
      (metrics.requests.failed / metrics.requests.total) * 100 : 0;
    health.checks.error_rate = {
      status: errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'critical',
      error_rate_percent: Math.round(errorRate),
      total_requests: metrics.requests.total,
      failed_requests: metrics.requests.failed
    };

    // Check response time
    health.checks.response_time = {
      status: metrics.requests.avg_response_time < 1000 ? 'healthy' : 
              metrics.requests.avg_response_time < 2000 ? 'warning' : 'critical',
      avg_response_time_ms: Math.round(metrics.requests.avg_response_time),
      target_ms: 1000
    };

    // Check database health
    try {
      const pool = require('../config/database');
      await pool.query('SELECT 1');
      health.checks.database = {
        status: 'healthy',
        connection: 'active',
        errors: metrics.database.errors
      };
    } catch (error) {
      health.checks.database = {
        status: 'critical',
        connection: 'failed',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // Check cache health
    try {
      const CacheService = require('../services/CacheService');
      const cacheStats = await CacheService.getStats();
      health.checks.cache = {
        status: cacheStats.redis_available ? 'healthy' : 'degraded',
        redis_available: cacheStats.redis_available,
        hit_rate_percent: metrics.cache.hit_rate
      };
    } catch (error) {
      health.checks.cache = {
        status: 'degraded',
        error: error.message
      };
    }

    // Overall health status
    const criticalIssues = Object.values(health.checks)
      .filter(check => check.status === 'critical').length;
    
    if (criticalIssues > 0) {
      health.status = 'unhealthy';
    } else {
      const warningIssues = Object.values(health.checks)
        .filter(check => check.status === 'warning').length;
      if (warningIssues > 2) {
        health.status = 'degraded';
      }
    }

    return health;
  }

  /**
   * Format uptime in human readable format
   */
  static formatUptime(uptimeSeconds) {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Reset metrics (for testing)
   */
  static resetMetrics() {
    this.metrics = {
      requests: { total: 0, successful: 0, failed: 0, avg_response_time: 0, response_times: [] },
      errors: { total: 0, by_status: {}, recent: [] },
      system: { uptime: 0, memory: {}, cpu: {} },
      database: { connections: 0, query_times: [], errors: 0 },
      cache: { hits: 0, misses: 0, hit_rate: 0 }
    };
  }
}

/**
 * Request timing middleware
 */
const requestTimer = (req, res, next) => {
  req.startTime = Date.now();
  
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - req.startTime;
    MonitoringService.recordRequest(duration, res.statusCode, req.method, req.path);
    originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Custom Morgan logger format
 */
const morganFormat = morgan((tokens, req, res) => {
  const duration = Date.now() - req.startTime;
  return [
    '📈',
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    `${duration}ms`,
    tokens['user-agent'](req, res)
  ].join(' ');
});

/**
 * Error tracking middleware
 */
const errorTracker = (error, req, res, next) => {
  MonitoringService.recordError(
    res.statusCode || 500, 
    req.method, 
    req.path, 
    error
  );
  next(error);
};

/**
 * Health check endpoint handler
 */
const healthCheckHandler = async (req, res) => {
  try {
    const health = await MonitoringService.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Metrics endpoint handler
 */
const metricsHandler = (req, res) => {
  try {
    const metrics = MonitoringService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
};

/**
 * Apply monitoring middleware to Express app
 */
function applyMonitoring(app) {
  console.log('Applying monitoring middleware...');

  // Initialize monitoring service
  MonitoringService.initialize();
  
  // Request timing
  app.use(requestTimer);
  
  // HTTP request logging
  app.use(morganFormat);
  
  // Health check endpoints
  app.get('/api/health', healthCheckHandler);
  app.get('/api/health/detailed', async (req, res) => {
    const health = await MonitoringService.getHealthStatus();
    const metrics = MonitoringService.getMetrics();
    res.json({ health, metrics });
  });
  
  // Metrics endpoint
  app.get('/api/metrics', metricsHandler);
  
  // Error tracking (add this last)
  app.use(errorTracker);

  console.log('Monitoring middleware applied');
  console.log('Health check: GET /api/health');
  console.log('Metrics: GET /api/metrics');
}

module.exports = {
  MonitoringService,
  applyMonitoring,
  requestTimer,
  morganFormat,
  errorTracker,
  healthCheckHandler,
  metricsHandler
};