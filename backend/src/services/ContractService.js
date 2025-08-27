/**
 * @fileoverview Contract Service Layer
 * 
 * Business logic layer for contract operations.
 * Handles complex business rules, pricing calculations, and workflow management.
 * 
 * Features:
 * - Contract creation and validation workflows
 * - Complex pricing logic and interpolation
 * - Supplier assignment and notification
 * - Contract status transition management
 * - Business rule enforcement
 * 
 */

const Contract = require('../models/Contract');
const User = require('../models/User');
const EmailService = require('./EmailService');
const CacheService = require('./CacheService');

/**
 * Contract Service for business logic operations
 * 
 * @class ContractService
 */
class ContractService {
  /**
   * Create a new contract with full business logic validation
   * 
   * @param {Object} contractData - Contract creation data
   * @param {string} createdById - ID of user creating the contract
   * @returns {Promise<Object>} Created contract with business context
   * @throws {Error} If business rules are violated
   */
  static async createContract(contractData, createdById) {
    try {
      // 1. Validate creator permissions
      const creator = await User.findById(createdById);
      if (!creator || creator.role !== User.ROLES.GENERAL_MANAGER) {
        throw new Error('Only General Managers can create contracts');
      }

      // 2. Validate and enrich supplier data
      const supplierData = await this.validateAndGetSupplier(contractData);
      
      // 3. Apply business rules to pricing data
      const validatedPricing = await this.validatePricingBusinessRules(contractData.base_pricing);
      
      // 4. Create contract using model
      const newContract = await Contract.create({
        ...contractData,
        base_pricing: validatedPricing,
        supplier_id: supplierData.id,
        supplier_name: supplierData.displayName
      }, createdById);

      // 5. Post-creation business logic
      await this.handlePostContractCreation(newContract, supplierData, creator);

      console.log(`🎯 Contract created via service: ${newContract.unique_id}`);
      return newContract;

    } catch (error) {
      console.error('Contract creation service error:', error);
      throw error;
    }
  }

  /**
   * Validate and retrieve supplier information
   * 
   * @param {Object} contractData - Contract data with supplier info
   * @returns {Promise<Object>} Validated supplier data
   * @private
   */
  static async validateAndGetSupplier(contractData) {
    const { supplier_id, supplier_name } = contractData;

    if (supplier_id) {
      // ID-based supplier (modern approach)
      const supplier = await User.findById(supplier_id);
      if (!supplier || supplier.role !== User.ROLES.SUPPLIER) {
        throw new Error('Invalid supplier: User not found or not a supplier');
      }

      return {
        id: supplier.id,
        displayName: supplier_name || supplier.name,
        email: supplier.email,
        actualName: supplier.name
      };
    } else if (supplier_name) {
      // Name-based supplier (legacy support)
      const suppliers = await User.findByRole(User.ROLES.SUPPLIER);
      const matchingSupplier = suppliers.find(s => 
        s.name.toLowerCase() === supplier_name.toLowerCase()
      );

      return {
        id: matchingSupplier?.id || null,
        displayName: supplier_name,
        email: matchingSupplier?.email || null,
        actualName: matchingSupplier?.name || supplier_name
      };
    } else {
      throw new Error('Either supplier_id or supplier_name must be provided');
    }
  }

  /**
   * Validate pricing data against business rules
   * 
   * @param {Array} basePricing - Array of size/price objects
   * @returns {Promise<Array>} Validated and possibly adjusted pricing
   * @private
   */
  static async validatePricingBusinessRules(basePricing) {
    if (!Array.isArray(basePricing) || basePricing.length === 0) {
      throw new Error('Base pricing must be a non-empty array');
    }

    // Sort by size for validation
    const sortedPricing = [...basePricing].sort((a, b) => a.size - b.size);
    
    // Business rule: Check for reasonable pricing patterns
    for (let i = 1; i < sortedPricing.length; i++) {
      const current = sortedPricing[i];
      const previous = sortedPricing[i - 1];
      
      // Validate size progression
      if (current.size <= previous.size) {
        throw new Error(`Invalid size progression: Size ${current.size} must be larger than ${previous.size}`);
      }
      
      // Business rule: Prices should generally decrease as size increases (bigger shrimp = lower count = higher price)
      // Allow some flexibility but flag extreme cases
      if (current.price > previous.price * 2) {
        console.warn(`Pricing warning: Size ${current.size} price (${current.price}) is unusually high compared to size ${previous.size} price (${previous.price})`);
      }
      
      // Business rule: No negative prices
      if (current.price < 0) {
        throw new Error(`Invalid price: Size ${current.size} has negative price ${current.price}`);
      }
    }

    return basePricing;
  }

