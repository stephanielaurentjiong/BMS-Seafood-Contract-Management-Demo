const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// Middleware to verify JWT token and add user to request
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database to ensure they still exist and get fresh data
    const result = await pool.query(
      "SELECT id, email, name, role FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Invalid token - user not found" });
    }

    // Add user to request object
    req.user = result.rows[0];

    console.log(`Authenticated user: ${req.user.email} (${req.user.role})`);
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    res.status(500).json({ message: "Server error during authentication" });
  }
};

// Middleware to check if user has required role
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        console.log(
          `Access denied: ${req.user.email} (${req.user.role}) tried to access ${allowedRoles} endpoint`
        );
        return res.status(403).json({
          message: "Access denied - insufficient permissions",
          required_roles: allowedRoles,
          user_role: req.user.role,
        });
      }

      console.log(`Role check passed: ${req.user.email} (${req.user.role})`);
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res
        .status(500)
        .json({ message: "Server error during role verification" });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
};
