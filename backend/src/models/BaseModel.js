/**
 * @fileoverview Base Model Class
 * 
 * Provides common database operations and utilities for all models.
 * Implements consistent error handling and logging across data access layer.
 * 
 * Features:
 * - Connection pool management
 * - Standardized error handling
 * - Query logging and performance tracking
 * - Base CRUD operations template
 * 
 */

const pool = require('../config/database');

/**
 * Base Model class providing common database operations
 * All model classes should extend this base class for consistency
 * 
 * @class BaseModel
 */
class BaseModel {
  /**
   * Execute a database query with error handling and logging
   * 
   * @param {string} query - SQL query string
   * @param {Array} params - Query parameters
   * @param {string} operation - Description of operation for logging
   * @returns {Promise<Object>} Query result
   * @throws {Error} Database operation errors
   * 
   * @example
   * ```javascript
   * const result = await BaseModel.query(
   *   'SELECT * FROM users WHERE id = $1',
   *   [userId],
   *   'fetch user by ID'
   * );
   * ```
   */
  static async query(query, params = [], operation = 'database operation') {
    const startTime = Date.now();
    
    try {
      console.log(`DB Query [${operation}]: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
      console.log(`Parameters: ${JSON.stringify(params)}`);
      
      const result = await pool.query(query, params);
      const duration = Date.now() - startTime;
      
      console.log(`DB Success [${operation}]: ${result.rowCount} rows, ${duration}ms`);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`DB Error [${operation}] after ${duration}ms:`, error.message);
      console.error(`Failed Query: ${query}`);
      console.error(`Parameters: ${JSON.stringify(params)}`);
      
      // Re-throw with enhanced error context
      const enhancedError = new Error(`Database ${operation} failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.query = query;
      enhancedError.params = params;
      throw enhancedError;
    }
  }

  /**
   * Find a single record by ID
   * 
   * @param {string} tableName - Database table name
   * @param {string|number} id - Record ID
   * @param {string} idColumn - ID column name (default: 'id')
   * @returns {Promise<Object|null>} Record or null if not found
   */
  static async findById(tableName, id, idColumn = 'id') {
    const query = `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`;
    const result = await this.query(query, [id], `find ${tableName} by ${idColumn}`);
    return result.rows[0] || null;
  }

  /**
   * Find records by field value
   * 
   * @param {string} tableName - Database table name
   * @param {string} field - Field name to search
   * @param {any} value - Field value to match
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {string} options.orderBy - Order by field
   * @param {string} options.order - Order direction (ASC/DESC)
   * @returns {Promise<Array>} Array of matching records
   */
  static async findBy(tableName, field, value, options = {}) {
    let query = `SELECT * FROM ${tableName} WHERE ${field} = $1`;
    const params = [value];
    
    if (options.orderBy) {
      const order = options.order || 'ASC';
      query += ` ORDER BY ${options.orderBy} ${order}`;
    }
    
    if (options.limit) {
      query += ` LIMIT $2`;
      params.push(options.limit);
    }
    
    const result = await this.query(query, params, `find ${tableName} by ${field}`);
    return result.rows;
  }

  /**
   * Insert a new record
   * 
   * @param {string} tableName - Database table name
   * @param {Object} data - Data to insert
   * @param {string} returning - Columns to return (default: '*')
   * @returns {Promise<Object>} Inserted record
   */
  static async create(tableName, data, returning = '*') {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${fields.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING ${returning}
    `;
    
    const result = await this.query(query, values, `create ${tableName}`);
    return result.rows[0];
  }

  /**
   * Update record by ID
   * 
   * @param {string} tableName - Database table name
   * @param {string|number} id - Record ID
   * @param {Object} data - Data to update
   * @param {string} idColumn - ID column name (default: 'id')
   * @param {string} returning - Columns to return (default: '*')
   * @returns {Promise<Object|null>} Updated record or null if not found
   */
  static async updateById(tableName, id, data, idColumn = 'id', returning = '*') {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE ${tableName} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE ${idColumn} = $${fields.length + 1} 
      RETURNING ${returning}
    `;
    
    const result = await this.query(query, [...values, id], `update ${tableName}`);
    return result.rows[0] || null;
  }

  /**
   * Delete record by ID
   * 
   * @param {string} tableName - Database table name
   * @param {string|number} id - Record ID
   * @param {string} idColumn - ID column name (default: 'id')
   * @returns {Promise<boolean>} True if record was deleted
   */
  static async deleteById(tableName, id, idColumn = 'id') {
    const query = `DELETE FROM ${tableName} WHERE ${idColumn} = $1`;
    const result = await this.query(query, [id], `delete ${tableName}`);
    return result.rowCount > 0;
  }

  /**
   * Count records in table
   * 
   * @param {string} tableName - Database table name
   * @param {string} whereClause - Optional WHERE clause
   * @param {Array} params - Parameters for WHERE clause
   * @returns {Promise<number>} Record count
   */
  static async count(tableName, whereClause = '', params = []) {
    const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
    const result = await this.query(query, params, `count ${tableName}`);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if record exists
   * 
   * @param {string} tableName - Database table name
   * @param {string} field - Field name to check
   * @param {any} value - Field value to match
   * @returns {Promise<boolean>} True if record exists
   */
  static async exists(tableName, field, value) {
    const query = `SELECT 1 FROM ${tableName} WHERE ${field} = $1 LIMIT 1`;
    const result = await this.query(query, [value], `check ${tableName} exists`);
    return result.rowCount > 0;
  }
}

module.exports = BaseModel;