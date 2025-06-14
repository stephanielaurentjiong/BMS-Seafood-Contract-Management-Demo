const express = require("express");
const {
  createContract,
  getContracts,
  getContract,
  updateContractStatus,
} = require("../controllers/contractController");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// All contract routes require authentication
router.use(authenticateToken);

// Create contract - GM only
router.post("/", requireRole(["general_manager"]), createContract);

// Get all contracts - role-filtered
router.get("/", getContracts);

// Get single contract - role-based access control in controller
router.get("/:id", getContract);

// Update contract status (Open/Closed) - GM only
router.put(
  "/:id/status",
  requireRole(["general_manager"]),
  updateContractStatus
);

module.exports = router;