  /**
   * Handle post-contract creation business logic
   * 
   * @param {Object} contract - Created contract
   * @param {Object} supplierData - Supplier information
   * @param {Object} creator - Contract creator information
   * @private
   */
  static async handlePostContractCreation(contract, supplierData, creator) {
    try {
      // 1. Send notification to supplier (if email available)
      if (supplierData.email) {
        await EmailService.sendContractNotification({
          to: supplierData.email,
          supplierName: supplierData.actualName,
          contractId: contract.unique_id,
          contractType: contract.contract_type,
          createdBy: creator.name
        });
      }

      // 2. Update cache for supplier's contract list
      await CacheService.invalidateSupplierContracts(supplierData.id);
      
      // 3. Update analytics/statistics cache
      await CacheService.invalidateContractStatistics();

      console.log(`Post-creation tasks completed for contract ${contract.unique_id}`);

    } catch (error) {
      // Don't fail contract creation for notification errors
      console.warn('Post-creation task warning:', error.message);
    }
  }

  /**
   * Update contract status with business logic validation
   * 
   * @param {string} contractId - Contract ID
   * @param {string} newStatus - New status
   * @param {string} userId - User making the change
   * @returns {Promise<Object>} Updated contract
   */
  static async updateContractStatus(contractId, newStatus, userId) {
    try {
      // 1. Validate status transition
      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      await this.validateStatusTransition(contract, newStatus, userId);

      // 2. Update status using model
      const updatedContract = await Contract.updateStatus(contractId, newStatus, userId);

      // 3. Handle status-specific business logic
      await this.handleStatusChange(updatedContract, contract.status, newStatus);

      console.log(`Contract status updated via service: ${contract.unique_id} → ${newStatus}`);
      return updatedContract;

    } catch (error) {
      console.error('Status update service error:', error);
      throw error;
    }
  }

  /**
   * Validate status transition rules
   * 
   * @param {Object} contract - Current contract
   * @param {string} newStatus - Proposed new status
   * @param {string} userId - User making the change
   * @private
   */
  static async validateStatusTransition(contract, newStatus, userId) {
    // Business rule: Only contract creator can change status
    if (contract.created_by !== userId) {
      throw new Error('Only the contract creator can change its status');
    }

    // Business rule: Status transition validation
    const validTransitions = {
      'Open': ['Closed'],
      'Closed': ['Open']
    };

    if (!validTransitions[contract.status]?.includes(newStatus)) {
      throw new Error(`Invalid status transition: ${contract.status} → ${newStatus}`);
    }

    // Business rule: Cannot close contract if supplier hasn't filled delivery details
    if (newStatus === 'Closed' && !contract.supplier_filled) {
      console.warn(`Closing contract ${contract.unique_id} without supplier input`);
    }
  }

  /**
   * Handle status change side effects
   * 
   * @param {Object} contract - Updated contract
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @private
   */
  static async handleStatusChange(contract, oldStatus, newStatus) {
    try {
      // Invalidate relevant caches
      await CacheService.invalidateContract(contract.id);
      await CacheService.invalidateContractStatistics();

      // Send notifications based on status
      if (newStatus === 'Closed') {
        // Contract completed - notify supplier
        if (contract.supplier_id) {
          const supplier = await User.findById(contract.supplier_id);
          if (supplier?.email) {
            await EmailService.sendContractStatusNotification({
              to: supplier.email,
              supplierName: supplier.name,
              contractId: contract.unique_id,
              status: 'completed'
            });
          }
        }
      }

      console.log(`Status change handlers completed: ${oldStatus} → ${newStatus}`);

    } catch (error) {
      console.warn('Status change handler warning:', error.message);
    }
  }

