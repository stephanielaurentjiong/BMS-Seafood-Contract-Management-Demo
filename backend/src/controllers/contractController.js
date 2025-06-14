const pool = require("../config/database");

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
    const { contract_type, supplier_name, base_pricing, size_penalties } =
      req.body;

    // Validate input
    if (!contract_type || !supplier_name || !base_pricing) {
      return res.status(400).json({
        message: "contract_type, supplier_name, and base_pricing are required",
      });
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

    // Create contract
    const result = await pool.query(
      `INSERT INTO contracts (
        unique_id, contract_type, supplier_name, status, created_by, 
        base_pricing, size_penalties, deliveries, supplier_filled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id, unique_id, contract_type, supplier_name, status, base_pricing, size_penalties, created_at`,
      [
        unique_id,
        contract_type,
        supplier_name,
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
      `✅ New contract created: ${contract.unique_id} by ${req.user.email} for ${supplier_name}`
    );

    res.status(201).json({
      message: "Contract created successfully",
      contract: {
        id: contract.id,
        unique_id: contract.unique_id,
        contract_type: contract.contract_type,
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
        SELECT id, unique_id, contract_type, supplier_name, status, 
               base_pricing, size_penalties, deliveries, supplier_filled, created_at
        FROM contracts 
        WHERE created_by = $1 
        ORDER BY created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === "supplier") {
      // Suppliers see contracts assigned to them (match by name)
      // Note: In production, you'd want a more robust supplier matching system
      query = `
        SELECT id, unique_id, contract_type, supplier_name, status,
               base_pricing, size_penalties, deliveries, supplier_filled, created_at
        FROM contracts 
        WHERE LOWER(supplier_name) = LOWER($1) AND status = 'Open'
        ORDER BY created_at DESC
      `;
      params = [req.user.name]; // Assuming supplier's name matches contract supplier_name
    } else if (req.user.role === "administrator") {
      // Admin sees all contracts
      query = `
        SELECT c.id, c.unique_id, c.contract_type, c.supplier_name, c.status,
               c.base_pricing, c.size_penalties, c.deliveries, c.supplier_filled, c.created_at,
               u.name as created_by_name
        FROM contracts c
        LEFT JOIN users u ON c.created_by = u.id
        ORDER BY c.created_at DESC
      `;
      params = [];
    }

    const result = await pool.query(query, params);

    console.log(
      `✅ Contracts retrieved: ${result.rows.length} contracts for ${req.user.email} (${req.user.role})`
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
      return res.status(403).json({
        message: "Access denied - you can only view your own contracts",
      });
    }

    if (
      req.user.role === "supplier" &&
      contract.supplier_name.toLowerCase() !== req.user.name.toLowerCase()
    ) {
      return res.status(403).json({
        message: "Access denied - you can only view contracts assigned to you",
      });
    }

    console.log(
      `✅ Contract retrieved: ${contract.unique_id} by ${req.user.email}`
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
      `✅ Contract status updated: ${updatedContract.unique_id} to ${status} by ${req.user.email}`
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

module.exports = {
  createContract,
  getContracts,
  getContract,
  updateContractStatus,
};
