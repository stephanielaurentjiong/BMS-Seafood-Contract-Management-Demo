/**
 * @fileoverview Validation Middleware
 * 
 * Express middleware for request validation using Joi schemas.
 * Provides comprehensive validation for body, query parameters, and URL parameters.
 * 
 * Features:
 * - Request body validation
 * - Query parameter validation and sanitization
 * - URL parameter validation
 * - Detailed error responses
 * - Request preprocessing and sanitization
 * 
 */

const Joi = require('joi');

/**
 * Create validation middleware for request body
 * 
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
const validateBody = (schema, options = {}) => {
  return (req, res, next) => {
    const defaultOptions = {
      abortEarly: false, // Return all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert values to correct types
      ...options
    };

    const { error, value } = schema.validate(req.body, defaultOptions);
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      console.log(`Request body validation failed for ${req.method} ${req.path}:`, validationErrors);
      
      return res.status(400).json({
        message: 'Request validation failed',
        errors: validationErrors,
        error_type: 'validation_error'
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    
    console.log(`Request body validation passed for ${req.method} ${req.path}`);
    next();
  };
};

/**
 * Create validation middleware for query parameters
 * 
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema, options = {}) => {
  return (req, res, next) => {
    const defaultOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      convert: true,
      ...options
    };

    const { error, value } = schema.validate(req.query, defaultOptions);
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      console.log(`Query parameter validation failed for ${req.method} ${req.path}:`, validationErrors);
      
      return res.status(400).json({
        message: 'Query parameter validation failed',
        errors: validationErrors,
        error_type: 'validation_error'
      });
    }

    // Replace query parameters with validated and sanitized data
    req.query = value;
    
    console.log(`Query parameter validation passed for ${req.method} ${req.path}`);
    next();
  };
};

/**
 * Create validation middleware for URL parameters
 * 
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
const validateParams = (schema, options = {}) => {
  return (req, res, next) => {
    const defaultOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      convert: true,
      ...options
    };

    const { error, value } = schema.validate(req.params, defaultOptions);
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      console.log(`URL parameter validation failed for ${req.method} ${req.path}:`, validationErrors);
      
      return res.status(400).json({
        message: 'URL parameter validation failed',
        errors: validationErrors,
        error_type: 'validation_error'
      });
    }

    // Replace URL parameters with validated and sanitized data
    req.params = value;
    
    console.log(`URL parameter validation passed for ${req.method} ${req.path}`);
    next();
  };
};

/**
 * Combined validation middleware for all request parts
 * 
 * @param {Object} schemas - Object containing validation schemas
 * @param {Joi.Schema} schemas.body - Body validation schema
 * @param {Joi.Schema} schemas.query - Query parameter validation schema
 * @param {Joi.Schema} schemas.params - URL parameter validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
const validate = (schemas, options = {}) => {
  return (req, res, next) => {
    const validationErrors = [];
    const defaultOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      convert: true,
      ...options
    };

    // Validate body if schema provided
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, defaultOptions);
      if (error) {
        error.details.forEach(detail => {
          validationErrors.push({
            location: 'body',
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          });
        });
      } else {
        req.body = value;
      }
    }

    // Validate query parameters if schema provided
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, defaultOptions);
      if (error) {
        error.details.forEach(detail => {
          validationErrors.push({
            location: 'query',
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          });
        });
      } else {
        req.query = value;
      }
    }

    // Validate URL parameters if schema provided
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, defaultOptions);
      if (error) {
        error.details.forEach(detail => {
          validationErrors.push({
            location: 'params',
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          });
        });
      } else {
        req.params = value;
      }
    }

    // Return errors if any validation failed
    if (validationErrors.length > 0) {
      console.log(`Combined validation failed for ${req.method} ${req.path}:`, validationErrors);
      
      return res.status(400).json({
        message: 'Request validation failed',
        errors: validationErrors,
        error_type: 'validation_error'
      });
    }

    console.log(`Combined validation passed for ${req.method} ${req.path}`);
    next();
  };
};

/**
 * Middleware to sanitize and preprocess request data
 * Removes potential security risks and normalizes data
 * 
 * @param {Object} options - Sanitization options
 * @returns {Function} Express middleware function
 */
const sanitize = (options = {}) => {
  return (req, res, next) => {
    const {
      trimStrings = true,
      removeNullBytes = true,
      normalizeEmails = true,
      logSanitization = false
    } = options;

    // Helper function to recursively sanitize objects
    const sanitizeObject = (obj) => {
      if (obj === null || obj === undefined) return obj;
      
      if (typeof obj === 'string') {
        let sanitized = obj;
        
        // Remove null bytes
        if (removeNullBytes) {
          sanitized = sanitized.replace(/\0/g, '');
        }
        
        // Trim whitespace
        if (trimStrings) {
          sanitized = sanitized.trim();
        }
        
        return sanitized;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (typeof obj === 'object') {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitizedObj[key] = sanitizeObject(value);
        }
        return sanitizedObj;
      }
      
      return obj;
    };

    // Sanitize request body
    if (req.body) {
      const originalBody = logSanitization ? JSON.stringify(req.body) : null;
      req.body = sanitizeObject(req.body);
      
      // Normalize email fields
      if (normalizeEmails && req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      
      if (logSanitization && originalBody !== JSON.stringify(req.body)) {
        console.log(`🧹 Request body sanitized for ${req.method} ${req.path}`);
      }
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  };
};

/**
 * Error handler middleware for validation errors
 * Catches any validation errors that weren't handled by validation middleware
 * 
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (error, req, res, next) => {
  if (error.isJoi || error.name === 'ValidationError') {
    console.error(`Unhandled validation error for ${req.method} ${req.path}:`, error.message);
    
    return res.status(400).json({
      message: 'Request validation failed',
      error: error.message,
      error_type: 'validation_error'
    });
  }
  
  // Pass non-validation errors to next error handler
  next(error);
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  validate,
  sanitize,
  handleValidationErrors
};