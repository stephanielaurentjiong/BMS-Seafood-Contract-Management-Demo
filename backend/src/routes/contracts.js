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

module.exports = router;
