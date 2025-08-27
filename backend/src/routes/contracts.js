const express = require("express");
const {
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
} = require("../controllers/contractController");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// All contract routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/contracts:
 *   post:
 *     summary: Create a new contract (General Manager only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - startDate
 *               - endDate
 *               - amount
 *             properties:
 *               title:
 *                 type: string
 *                 description: Contract title
 *               description:
 *                 type: string
 *                 description: Contract description
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Contract start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Contract end date
 *               amount:
 *                 type: number
 *                 description: Contract amount
 *     responses:
 *       201:
 *         description: Contract created successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post("/", requireRole(["general_manager"]), createContract);

/**
 * @swagger
 * /api/contracts:
 *   get:
 *     summary: Get all contracts (role-filtered)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed]
 *         description: Filter contracts by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contracts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date
 *                       endDate:
 *                         type: string
 *                         format: date
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get("/", getContracts);

/**
 * @swagger
 * /api/contracts/suppliers:
 *   get:
 *     summary: Get all suppliers for dropdown (General Manager only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 suppliers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: Supplier user ID
 *                       name:
 *                         type: string
 *                         description: Supplier name
 *                       email:
 *                         type: string
 *                         description: Supplier email
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only general managers can access
 *       500:
 *         description: Server error
 */
router.get("/suppliers", requireRole(["general_manager"]), getSuppliers);

/**
 * @swagger
 * /api/contracts/transfers:
 *   get:
 *     summary: Get all transferred contracts from Database System (GM and Admin only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [transfer_date, contract_id, supplier_name, status]
 *         description: Column to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: List of transferred contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transfers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       contract_id:
 *                         type: string
 *                         example: L12345678.123.00
 *                       supplier_name:
 *                         type: string
 *                       bongkar:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Delivery dates
 *                       size_ranges:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Size ranges
 *                       tons:
 *                         type: array
 *                         items:
 *                           type: number
 *                         description: Delivery quantities
 *                       dynamic_pricing:
 *                         type: object
 *                         description: Pricing structure
 *                       size_penalties:
 *                         type: array
 *                         description: Size penalty rules
 *                       transfer_date:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         example: Transferred
 *                       transferred_by_name:
 *                         type: string
 *                         description: Name of user who transferred
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only general managers and administrators can access
 *       500:
 *         description: Server error
 */
router.get("/transfers", requireRole(["general_manager", "administrator"]), getTransferredContracts);

/**
 * @swagger
 * /api/contracts/{id}:
 *   get:
 *     summary: Get a single contract by ID
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Contract details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date
 *                 endDate:
 *                   type: string
 *                   format: date
 *                 amount:
 *                   type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getContract);

/**
 * @swagger
 * /api/contracts/{id}/status:
 *   put:
 *     summary: Update contract status (General Manager only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, closed]
 *                 description: New contract status
 *     responses:
 *       200:
 *         description: Contract status updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id/status",
  requireRole(["general_manager"]),
  updateContractStatus
);

/**
 * @swagger
 * /api/contracts/{id}:
 *   put:
 *     summary: Update contract (General Manager only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contract_type:
 *                 type: string
 *                 enum: [New, Add, Change]
 *                 description: Contract type
 *               supplier_id:
 *                 type: string
 *                 format: uuid
 *                 description: Supplier UUID
 *               supplier_name:
 *                 type: string
 *                 description: Custom supplier display name
 *               base_pricing:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     size:
 *                       type: number
 *                       description: Shrimp size
 *                     price:
 *                       type: number
 *                       description: Price per unit
 *                 description: Base pricing structure
 *               size_penalties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     range:
 *                       type: string
 *                       description: Size range
 *                     penalty_amount:
 *                       type: number
 *                       description: Penalty amount
 *                     unit:
 *                       type: string
 *                       description: Penalty unit
 *                 description: Size penalty rules
 *     responses:
 *       200:
 *         description: Contract updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contract updated successfully
 *                 contract:
 *                   type: object
 *                   description: Updated contract data
 *       400:
 *         description: Invalid input data or contract ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only contract creator can update
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.put("/:id", requireRole(["general_manager"]), updateContract);

/**
 * @swagger
 * /api/contracts/{id}/deliveries:
 *   put:
 *     summary: Update contract deliveries (Supplier only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveries
 *             properties:
 *               deliveries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - date
 *                     - quantity
 *                     - unit
 *                     - sizeRange
 *                   properties:
 *                     date:
 *                       type: string
 *                       description: Delivery date (human readable format)
 *                       example: "27 Mei"
 *                     quantity:
 *                       type: number
 *                       minimum: 0.1
 *                       description: Delivery quantity
 *                       example: 7
 *                     unit:
 *                       type: string
 *                       enum: [mt, kg, ton]
 *                       description: Quantity unit
 *                       example: "mt"
 *                     sizeRange:
 *                       type: string
 *                       description: Shrimp size range
 *                       example: "20-25"
 *                 description: Array of delivery schedules
 *                 example:
 *                   - date: "27 Mei"
 *                     quantity: 7
 *                     unit: "mt"
 *                     sizeRange: "20-25"
 *                   - date: "30 Mei"
 *                     quantity: 5
 *                     unit: "mt"
 *                     sizeRange: "26-30"
 *     responses:
 *       200:
 *         description: Contract deliveries updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contract deliveries updated successfully
 *                 contract:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     unique_id:
 *                       type: string
 *                       example: L12345678.123.00
 *                     deliveries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           unit:
 *                             type: string
 *                           sizeRange:
 *                             type: string
 *                     supplier_filled:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid input data or contract ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only assigned supplier can update deliveries
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.put("/:id/deliveries", requireRole(["supplier"]), updateContractDeliveries);

/**
 * @swagger
 * /api/contracts/{id}:
 *   delete:
 *     summary: Delete a contract (General Manager only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Contract deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contract deleted successfully
 *                 deleted_contract:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     unique_id:
 *                       type: string
 *                       example: L12345678.123.00
 *                     supplier_name:
 *                       type: string
 *                     supplier_id:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: Invalid contract ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only contract creator can delete
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", requireRole(["general_manager"]), deleteContract);

/**
 * @swagger
 * /api/contracts/{id}/transfer:
 *   post:
 *     summary: Transfer closed contract to Database System (General Manager only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Contract successfully transferred to Database System
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contract successfully transferred to Database System
 *                 transfer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     contractId:
 *                       type: string
 *                       example: L12345678.123.00
 *                     transferDate:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       example: Transferred
 *                 originalContract:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     uniqueId:
 *                       type: string
 *                       example: L12345678.123.00
 *                     transferredToDb:
 *                       type: boolean
 *                       example: true
 *                     transferredAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request - Contract not closed, already transferred, or invalid ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only general managers can transfer contracts
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.post("/:id/transfer", requireRole(["general_manager"]), transferContractToDb);

module.exports = router;
