const pool = require("../config/database");
const Contract = require("../models/Contract");
const ContractTransfer = require("../models/ContractTransfer");
const ContractService = require("../services/ContractService");
const CacheService = require("../services/CacheService");
// const LoggerService = require("../services/LoggerService"); // Temporarily disabled for debugging

// Generate unique contract ID (L + timestamp + random)
const generateUniqueId = () => {
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `L${timestamp}.${random}.00`;
};

// Create new contract
const createContract = async (req, res) => {
  try {
    const { contract_type, supplier_id, supplier_name, base_pricing, size_penalties } =
      req.body;

    // Validate input - require either supplier_id (new way) or supplier_name (legacy)
    if (!contract_type || (!supplier_id && !supplier_name) || !base_pricing) {
      return res.status(400).json({
        message: "contract_type, supplier_id (or supplier_name), and base_pricing are required",
      });
    }

    // If supplier_id provided, validate it exists and is a supplier
    let validatedSupplierId = supplier_id;
    let displayName = supplier_name;
    
    if (supplier_id) {
      const supplierCheck = await pool.query(
        "SELECT id, name FROM users WHERE id = $1 AND role = 'supplier'",
        [supplier_id]
      );
      
      if (supplierCheck.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid supplier_id: supplier not found or user is not a supplier",
        });
      }
      
      // Use supplier's actual name as default display name if not provided
      if (!displayName) {
        displayName = supplierCheck.rows[0].name;
      }
    }

    // Validate contract_type
    const validTypes = ["New", "Add", "Change"];
    if (!validTypes.includes(contract_type)) {
      return res.status(400).json({
        message: "Invalid contract_type. Must be one of: New, Add, Change",
      });
    }

    // Validate base_pricing structure
    if (!Array.isArray(base_pricing) || base_pricing.length === 0) {
      return res.status(400).json({
        message:
          "base_pricing must be a non-empty array of {size, price} objects",
      });
    }

    // Validate each pricing entry
    for (let pricing of base_pricing) {
      if (
        !pricing.size ||
        !pricing.price ||
        typeof pricing.size !== "number" ||
        typeof pricing.price !== "number"
      ) {
        return res.status(400).json({
          message: "Each base_pricing entry must have numeric size and price",
        });
      }
    }

    // Validate size_penalties if provided
    if (size_penalties && Array.isArray(size_penalties)) {
      for (let penalty of size_penalties) {
        if (!penalty.range || !penalty.penalty_amount || !penalty.unit) {
          return res.status(400).json({
            message:
              "Each size_penalty must have range, penalty_amount, and unit",
          });
        }
      }
    }

    // Generate unique contract ID
    const unique_id = generateUniqueId();

    // Create contract with new supplier_id structure
    const result = await pool.query(
      `INSERT INTO contracts (
        unique_id, contract_type, supplier_id, supplier_name, status, created_by, 
        base_pricing, size_penalties, deliveries, supplier_filled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, unique_id, contract_type, supplier_id, supplier_name, status, base_pricing, size_penalties, created_at`,
      [
        unique_id,
        contract_type,
        validatedSupplierId,
        displayName,
        "Open", // Default status
        req.user.id, // From auth middleware
        JSON.stringify(base_pricing),
        size_penalties ? JSON.stringify(size_penalties) : null,
        JSON.stringify([]), // Empty deliveries array
        false, // Not supplier filled yet
      ]
    );

    const contract = result.rows[0];

    console.log(
      `New contract created: ${contract.unique_id} by ${req.user.email} for ${displayName} (ID: ${validatedSupplierId})`
    );

    res.status(201).json({
      message: "Contract created successfully",
      contract: {
        id: contract.id,
        unique_id: contract.unique_id,
        contract_type: contract.contract_type,
        supplier_id: contract.supplier_id,
        supplier_name: contract.supplier_name,
        status: contract.status,
        base_pricing: contract.base_pricing,
        size_penalties: contract.size_penalties,
        created_at: contract.created_at,
      },
    });
  } catch (error) {
    console.error("Create contract error:", error);

    // Handle specific database errors
    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({ message: "Contract ID already exists" });
    }
    if (error.code === "23514") {
      // Check constraint violation
      return res
        .status(400)
        .json({ message: "Invalid contract data provided" });
    }
    if (error.code === "23503") {
      // Foreign key constraint violation
      return res.status(400).json({ message: "Invalid user reference" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Get contracts (filtered by role)
const getContracts = async (req, res) => {
  try {
    let query;
    let params;

    // Role-based filtering
    if (req.user.role === "general_manager") {
      // GM sees contracts they created
      query = `
        SELECT id, unique_id, contract_type, supplier_id, supplier_name, status, 
               base_pricing, size_penalties, deliveries, supplier_filled, created_at
        FROM contracts 
        WHERE created_by = $1 
        ORDER BY created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === "supplier") {
      // Suppliers see ALL contracts assigned to them (both Open and Closed)
      // They can view closed contracts but cannot edit deliveries
      query = `
        SELECT id, unique_id, contract_type, supplier_id, supplier_name, status,
               base_pricing, size_penalties, deliveries, supplier_filled, created_at
        FROM contracts 
        WHERE (supplier_id = $1 OR (supplier_id IS NULL AND LOWER(supplier_name) = LOWER($2)))
        ORDER BY created_at DESC
      `;
      params = [req.user.id, req.user.name]; // Use ID first, name as fallback
    } else if (req.user.role === "administrator") {
      // Admin sees all contracts with supplier info
      query = `
        SELECT c.id, c.unique_id, c.contract_type, c.supplier_id, c.supplier_name, c.status,
               c.base_pricing, c.size_penalties, c.deliveries, c.supplier_filled, c.created_at,
               u.name as created_by_name, s.name as supplier_user_name, s.email as supplier_email
        FROM contracts c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN users s ON c.supplier_id = s.id
        ORDER BY c.created_at DESC
      `;
      params = [];
    }

    const result = await pool.query(query, params);

    console.log(
      `Contracts retrieved: ${result.rows.length} contracts for ${req.user.email} (${req.user.role})`
    );

    res.json({
      message: "Contracts retrieved successfully",
      contracts: result.rows,
      count: result.rows.length,
      user_role: req.user.role,
    });
  } catch (error) {
    console.error("Get contracts error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single contract
const getContract = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: "Invalid contract ID format" });
    }

    const result = await pool.query(
      `SELECT c.*, u.name as created_by_name 
       FROM contracts c 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const contract = result.rows[0];

    // Role-based access control
    if (
      req.user.role === "general_manager" &&
      contract.created_by !== req.user.id
    ) {

      return res
        .status(403)
        .json({
          message: "Access denied - you can only view your own contracts",
        });
    }

    if (req.user.role === "supplier") {
      // Check access using supplier_id first, fallback to name matching
      const hasAccess = contract.supplier_id === req.user.id || 
        (contract.supplier_id === null && contract.supplier_name && 
         contract.supplier_name.toLowerCase() === req.user.name.toLowerCase());
      
      if (!hasAccess) {
        return res
          .status(403)
          .json({
            message:
              "Access denied - you can only view contracts assigned to you",
          });
      }
    }

    console.log(
      `Contract retrieved: ${contract.unique_id} by ${req.user.email}`
    );

    res.json({
      message: "Contract retrieved successfully",
      contract: contract,
    });
  } catch (error) {
    console.error("Get contract error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update contract status (OPEN/CLOSED) - GM only
const updateContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate input
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Validate status
    const validStatuses = ["Open", "Closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: Open, Closed",
      });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: "Invalid contract ID format" });
    }

    // Check if contract exists and user owns it
    const checkResult = await pool.query(
      "SELECT * FROM contracts WHERE id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const contract = checkResult.rows[0];

    // Only GM who created the contract can change status
    if (
      req.user.role !== "general_manager" ||
      contract.created_by !== req.user.id
    ) {
      return res.status(403).json({
        message: "Access denied - only the contract creator can change status",
      });
    }

    // Update status
    const result = await pool.query(
      `UPDATE contracts 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, unique_id, status, updated_at`,
      [status, id]
    );

    const updatedContract = result.rows[0];

    console.log(
      `Contract status updated: ${updatedContract.unique_id} to ${status} by ${req.user.email}`
    );

    res.json({
      message: "Contract status updated successfully",
      contract: {
        id: updatedContract.id,
        unique_id: updatedContract.unique_id,
        status: updatedContract.status,
        updated_at: updatedContract.updated_at,
      },
    });
  } catch (error) {
    console.error("Update contract status error:", error);

    if (error.code === "23514") {
      return res.status(400).json({ message: "Invalid status value" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Get suppliers for dropdown (GM only)
const getSuppliers = async (req, res) => {
  try {
    // Only general managers can access supplier list
    if (req.user.role !== "general_manager") {
      return res.status(403).json({
        message: "Access denied - only general managers can view supplier list",
      });
    }

    // Get all users with supplier role
    const result = await pool.query(
      `SELECT id, name, email, created_at 
       FROM users 
       WHERE role = 'supplier' 
       ORDER BY name ASC`
    );

    console.log(
      `Suppliers retrieved: ${result.rows.length} suppliers for ${req.user.email}`
    );

    res.json({
      message: "Suppliers retrieved successfully",
      suppliers: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete contract (GM only)
const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: "Invalid contract ID format" });
    }

    // Get contract details before deletion for cache invalidation
    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Only GM who created the contract can delete it
    if (
      req.user.role !== "general_manager" ||
      contract.created_by !== req.user.id
    ) {
      return res.status(403).json({
        message: "Access denied - only the contract creator can delete this contract",
      });
    }

    // Use the Contract model's delete method with proper authorization
    const deleted = await Contract.deleteById(id, req.user.id);

    if (!deleted) {
      return res.status(500).json({ 
        message: "Failed to delete contract" 
      });
    }

    // Invalidate relevant caches
    await CacheService.invalidateContract(id);
    if (contract.supplier_id) {
      await CacheService.invalidateSupplierContracts(contract.supplier_id);
    }
    await CacheService.invalidateContractStatistics();

    console.log(
      `Contract deleted: ${contract.unique_id} by ${req.user.email} (supplier: ${contract.supplier_name})`
    );

    res.json({
      message: "Contract deleted successfully",
      deleted_contract: {
        id: contract.id,
        unique_id: contract.unique_id,
        supplier_name: contract.supplier_name,
        supplier_id: contract.supplier_id
      },
    });

  } catch (error) {
    console.error("Delete contract error:", error);

    // Handle specific errors
    if (error.message === 'Contract not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Only the contract creator can delete it') {
      return res.status(403).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Update contract deliveries (Supplier only)
const updateContractDeliveries = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveries, contractType, changeDetails } = req.body;

    console.log(`Updating deliveries for contract ${id} by user ${req.user.id} (${req.user.email})`);
    console.log(`Deliveries data:`, JSON.stringify(deliveries, null, 2));
    
    if (contractType) {
      console.log(`Contract type change requested: "${contractType}" - ${changeDetails}`);
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.log(`Invalid UUID format: ${id}`);
      return res.status(400).json({ message: "Invalid contract ID format" });
    }

    // Check if contract exists and is not closed
    const contractCheck = await Contract.findById(id);
    if (!contractCheck) {
      console.log(`Contract not found: ${id}`);
      return res.status(404).json({ message: "Contract not found" });
    }

    // Prevent delivery updates if contract is closed
    if (contractCheck.status === 'Closed') {
      console.log(`Cannot update deliveries - contract ${id} is closed`);
      return res.status(403).json({ 
        message: "Cannot update deliveries. This contract has been closed by the General Manager.",
        contractStatus: "Closed"
      });
    }

    console.log(`Contract status check passed: ${contractCheck.status}`);

    // Validate deliveries input
    if (!deliveries || !Array.isArray(deliveries)) {
      return res.status(400).json({ 
        message: "Deliveries must be provided as an array" 
      });
    }

    // Validate each delivery entry
    for (let delivery of deliveries) {
      if (!delivery.date || !delivery.quantity || !delivery.unit || !delivery.sizeRange) {
        return res.status(400).json({
          message: "Each delivery must have date, quantity, unit, and sizeRange",
        });
      }

      if (typeof delivery.quantity !== 'number' || delivery.quantity <= 0) {
        return res.status(400).json({
          message: "Delivery quantity must be a positive number",
        });
      }

      if (!['mt', 'kg', 'ton'].includes(delivery.unit)) {
        return res.status(400).json({
          message: "Delivery unit must be one of: mt, kg, ton",
        });
      }
    }

    // Get original contract for change tracking
    const originalContract = await Contract.findById(id);
    const originalDeliveryCount = originalContract.deliveries ? originalContract.deliveries.length : 0;
    
    // Use the Contract model's update method with proper authorization
    console.log(`Calling Contract.updateDeliveries with ID: ${id}, Supplier: ${req.user.id}`);
    const updatedContract = await Contract.updateDeliveries(id, deliveries, req.user.id, contractType);

    if (!updatedContract) {
      console.log(`Failed to update deliveries - no contract returned`);
      return res.status(500).json({ 
        message: "Failed to update deliveries" 
      });
    }

    console.log(`Successfully updated deliveries for contract ${updatedContract.unique_id || id}`);

    // Log contract type change if applicable (temporarily disabled for debugging)
    console.log(`Contract type change: ${originalContract.contract_type} → ${contractType} for ${updatedContract.unique_id || id}`);

    // Invalidate relevant caches
    await CacheService.invalidateContract(id);
    if (updatedContract.supplier_id) {
      await CacheService.invalidateSupplierContracts(updatedContract.supplier_id);
    }

    console.log(
      `Deliveries updated for contract ${updatedContract.unique_id} by ${req.user.email}`
    );

    res.json({
      message: "Contract deliveries updated successfully",
      contract: updatedContract,
    });

  } catch (error) {
    console.error("Update deliveries error:", error);
    console.error("Error stack:", error.stack);

    // Handle specific errors
    if (error.message === 'Contract not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Only the assigned supplier can update deliveries') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'Deliveries must be an array') {
      return res.status(400).json({ message: error.message });
    }

    // Return detailed error for debugging
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update contract (General Manager only)
const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { contract_type, supplier_id, supplier_name, base_pricing, size_penalties } = req.body;

    console.log(`Updating contract ${id} by GM ${req.user.email}`);

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: "Invalid contract ID format" });
    }

    // Check if contract exists and user owns it
    const existingContract = await Contract.findById(id);
    if (!existingContract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Only GM who created the contract can update it
    if (req.user.role !== "general_manager" || existingContract.created_by !== req.user.id) {
      return res.status(403).json({
        message: "Access denied - only the contract creator can update this contract",
      });
    }

    // Validate contract_type if provided
    if (contract_type) {
      const validTypes = ["New", "Add", "Change"];
      if (!validTypes.includes(contract_type)) {
        return res.status(400).json({
          message: "Invalid contract_type. Must be one of: New, Add, Change",
        });
      }
    }

    // Validate supplier_id if provided (and get supplier name)
    let supplierName = supplier_name;
    if (supplier_id) {
      const supplierCheck = await pool.query(
        "SELECT id, name FROM users WHERE id = $1 AND role = 'supplier'",
        [supplier_id]
      );
      
      if (supplierCheck.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid supplier_id: supplier not found or user is not a supplier",
        });
      }
      
      // Use supplier's actual name if no custom name provided
      if (!supplierName) {
        supplierName = supplierCheck.rows[0].name;
      }
    }

    // Validate base_pricing structure if provided
    if (base_pricing) {
      if (!Array.isArray(base_pricing) || base_pricing.length === 0) {
        return res.status(400).json({
          message: "base_pricing must be a non-empty array of {size, price} objects",
        });
      }

      for (let pricing of base_pricing) {
        if (
          !pricing.size ||
          !pricing.price ||
          typeof pricing.size !== "number" ||
          typeof pricing.price !== "number"
        ) {
          return res.status(400).json({
            message: "Each base_pricing entry must have numeric size and price",
          });
        }
      }
    }

    // Validate size_penalties if provided
    if (size_penalties && Array.isArray(size_penalties)) {
      for (let penalty of size_penalties) {
        if (!penalty.range || !penalty.penalty_amount || !penalty.unit) {
          return res.status(400).json({
            message: "Each size_penalty must have range, penalty_amount, and unit",
          });
        }
      }
    }

    // Build update object with only provided fields
    const updateData = {};
    if (contract_type) updateData.contract_type = contract_type;
    if (supplier_id) updateData.supplier_id = supplier_id;
    if (supplierName) updateData.supplier_name = supplierName;
    if (base_pricing) updateData.base_pricing = JSON.stringify(base_pricing);
    if (size_penalties) updateData.size_penalties = JSON.stringify(size_penalties);
    
    // Note: updated_at is automatically handled by BaseModel

    // Update contract using Contract model
    const updatedContract = await Contract.updateById(id, updateData);

    if (!updatedContract) {
      return res.status(500).json({ 
        message: "Failed to update contract" 
      });
    }

    // Invalidate relevant caches
    await CacheService.invalidateContract(id);
    if (updatedContract.supplier_id) {
      await CacheService.invalidateSupplierContracts(updatedContract.supplier_id);
    }

    console.log(`Contract updated: ${updatedContract.unique_id} by ${req.user.email}`);

    res.json({
      message: "Contract updated successfully",
      contract: updatedContract,
    });

  } catch (error) {
    console.error("Update contract error:", error);

    // Handle specific database errors
    if (error.code === "23505") {
      return res.status(400).json({ message: "Duplicate contract data" });
    }
    if (error.code === "23503") {
      return res.status(400).json({ message: "Invalid reference data" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Transfer contract data to Database System
 * 
 * Transforms closed contract data and creates a transfer record in the database system.
 * Only works with closed contracts that haven't been transferred yet.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const transferContractToDb = async (req, res) => {
  try {
    const contractId = req.params.id;
    const transferredBy = req.user.id; // Get from auth middleware

    console.log(`Transfer request for contract ${contractId} by user ${transferredBy}`);

    // Get the original contract
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Validate contract is closed
    if (contract.status !== 'Closed') {
      return res.status(400).json({ 
        message: "Can only transfer closed contracts to Database System" 
      });
    }

    // Check if already transferred
    const isAlreadyTransferred = await ContractTransfer.isContractTransferred(contractId);
    if (isAlreadyTransferred) {
      return res.status(400).json({ 
        message: "Contract has already been transferred to Database System" 
      });
    }

    // Transform delivery details into required format
    const deliveries = contract.deliveries || [];
    const bongkar = deliveries.map(d => d.date); // Delivery dates
    const sizeRanges = deliveries.map(d => d.sizeRange); // Size ranges
    const tons = deliveries.map(d => d.quantity); // Quantities

    // Prepare transfer data
    const transferData = {
      contractId: contract.unique_id, // Use the L302 format ID
      originalContractUuid: contractId,
      transferredBy,
      supplierName: contract.supplier_name,
      bongkar,
      sizeRanges,
      tons,
      dynamicPricing: contract.base_pricing || {},
      sizePenalties: contract.size_penalties || []
    };

    console.log('Transfer data prepared:', {
      contractId: transferData.contractId,
      supplierName: transferData.supplierName,
      deliveryCount: deliveries.length,
      bongkarCount: bongkar.length,
      hasPricing: !!contract.base_pricing
    });

    // Create transfer record
    const transfer = await ContractTransfer.createTransfer(transferData);

    // Update original contract to mark as transferred
    await pool.query(
      `UPDATE contracts 
       SET transferred_to_db = true, transferred_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [contractId]
    );

    // Clear cache to ensure fresh data on next fetch
    await CacheService.invalidateContract(contractId);
    
    console.log(`Contract ${contract.unique_id} successfully transferred to Database System`);

    res.status(200).json({
      message: "Contract successfully transferred to Database System",
      transfer: {
        id: transfer.id,
        contractId: transfer.contract_id,
        transferDate: transfer.transfer_date,
        status: transfer.status
      },
      originalContract: {
        id: contract.id,
        uniqueId: contract.unique_id,
        transferredToDb: true,
        transferredAt: new Date()
      }
    });

  } catch (error) {
    console.error("Transfer contract error:", error);

    // Handle specific database errors
    if (error.code === "23505") {
      return res.status(400).json({ 
        message: "Contract has already been transferred" 
      });
    }

    res.status(500).json({ 
      message: "Failed to transfer contract to Database System",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all transferred contracts from Database System
 * 
 * @param {Object} req - Express request object  
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getTransferredContracts = async (req, res) => {
  try {
    const { page = 1, limit = 20, orderBy = 'transfer_date', order = 'DESC' } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const result = await ContractTransfer.getAllTransfers({
      limit: parseInt(limit),
      offset,
      orderBy,
      order
    });

    console.log(`📋 Retrieved ${result.transfers.length} transferred contracts`);

    res.status(200).json({
      transfers: result.transfers,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get transferred contracts error:", error);
    res.status(500).json({ 
      message: "Failed to retrieve transferred contracts",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createContract,
  getContracts,
  getContract,
  updateContractStatus,
  updateContract,
  updateContractDeliveries,
  deleteContract,
  getSuppliers,
  transferContractToDb,
  getTransferredContracts,
};