  /**
   * Calculate interpolated pricing for any size
   * Business logic for shrimp pricing calculations
   * 
   * @param {Array} basePricing - Base pricing data
   * @param {number} targetSize - Size to calculate price for
   * @returns {Object} Calculation result with price and method
   */
  static calculatePriceForSize(basePricing, targetSize) {
    if (!Array.isArray(basePricing) || basePricing.length === 0) {
      throw new Error('Base pricing data is required');
    }

    if (typeof targetSize !== 'number' || targetSize <= 0) {
      throw new Error('Target size must be a positive number');
    }

    // Sort pricing by size
    const sortedPricing = [...basePricing].sort((a, b) => a.size - b.size);

    // Check for exact match
    const exactMatch = sortedPricing.find(p => p.size === targetSize);
    if (exactMatch) {
      return {
        size: targetSize,
        price: exactMatch.price,
        method: 'exact_match',
        confidence: 'high'
      };
    }

    // Find interpolation bounds
    let lowerBound = null;
    let upperBound = null;

    for (let i = 0; i < sortedPricing.length - 1; i++) {
      if (sortedPricing[i].size < targetSize && sortedPricing[i + 1].size > targetSize) {
        lowerBound = sortedPricing[i];
        upperBound = sortedPricing[i + 1];
        break;
      }
    }

    if (lowerBound && upperBound) {
      // Linear interpolation
      const sizeDiff = upperBound.size - lowerBound.size;
      const priceDiff = upperBound.price - lowerBound.price;
      const ratio = (targetSize - lowerBound.size) / sizeDiff;
      const interpolatedPrice = lowerBound.price + (priceDiff * ratio);

      return {
        size: targetSize,
        price: Math.round(interpolatedPrice),
        method: 'interpolation',
        confidence: 'medium',
        bounds: { lower: lowerBound, upper: upperBound }
      };
    }

    // Extrapolation (less reliable)
    if (targetSize < sortedPricing[0].size) {
      // Below minimum size
      return {
        size: targetSize,
        price: sortedPricing[0].price,
        method: 'extrapolation_low',
        confidence: 'low',
        note: 'Price based on smallest available size'
      };
    } else {
      // Above maximum size
      return {
        size: targetSize,
        price: sortedPricing[sortedPricing.length - 1].price,
        method: 'extrapolation_high',
        confidence: 'low',
        note: 'Price based on largest available size'
      };
    }
  }

  /**
   * Get contract analytics and insights
   * 
   * @param {string} userId - User requesting analytics
   * @param {string} userRole - User role for permission checking
   * @returns {Promise<Object>} Analytics data
   */
  static async getContractAnalytics(userId, userRole) {
    try {
      // Check cache first
      const cached = await CacheService.getContractAnalytics(userId, userRole);
      if (cached) {
        return cached;
      }

      // Generate analytics based on role
      let analytics = {};

      if (userRole === User.ROLES.GENERAL_MANAGER) {
        analytics = await this.generateGMAnalytics(userId);
      } else if (userRole === User.ROLES.SUPPLIER) {
        analytics = await this.generateSupplierAnalytics(userId);
      } else if (userRole === User.ROLES.ADMINISTRATOR) {
        analytics = await this.generateAdminAnalytics();
      }

      // Cache results
      await CacheService.setContractAnalytics(userId, userRole, analytics);

      return analytics;

    } catch (error) {
      console.error('Analytics service error:', error);
      throw error;
    }
  }

  /**
   * Generate analytics for General Manager
   * @private
   */
  static async generateGMAnalytics(userId) {
    const contracts = await Contract.getByUserRole({ id: userId, role: User.ROLES.GENERAL_MANAGER });
    
    return {
      total_contracts: contracts.count,
      contracts_by_status: this.groupBy(contracts.contracts, 'status'),
      contracts_by_type: this.groupBy(contracts.contracts, 'contract_type'),
      recent_activity: contracts.contracts.slice(0, 5),
      completion_rate: this.calculateCompletionRate(contracts.contracts)
    };
  }

  /**
   * Generate analytics for Supplier
   * @private
   */
  static async generateSupplierAnalytics(userId) {
    const contracts = await Contract.getByUserRole({ id: userId, role: User.ROLES.SUPPLIER });
    
    return {
      total_contracts: contracts.count,
      pending_contracts: contracts.contracts.filter(c => c.status === 'Open' && !c.supplier_filled).length,
      completed_contracts: contracts.contracts.filter(c => c.supplier_filled).length,
      recent_contracts: contracts.contracts.slice(0, 5)
    };
  }

  /**
   * Generate analytics for Administrator
   * @private
   */
  static async generateAdminAnalytics() {
    const [contractStats, userStats] = await Promise.all([
      Contract.getStatistics(),
      User.getStatistics()
    ]);

    return {
      contract_statistics: contractStats,
      user_statistics: userStats,
      system_health: {
        total_users: userStats.total,
        total_contracts: contractStats.total,
        active_suppliers: userStats.by_role[User.ROLES.SUPPLIER]?.count || 0
      }
    };
  }

  /**
   * Utility function to group array by property
   * @private
   */
  static groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property];
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Calculate completion rate
   * @private
   */
  static calculateCompletionRate(contracts) {
    if (contracts.length === 0) return 0;
    const completed = contracts.filter(c => c.status === 'Closed').length;
    return Math.round((completed / contracts.length) * 100);
  }
}

module.exports = ContractService;