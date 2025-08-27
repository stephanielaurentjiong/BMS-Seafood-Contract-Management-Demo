/**
 * @fileoverview Contract Model
 * 
 * Data access layer for contract management operations.
 * Handles contract CRUD operations, supplier relationships, and business logic.
 * 
 * Features:
 * - Role-based contract filtering
 * - Supplier relationship management
 * - Contract status management
 * - JSONB data handling for pricing and deliveries
 * - Unique ID generation and validation
 * 
 */

const BaseModel = require('./BaseModel');
const User = require('./User');

/**
 * Contract Model for handling contract data operations
 * 
 * @class Contract
 * @extends BaseModel
 */
class Contract extends BaseModel {
  static tableName = 'contracts';

  /**
   * Contract types enumeration
   * @readonly
   */
  static TYPES = {
    NEW: 'New',
    ADD: 'Add',
    CHANGE: 'Change'
  };

  /**
   * Contract status enumeration
   * @readonly
   */
  static STATUS = {
    OPEN: 'Open',
    CLOSED: 'Closed'
  };

  /**
   * Generate unique contract ID (L + timestamp + random)
   * Format: L{8-digit-timestamp}.{3-digit-random}.00
   * 
   * @returns {string} Unique contract ID
   */
  static generateUniqueId() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `L${timestamp}.${random}.00`;
  }

  /**
   * Validate contract data before save
   * 
   * @param {Object} contractData - Contract data to validate
   * @throws {Error} If validation fails
   */
  static validateContractData(contractData) {
    const { contract_type, supplier_id, supplier_name, base_pricing } = contractData;

    // Required fields validation
    if (!contract_type) {
      throw new Error('Contract type is required');
    }

    if (!supplier_id && !supplier_name) {
      throw new Error('Either supplier_id or supplier_name is required');
    }

    if (!base_pricing || !Array.isArray(base_pricing) || base_pricing.length === 0) {
      throw new Error('Base pricing is required and must be a non-empty array');
    }

    // Validate contract type
    if (!Object.values(this.TYPES).includes(contract_type)) {
      throw new Error(`Invalid contract type. Must be one of: ${Object.values(this.TYPES).join(', ')}`);
    }

    // Validate base pricing structure
    base_pricing.forEach((pricing, index) => {
      if (typeof pricing.size !== 'number' || pricing.size <= 0) {
        throw new Error(`Base pricing item ${index + 1}: size must be a positive number`);
      }
      if (typeof pricing.price !== 'number' || pricing.price < 0) {
        throw new Error(`Base pricing item ${index + 1}: price must be a non-negative number`);
      }
    });
  }

  /**
   * Create a new contract
   * 
   * @param {Object} contractData - Contract data
   * @param {string} createdById - ID of user creating the contract
   * @returns {Promise<Object>} Created contract
   * @throws {Error} If validation fails or supplier not found
   */
  static async create(contractData, createdById) {
    // Validate input data
    this.validateContractData(contractData);

    const { 
      contract_type, 
      supplier_id, 
      supplier_name, 
      base_pricing, 
      size_penalties = [],
      status = this.STATUS.OPEN
    } = contractData;

    // Validate and get supplier information if supplier_id provided
    let validatedSupplierId = supplier_id;
    let displayName = supplier_name;

    if (supplier_id) {
      const supplier = await User.findById(supplier_id);
      if (!supplier || supplier.role !== User.ROLES.SUPPLIER) {
        throw new Error('Invalid supplier_id: supplier not found or user is not a supplier');
      }
      
      // Use supplier's actual name as default display name if not provided
      if (!displayName) {
        displayName = supplier.name;
      }
    }

    // Generate unique contract ID
    const uniqueId = this.generateUniqueId();

    // Prepare contract data for database
    const contractDbData = {
      unique_id: uniqueId,
      contract_type,
      supplier_id: validatedSupplierId,
      supplier_name: displayName,
      status,
      created_by: createdById,
      base_pricing: JSON.stringify(base_pricing),
      size_penalties: JSON.stringify(size_penalties),
      deliveries: JSON.stringify([]), // Empty initially
      supplier_filled: false
    };

    const newContract = await super.create(this.tableName, contractDbData);
    
    // Parse JSON fields for response
    newContract.base_pricing = JSON.parse(newContract.base_pricing || '[]');
    newContract.size_penalties = JSON.parse(newContract.size_penalties || '[]');
    newContract.deliveries = JSON.parse(newContract.deliveries || '[]');

    console.log(`Contract created: ${newContract.unique_id} by user ${createdById} for supplier ${displayName || 'N/A'}`);
    return newContract;
  }

  /**
   * Find contract by ID (database UUID)
   * 
   * @param {string} id - Contract database ID
   * @returns {Promise<Object|null>} Contract with parsed JSON fields
   */
  static async findById(id) {
    const contract = await super.findById(this.tableName, id);
    return this.parseJsonFields(contract);
  }

  /**
   * Find contract by unique ID (business ID like L123.456.00)
   * 
   * @param {string} uniqueId - Contract unique ID
   * @returns {Promise<Object|null>} Contract with parsed JSON fields
   */
  static async findByUniqueId(uniqueId) {
    const contracts = await super.findBy(this.tableName, 'unique_id', uniqueId);
    return this.parseJsonFields(contracts[0] || null);
  }

  /**
   * Get contracts filtered by user role
   * 
   * @param {Object} user - User object with role
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of contracts with metadata
   */
  static async getByUserRole(user, options = {}) {
    let query, params, operation;

    switch (user.role) {
      case User.ROLES.GENERAL_MANAGER:
        // GM sees contracts they created
        query = `
          SELECT c.*, u.name as supplier_user_name, u.email as supplier_email
          FROM ${this.tableName} c
          LEFT JOIN users u ON c.supplier_id = u.id
          WHERE c.created_by = $1
          ORDER BY c.created_at DESC
        `;
        params = [user.id];
        operation = 'get contracts for general manager';
        break;

      case User.ROLES.SUPPLIER:
        // Supplier sees contracts assigned to them
        query = `
          SELECT c.*, u.name as creator_name, u.email as creator_email
          FROM ${this.tableName} c
          LEFT JOIN users u ON c.created_by = u.id
          WHERE c.supplier_id = $1 OR (c.supplier_id IS NULL AND LOWER(c.supplier_name) = LOWER($2))
          ORDER BY c.created_at DESC
        `;
        params = [user.id, user.name];
        operation = 'get contracts for supplier';
        break;

      case User.ROLES.ADMINISTRATOR:
        // Admin sees all contracts
        query = `
          SELECT c.*, 
                 u1.name as supplier_user_name, u1.email as supplier_email,
                 u2.name as creator_name, u2.email as creator_email
          FROM ${this.tableName} c
          LEFT JOIN users u1 ON c.supplier_id = u1.id
          LEFT JOIN users u2 ON c.created_by = u2.id
          ORDER BY c.created_at DESC
        `;
        params = [];
        operation = 'get all contracts for administrator';
        break;

      default:
        throw new Error(`Invalid user role: ${user.role}`);
    }

    const result = await this.query(query, params, operation);
    
    const contracts = result.rows.map(contract => this.parseJsonFields(contract));
    
    console.log(`Retrieved ${contracts.length} contracts for ${user.email} (${user.role})`);
    
    return {
      contracts,
      count: contracts.length,
      user_role: user.role
    };
  }

  /**
   * Update contract status (General Manager only)
   * 
   * @param {string} contractId - Contract ID (database UUID)
   * @param {string} newStatus - New status (Open/Closed)
   * @param {string} userId - ID of user making the change
   * @returns {Promise<Object|null>} Updated contract
   * @throws {Error} If user doesn't have permission or invalid status
   */
  static async updateStatus(contractId, newStatus, userId) {
    // Validate status
    if (!Object.values(this.STATUS).includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(this.STATUS).join(', ')}`);
    }

    // Check if contract exists and user has permission
    const contract = await this.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.created_by !== userId) {
      throw new Error('Only the contract creator can update its status');
    }

    // Update status
    const updatedContract = await super.updateById(
      this.tableName,
      contractId,
      { status: newStatus }
    );

    const parsedContract = this.parseJsonFields(updatedContract);
    
    console.log(`Contract status updated: ${contract.unique_id} → ${newStatus} by user ${userId}`);
    return parsedContract;
  }

  /**
   * Update contract by ID (General Manager only)
   * 
   * @param {string} contractId - Contract ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated contract with parsed JSON fields
   * @throws {Error} If contract not found or update fails
   */
  static async updateById(contractId, updateData) {
    const updatedContract = await super.updateById(
      this.tableName,
      contractId,
      updateData
    );

    if (!updatedContract) {
      return null;
    }

    // Parse JSON fields for response
    const parsedContract = this.parseJsonFields(updatedContract);
    
    console.log(`Contract updated: ${parsedContract.unique_id || contractId}`);
    return parsedContract;
  }

  /**
   * Update contract deliveries (Supplier only)
   * 
   * @param {string} contractId - Contract ID
   * @param {Array} deliveries - Array of delivery objects
   * @param {string} supplierId - ID of supplier making the change
   * @returns {Promise<Object|null>} Updated contract
   * @throws {Error} If supplier doesn't have permission
   */
  static async updateDeliveries(contractId, deliveries, supplierId, contractType = null) {
    // Check if contract exists and supplier has permission
    const contract = await this.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.supplier_id !== supplierId) {
      throw new Error('Only the assigned supplier can update deliveries');
    }

    // Validate deliveries structure
    if (!Array.isArray(deliveries)) {
      throw new Error('Deliveries must be an array');
    }

    // Prepare update data
    const updateData = { 
      deliveries: JSON.stringify(deliveries),
      supplier_filled: true
    };

    // Add contract type if provided
    if (contractType && contractType !== contract.contract_type) {
      updateData.contract_type = contractType;
      console.log(`Contract ${contract.unique_id} type changed from "${contract.contract_type}" to "${contractType}" by supplier ${supplierId}`);
    }

    // Update deliveries and potentially contract type
    const updatedContract = await super.updateById(
      this.tableName,
      contractId,
      updateData
    );

    const parsedContract = this.parseJsonFields(updatedContract);
    
    console.log(`Contract deliveries updated: ${contract.unique_id} by supplier ${supplierId}`);
    if (contractType) {
      console.log(`Contract type updated to: ${contractType}`);
    }
    
    return parsedContract;
  }

  /**
   * Delete contract (General Manager only)
   * 
   * @param {string} contractId - Contract ID
   * @param {string} userId - ID of user deleting the contract
   * @returns {Promise<boolean>} True if deleted successfully
   * @throws {Error} If user doesn't have permission
   */
  static async deleteById(contractId, userId) {
    // Check if contract exists and user has permission
    const contract = await this.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.created_by !== userId) {
      throw new Error('Only the contract creator can delete it');
    }

    const deleted = await super.deleteById(this.tableName, contractId);
    
    if (deleted) {
      console.log(`Contract deleted: ${contract.unique_id} by user ${userId}`);
    }
    
    return deleted;
  }

  /**
   * Get contract statistics
   * 
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics() {
    const query = `
      SELECT 
        status,
        contract_type,
        COUNT(*) as count,
        AVG(array_length(COALESCE(base_pricing::jsonb, '[]'::jsonb)::jsonb[], 1)) as avg_pricing_entries
      FROM ${this.tableName}
      GROUP BY status, contract_type
      ORDER BY status, contract_type
    `;
    
    const result = await this.query(query, [], 'get contract statistics');
    
    const stats = {
      total: 0,
      by_status: {},
      by_type: {}
    };
    
    result.rows.forEach(row => {
      const count = parseInt(row.count);
      stats.total += count;
      
      if (!stats.by_status[row.status]) {
        stats.by_status[row.status] = 0;
      }
      stats.by_status[row.status] += count;
      
      if (!stats.by_type[row.contract_type]) {
        stats.by_type[row.contract_type] = 0;
      }
      stats.by_type[row.contract_type] += count;
    });
    
    return stats;
  }

  /**
   * Parse JSON fields in contract object
   * 
   * @param {Object|null} contract - Contract object from database
   * @returns {Object|null} Contract with parsed JSON fields
   * @private
   */
  static parseJsonFields(contract) {
    if (!contract) return null;

    // Parse base_pricing
    try {
      if (typeof contract.base_pricing === 'string') {
        contract.base_pricing = JSON.parse(contract.base_pricing || '[]');
      } else if (!Array.isArray(contract.base_pricing)) {
        contract.base_pricing = [];
      }
    } catch (error) {
      console.error('Error parsing base_pricing:', contract.base_pricing, error);
      contract.base_pricing = [];
    }

    // Parse size_penalties
    try {
      if (typeof contract.size_penalties === 'string') {
        contract.size_penalties = JSON.parse(contract.size_penalties || '[]');
      } else if (!Array.isArray(contract.size_penalties)) {
        contract.size_penalties = [];
      }
    } catch (error) {
      console.error('Error parsing size_penalties:', contract.size_penalties, error);
      contract.size_penalties = [];
    }

    // Parse deliveries
    try {
      if (typeof contract.deliveries === 'string') {
        contract.deliveries = JSON.parse(contract.deliveries || '[]');
      } else if (!Array.isArray(contract.deliveries)) {
        contract.deliveries = [];
      }
    } catch (error) {
      console.error('Error parsing deliveries:', contract.deliveries, error);
      contract.deliveries = [];
    }

    return contract;
  }
}

module.exports = Contract;