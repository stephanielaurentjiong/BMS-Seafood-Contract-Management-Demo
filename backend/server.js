const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./src/config/swagger");
require("dotenv").config();

// Import middleware
const { applySecurity } = require("./src/middleware/security");
const { applyMonitoring } = require("./src/middleware/monitoring");
const CacheService = require("./src/services/CacheService");

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const authRoutes = require("./src/routes/auth");
const contractRoutes = require("./src/routes/contracts");

// Initialize services
async function initializeServices() {
  console.log('Initializing services...');
  
  // Initialize cache service
  await CacheService.initialize();
  
  // Warm up cache
  await CacheService.warmCache();
  
  console.log('Services initialized');
}

// Apply security middleware (must be early)
applySecurity(app);

// Apply monitoring middleware (includes request timing)
applyMonitoring(app);

// CORS and JSON parsing (after security)
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3002', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Swagger UI setup
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Shrimp Contract Management API Documentation",
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);

// Root route
app.get("/", (req, res) => {
  console.log("Root route accessed");
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
  console.log("Test route accessed - START");
  try {
    const response = {
      message: "Simple test working! 🦐",
      timestamp: new Date().toISOString(),
      status: "success",
    };
    console.log("Sending response:", response);
    res.json(response);
    console.log("Response sent successfully");
  } catch (error) {
    console.error("Error in test route:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Health check route (with database test)
app.get("/api/health", async (req, res) => {
  console.log("Health check accessed");
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
    message: "Auth working!",
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

// Start server with service initialization
async function startServer() {
  try {
    // Initialize services first
    await initializeServices();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Test: http://localhost:${PORT}/api/test`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log(`Metrics: http://localhost:${PORT}/api/metrics`);
      console.log(`API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`Auth: http://localhost:${PORT}/api/auth/register`);
      console.log("Server is ready to accept requests");
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log('📡 HTTP server closed');
        
        // Close database connections and services
        try {
          await CacheService.close();
          console.log('💾 Services closed');
        } catch (error) {
          console.error('Error closing services:', error);
        }
        
        console.log('👋 Server shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('⏰ Forced shutdown after 30 seconds');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    return server;
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Enhanced error handlers
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  console.error("Stack:", error.stack);
  
  // Send alert to monitoring service
  try {
    const EmailService = require('./src/services/EmailService');
    EmailService.sendSystemAlert({
      type: 'uncaught_exception',
      message: error.message,
      data: { stack: error.stack }
    });
  } catch (e) {
    console.error('Failed to send alert:', e.message);
  }
  
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  
  // Send alert to monitoring service
  try {
    const EmailService = require('./src/services/EmailService');
    EmailService.sendSystemAlert({
      type: 'unhandled_rejection',
      message: String(reason),
      data: { promise: String(promise) }
    });
  } catch (e) {
    console.error('Failed to send alert:', e.message);
  }
  
  process.exit(1);
});

console.log("Enhanced error handlers added");

// Start the server
startServer();
