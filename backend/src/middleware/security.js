/**
 * @fileoverview Security Middleware
 * 
 * Production-ready security middleware for API protection.
 * Includes rate limiting, request throttling, and security headers.
 * 
 * Features:
 * - Rate limiting with Redis backing
 * - Progressive request slowdown
 * - Security headers with Helmet
 * - Request size limiting
 * - IP-based and user-based rate limiting
 * 
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const compression = require('compression');

/**
 * Security configuration
 */
const securityConfig = {
  // Rate limiting configuration
  rateLimit: {
    // General API rate limit
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        error_type: 'rate_limit_exceeded',
        retry_after: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
      }
    },

    // Strict rate limit for auth endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 auth attempts per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        error_type: 'auth_rate_limit_exceeded',
        retry_after: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful auth
      skipFailedRequests: false, // Count failed attempts
      keyGenerator: (req) => {
        // Use IP + email for more specific rate limiting
        const email = req.body?.email || 'unknown';
        return `${req.ip}:${email}`;
      }
    },

    // Contract creation rate limit
    contractCreation: {
      windowMs: 60 * 1000, // 1 minute
      max: 10, // Maximum 10 contracts per minute per user
      message: {
        error: 'Contract creation rate limit exceeded. Please wait before creating more contracts.',
        error_type: 'contract_creation_limit',
        retry_after: '1 minute'
      },
      keyGenerator: (req) => {
        // Rate limit by user ID for authenticated requests
        return req.user?.id || req.ip;
      },
      skip: (req) => {
        // Only apply to authenticated users
        return !req.user;
      }
    }
  },

  // Request slowdown configuration
  slowDown: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per windowMs without delay
    delayMs: 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // Maximum delay of 20 seconds
    skipFailedRequests: false,
    skipSuccessfulRequests: false
  }
};

/**
 * Create rate limiter with Redis store if available
 * 
 * @param {Object} config - Rate limit configuration
 * @returns {Function} Rate limit middleware
 */
function createRateLimit(config) {
  const limiterConfig = {
    ...config,
    handler: (req, res) => {
      console.log(`🚫 Rate limit exceeded for ${req.ip} on ${req.method} ${req.path}`);
      res.status(429).json(config.message);
    }
  };

  // Add Redis store if available
  try {
    const RedisStore = require('rate-limit-redis');
    const Redis = require('ioredis');
    
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true
    });

    limiterConfig.store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    });

    console.log('Rate limiting using Redis store');
  } catch (error) {
    console.warn('Redis not available for rate limiting, using memory store');
  }

  return rateLimit(limiterConfig);
}

/**
 * Create request slowdown middleware
 * 
 * @param {Object} config - Slowdown configuration
 * @returns {Function} Slowdown middleware
 */
function createSlowDown(config) {
  return slowDown({
    ...config,
    onLimitReached: (req, res) => {
      console.log(`🐌 Request slowdown activated for ${req.ip} on ${req.method} ${req.path}`);
    }
  });
}

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API usage
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Request compression middleware
 */
const compressionMiddleware = compression({
  level: 6, // Compression level (1-9, 6 is default)
  threshold: 1024, // Only compress responses larger than 1kb
  filter: (req, res) => {
    // Don't compress if explicitly disabled
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other responses
    return compression.filter(req, res);
  }
});

/**
 * Request logging middleware for security monitoring
 */
const securityLogger = (req, res, next) => {
  // Log potential security concerns
  const userAgent = req.get('User-Agent') || 'Unknown';
  const contentLength = req.get('Content-Length');
  
  // Flag suspicious requests
  const suspicious = [];
  
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // >10MB
    suspicious.push('large_payload');
  }
  
  if (!userAgent || userAgent.length < 10) {
    suspicious.push('suspicious_user_agent');
  }
  
  if (req.path.includes('..') || req.path.includes('<script>')) {
    suspicious.push('path_traversal_attempt');
  }

  if (suspicious.length > 0) {
    console.warn(`Suspicious request from ${req.ip}: ${suspicious.join(', ')} - ${req.method} ${req.path}`);
  }

  // Add security headers to response
  res.set({
    'X-Request-ID': req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    'X-Response-Time': Date.now()
  });

  next();
};

/**
 * Request body size limiter
 */
const bodySizeLimit = (req, res, next) => {
  const maxSize = 5 * 1024 * 1024; // 5MB limit
  const contentLength = parseInt(req.get('Content-Length') || '0');
  
  if (contentLength > maxSize) {
    console.warn(`Request body too large: ${contentLength} bytes from ${req.ip}`);
    return res.status(413).json({
      error: 'Request body too large',
      error_type: 'payload_too_large',
      max_size: '5MB'
    });
  }
  
  next();
};

/**
 * Apply all security middleware to Express app
 * 
 * @param {Object} app - Express application
 */
function applySecurity(app) {
  console.log('Applying security middleware...');

  // Basic security headers
  app.use(securityHeaders);
  
  // Compression for better performance
  app.use(compressionMiddleware);
  
  // Request body size limiting
  app.use(bodySizeLimit);
  
  // Security logging
  app.use(securityLogger);
  
  // General rate limiting
  app.use('/api/', createRateLimit(securityConfig.rateLimit.general));
  
  // Request slowdown (progressive delay)
  app.use('/api/', createSlowDown(securityConfig.slowDown));
  
  // Strict rate limiting for auth endpoints
  app.use('/api/auth/', createRateLimit(securityConfig.rateLimit.auth));
  
  // Contract creation rate limiting
  app.use('/api/contracts', createRateLimit(securityConfig.rateLimit.contractCreation));

  console.log('Security middleware applied');
}

/**
 * Create custom rate limiter for specific endpoints
 * 
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate limit middleware
 */
function createCustomRateLimit(options) {
  return createRateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || {
      error: 'Rate limit exceeded',
      error_type: 'rate_limit_exceeded'
    },
    keyGenerator: options.keyGenerator,
    skip: options.skip
  });
}

/**
 * IP whitelist middleware
 * 
 * @param {Array} allowedIPs - Array of allowed IP addresses
 * @returns {Function} Middleware function
 */
function ipWhitelist(allowedIPs = []) {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No restriction if empty list
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      console.warn(`IP not whitelisted: ${clientIP} attempting ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'Access denied',
        error_type: 'ip_not_allowed'
      });
    }
    
    next();
  };
}

module.exports = {
  applySecurity,
  createRateLimit,
  createSlowDown,
  createCustomRateLimit,
  securityHeaders,
  compressionMiddleware,
  securityLogger,
  bodySizeLimit,
  ipWhitelist,
  securityConfig
};