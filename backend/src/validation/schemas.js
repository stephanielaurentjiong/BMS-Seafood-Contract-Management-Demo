/**
 * @fileoverview Validation Schemas
 * 
 * Joi validation schemas for API request validation.
 * Provides comprehensive input validation and sanitization for all endpoints.
 * 
 * Features:
 * - Request body validation
 * - Query parameter validation
 * - URL parameter validation
 * - Custom validation rules for business logic
 * - Detailed error messages
 * 
 */

const Joi = require('joi');

/**
 * Common validation patterns
 */
const patterns = {
  uuid: Joi.string().uuid().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
  contractId: Joi.string().pattern(/^L\d{8}\.\d{3}\.00$/).message('Contract ID must follow format L12345678.123.00'),
  positiveNumber: Joi.number().positive().required(),
  nonNegativeNumber: Joi.number().min(0).required()
};

/**
 * User validation schemas
 */
const userSchemas = {
  /**
   * User registration validation
   */
  register: Joi.object({
    email: patterns.email,
    name: Joi.string().trim().min(1).max(255).required(),
    password: patterns.password,
    role: Joi.string().valid('general_manager', 'supplier', 'administrator').required()
  }),

  /**
   * User login validation
   */
  login: Joi.object({
    email: patterns.email,
    password: Joi.string().required() // Don't validate length for login
  }),

  /**
   * User update validation
   */
  update: Joi.object({
    name: Joi.string().trim().min(1).max(255).optional(),
    email: Joi.string().email().lowercase().trim().optional()
  }).min(1), // At least one field required

  /**
   * Password change validation
   */
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: patterns.password
  })
};

/**
 * Contract validation schemas
 */
const contractSchemas = {
  /**
   * Contract creation validation
   */
  create: Joi.object({
    contract_type: Joi.string().valid('New', 'Add', 'Change').required(),
    supplier_id: patterns.uuid.optional(),
    supplier_name: Joi.string().trim().min(1).max(255).optional(),
    base_pricing: Joi.array().items(
      Joi.object({
        size: patterns.positiveNumber,
        price: patterns.nonNegativeNumber
      })
    ).min(1).required(),
    size_penalties: Joi.array().items(
      Joi.object({
        range: Joi.string().trim().min(1).max(50).required(),
        penalty_amount: patterns.nonNegativeNumber,
        unit: Joi.string().valid('Rp/s', 'Rp/kg', 'Rp/sz').required()
      })
    ).optional().default([]),
    status: Joi.string().valid('Open', 'Closed').optional().default('Open')
  }).custom((value, helpers) => {
    // Custom validation: require either supplier_id or supplier_name
    if (!value.supplier_id && !value.supplier_name) {
      return helpers.error('custom.supplierRequired');
    }
    return value;
  }).messages({
    'custom.supplierRequired': 'Either supplier_id or supplier_name is required'
  }),

  /**
   * Contract status update validation
   */
  updateStatus: Joi.object({
    status: Joi.string().valid('Open', 'Closed').required()
  }),

  /**
   * Contract deliveries update validation
   */
  updateDeliveries: Joi.object({
    deliveries: Joi.array().items(
      Joi.object({
        date: Joi.string().trim().min(1).max(50).required(),
        quantity: patterns.positiveNumber,
        unit: Joi.string().valid('mt', 'kg', 'ton').required(),
        sizeRange: Joi.string().trim().min(1).max(50).required()
      })
    ).required()
  }),

  /**
   * Contract query parameters validation
   */
  queryParams: Joi.object({
    status: Joi.string().valid('Open', 'Closed').optional(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    orderBy: Joi.string().valid('created_at', 'updated_at', 'unique_id', 'status').optional().default('created_at'),
    order: Joi.string().valid('ASC', 'DESC').optional().default('DESC')
  })
};

/**
 * URL parameter validation schemas
 */
const paramSchemas = {
  /**
   * UUID parameter validation
   */
  id: Joi.object({
    id: patterns.uuid
  }),

  /**
   * Contract unique ID parameter validation
   */
  contractId: Joi.object({
    id: Joi.alternatives().try(
      patterns.uuid,
      patterns.contractId
    ).required()
  })
};

/**
 * Complex validation rules for business logic
 */
const businessRules = {
  /**
   * Validate pricing data for business rules
   * - Prices should generally decrease as size increases (smaller number = bigger shrimp)
   * - No duplicate sizes
   * - Reasonable price ranges
   */
  basePricingBusinessRules: Joi.array().items(
    Joi.object({
      size: Joi.number().positive().max(1000).required(),
      price: Joi.number().min(0).max(1000000).required() // Max 1M Rupiah per unit
    })
  ).custom((value, helpers) => {
    // Check for duplicate sizes
    const sizes = value.map(item => item.size);
    const uniqueSizes = [...new Set(sizes)];
    if (sizes.length !== uniqueSizes.length) {
      return helpers.error('custom.duplicateSizes');
    }

    // Sort by size to validate pricing logic
    const sorted = [...value].sort((a, b) => a.size - b.size);
    
    // Check if prices generally decrease as size increases (optional warning)
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const previous = sorted[i - 1];
      
      // Allow some flexibility in pricing (warning, not error)
      if (current.price > previous.price * 1.5) {
        console.warn(`Pricing warning: Size ${current.size} price (${current.price}) is significantly higher than size ${previous.size} price (${previous.price})`);
      }
    }

    return value;
  }).messages({
    'custom.duplicateSizes': 'Duplicate sizes are not allowed in pricing data'
  })
};

/**
 * Export all validation schemas
 */
module.exports = {
  patterns,
  user: userSchemas,
  contract: contractSchemas,
  params: paramSchemas,
  business: businessRules
};