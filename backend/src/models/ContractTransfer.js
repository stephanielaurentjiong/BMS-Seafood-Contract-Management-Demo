/**
 * @fileoverview Contract Transfer Model
 * 
 * Model for managing contract transfers to Database System.
 * Handles the transfer of finalized contract data into the database system.
 * 
 */

const pool = require('../config/database');

/**
 * ContractTransfer model class
 * 
 * Manages contract transfer operations including:
 * - Creating transfer records
 * - Querying transferred contracts  
 * - Updating transfer status
 * 
 * @class ContractTransfer
 */
class ContractTransfer {
  /**
   * Create a new contract transfer record
   * 
   * @param {Object} transferData - Transfer data
   * @param {string} transferData.contractId - Original contract unique_id
   * @param {string} transferData.originalContractUuid - Original contract UUID
   * @param {string} transferData.transferredBy - UUID of user performing transfer
   * @param {string} transferData.supplierName - Supplier name
   * @param {Array} transferData.bongkar - Delivery dates
   * @param {Array} transferData.sizeRanges - Size ranges
   * @param {Array} transferData.tons - Delivery quantities
   * @param {Object} transferData.dynamicPricing - Pricing structure
   * @param {Object} transferData.sizePenalties - Size penalties
   * @returns {Promise<Object>} Created transfer record
   */
  static async createTransfer(transferData) {
    const {
      contractId,
      originalContractUuid,
      transferredBy,
      supplierName,
      bongkar,
      sizeRanges,
      tons,
      dynamicPricing,
      sizePenalties
    } = transferData;

    const query = `
      INSERT INTO contract_transfers (
        contract_id, original_contract_uuid, transferred_by, supplier_name,
        bongkar, size_ranges, tons, dynamic_pricing, size_penalties,
        index_value, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      contractId,
      originalContractUuid,
      transferredBy,
      supplierName,
      JSON.stringify(bongkar),
      JSON.stringify(sizeRanges),
      JSON.stringify(tons),
      JSON.stringify(dynamicPricing),
      JSON.stringify(sizePenalties),
      0, // index_value - zeroed out for now
      '', // notes - empty for now
      'Transferred'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get all transferred contracts
   * 
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of records to return
   * @param {number} options.offset - Number of records to skip
   * @param {string} options.orderBy - Column to order by
   * @param {string} options.order - Order direction (ASC/DESC)
   * @returns {Promise<Object>} Result with transfers and count
   */
  static async getAllTransfers(options = {}) {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'transfer_date',
      order = 'DESC'
    } = options;

    // Validate orderBy to prevent SQL injection
    const validColumns = ['transfer_date', 'contract_id', 'supplier_name', 'status'];
    const safeOrderBy = validColumns.includes(orderBy) ? orderBy : 'transfer_date';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        ct.*,
        u.name as transferred_by_name,
        u.email as transferred_by_email
      FROM contract_transfers ct
      LEFT JOIN users u ON ct.transferred_by = u.id
      ORDER BY ct.${safeOrderBy} ${safeOrder}
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) FROM contract_transfers`;

    const [transfers, count] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);

    return {
      transfers: transfers.rows.map(row => ({
        ...row,
        bongkar: typeof row.bongkar === 'string' ? JSON.parse(row.bongkar) : row.bongkar || [],
        size_ranges: typeof row.size_ranges === 'string' ? JSON.parse(row.size_ranges) : row.size_ranges || [],
        tons: typeof row.tons === 'string' ? JSON.parse(row.tons) : row.tons || [],
        dynamic_pricing: typeof row.dynamic_pricing === 'string' ? JSON.parse(row.dynamic_pricing) : row.dynamic_pricing || {},
        size_penalties: typeof row.size_penalties === 'string' ? JSON.parse(row.size_penalties) : row.size_penalties || []
      })),
      total: parseInt(count.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Get transferred contract by ID
   * 
   * @param {string} transferId - Transfer UUID
   * @returns {Promise<Object|null>} Transfer record or null if not found
   */
  static async getTransferById(transferId) {
    const query = `
      SELECT 
        ct.*,
        u.name as transferred_by_name,
        u.email as transferred_by_email
      FROM contract_transfers ct
      LEFT JOIN users u ON ct.transferred_by = u.id
      WHERE ct.id = $1
    `;

    const result = await pool.query(query, [transferId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      bongkar: JSON.parse(row.bongkar || '[]'),
      size_ranges: JSON.parse(row.size_ranges || '[]'),
      tons: JSON.parse(row.tons || '[]'),
      dynamic_pricing: JSON.parse(row.dynamic_pricing || '{}'),
      size_penalties: JSON.parse(row.size_penalties || '[]')
    };
  }

  /**
   * Check if contract has already been transferred
   * 
   * @param {string} contractUuid - Original contract UUID
   * @returns {Promise<boolean>} True if already transferred
   */
  static async isContractTransferred(contractUuid) {
    const query = `
      SELECT COUNT(*) FROM contract_transfers 
      WHERE original_contract_uuid = $1
    `;

    const result = await pool.query(query, [contractUuid]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Update transfer status
   * 
   * @param {string} transferId - Transfer UUID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated transfer record
   */
  static async updateTransferStatus(transferId, status) {
    const validStatuses = ['Transferred', 'Processed', 'Archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const query = `
      UPDATE contract_transfers 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, transferId]);
    
    if (result.rows.length === 0) {
      throw new Error('Transfer not found');
    }

    return result.rows[0];
  }
}

module.exports = ContractTransfer;