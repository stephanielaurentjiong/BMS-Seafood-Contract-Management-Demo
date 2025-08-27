/**
 * @fileoverview Logger Service
 * 
 * Centralized logging service using Winston for structured logging.
 * Provides logging capabilities for contract management operations with
 * console output for development and file storage for production.
 * 
 * Features:
 * - Structured JSON logging for production
 * - Readable console output for development
 * - Contract-specific logging methods
 * - Error tracking and audit trails
 * - Configurable log levels
 * 
 */

const winston = require('winston');
const path = require('path');

/**
 * Configure Winston logger with multiple transports
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'contract-management',
    version: '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let output = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            output += ` ${JSON.stringify(meta)}`;
          }
          return output;
        })
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/app.log'),
      format: winston.format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Separate file for contract changes (audit trail)
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/contract-changes.log'),
      level: 'info',
      format: winston.format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    
    // Error-only file
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: winston.format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

/**
 * Logger Service with contract-specific methods
 */
class LoggerService {
  
  /**
   * Log supplier contract type changes
   * 
   * @param {Object} data - Contract change data
   * @param {string} data.supplierId - ID of supplier making change
   * @param {string} data.supplierEmail - Email of supplier making change
   * @param {string} data.contractId - Contract ID being modified
   * @param {string} data.oldType - Previous contract type
   * @param {string} data.newType - New contract type
   * @param {number} data.deliveryCount - Number of deliveries after change
   * @param {string} data.changeDetails - Description of what changed
   */
  static logContractTypeChange(data) {
    logger.info('Contract type changed by supplier', {
      category: 'CONTRACT_TYPE_CHANGE',
      supplierId: data.supplierId,
      supplierEmail: data.supplierEmail,
      contractId: data.contractId,
      oldType: data.oldType,
      newType: data.newType,
      deliveryCount: data.deliveryCount,
      changeDetails: data.changeDetails,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log contract delivery updates
   * 
   * @param {Object} data - Delivery update data
   * @param {string} data.contractId - Contract ID
   * @param {string} data.supplierId - Supplier ID
   * @param {string} data.supplierEmail - Supplier email
   * @param {string} data.action - Type of action (Add, Change, Update)
   * @param {number} data.originalCount - Original delivery count
   * @param {number} data.newCount - New delivery count
   * @param {Array} data.modifications - List of specific modifications
   */
  static logDeliveryUpdate(data) {
    logger.info('Contract deliveries updated', {
      category: 'DELIVERY_UPDATE',
      contractId: data.contractId,
      supplierId: data.supplierId,
      supplierEmail: data.supplierEmail,
      action: data.action,
      originalDeliveryCount: data.originalCount,
      newDeliveryCount: data.newCount,
      deliveriesAdded: data.newCount - data.originalCount,
      modifications: data.modifications || [],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log contract creation
   * 
   * @param {Object} data - Contract creation data
   * @param {string} data.contractId - New contract ID
   * @param {string} data.createdBy - User ID who created contract
   * @param {string} data.supplierId - Assigned supplier ID
   * @param {string} data.contractType - Initial contract type
   */
  static logContractCreation(data) {
    logger.info('Contract created', {
      category: 'CONTRACT_CREATION',
      contractId: data.contractId,
      createdBy: data.createdBy,
      supplierId: data.supplierId,
      contractType: data.contractType,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log general contract operations
   * 
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  static log(level, message, meta = {}) {
    logger.log(level, message, {
      category: 'CONTRACT_OPERATION',
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log errors with stack traces
   * 
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  static logError(message, error, context = {}) {
    logger.error(message, {
      category: 'ERROR',
      error: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get the underlying Winston logger instance
   * 
   * @returns {winston.Logger} Winston logger instance
   */
  static getLogger() {
    return logger;
  }
}

module.exports = LoggerService;