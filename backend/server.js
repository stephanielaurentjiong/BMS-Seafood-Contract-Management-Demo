const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3001;

// Import routes
const authRoutes = require("./src/routes/auth");
const contractRoutes = require("./src/routes/contracts");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);

// Root route
app.get("/", (req, res) => {
  console.log("✅ Root route accessed");
  res.json({
    message: "🦐 Welcome to Shrimp Contract Management API",
    status: "Server is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
      },
      contracts: {
        create: "POST /api/contracts (GM only)",
        list: "GET /api/contracts (role-filtered)",
        single: "GET /api/contracts/:id",
        status: "PUT /api/contracts/:id/status (GM only)",
      },
      test: "GET /api/test",
      health: "GET /api/health",
    },
  });
});

// Test route
app.get("/api/test", (req, res) => {
  console.log("✅ Test route accessed - START");
  try {
    const response = {
      message: "Simple test working! 🦐",
      timestamp: new Date().toISOString(),
      status: "success",
    };
    console.log("✅ Sending response:", response);
    res.json(response);
    console.log("✅ Response sent successfully");
  } catch (error) {
    console.error("❌ Error in test route:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Health check route (with database test)
app.get("/api/health", async (req, res) => {
  console.log("✅ Health check accessed");
  try {
    const pool = require("./src/config/database");
    const result = await pool.query("SELECT NOW() as current_time, version()");
    res.json({
      status: "healthy",
      server: "running",
      database: "connected",
      timestamp: result.rows[0].current_time,
      postgresql_version:
        result.rows[0].version.split(" ")[0] +
        " " +
        result.rows[0].version.split(" ")[1],
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      server: "running",
      database: "disconnected",
      error: error.message,
    });
  }
});

const { authenticateToken, requireRole } = require("./src/middleware/auth");

app.get("/api/test-auth", authenticateToken, (req, res) => {
  res.json({
    message: "🔐 Auth working!",
    user: req.user,
  });
});

app.get(
  "/api/test-gm",
  authenticateToken,
  requireRole(["general_manager"]),
  (req, res) => {
    res.json({
      message: "🎯 GM access working!",
      user: req.user,
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/register`);
  console.log("✅ Server is ready to accept requests");
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  process.exit(0);
});

// Add these at the very end of server.js
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

console.log("🔧 Process error handlers added");
