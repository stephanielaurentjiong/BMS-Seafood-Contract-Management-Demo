/**
 * @fileoverview User Controller
 * 
 * Controller for user authentication and management operations.
 * Updated to use the new User model and validation middleware.
 * 
 *
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Generate JWT token for user
 * 
 * @param {string} userId - User UUID
 * @param {string} email - User email  
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: "24h" }
  );
};

/**
 * Register a new user
 * Validation is handled by middleware, model handles business logic
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    // Create user using model (includes validation and password hashing)
    const newUser = await User.create({
      email,
      name, 
      password,
      role
    });

    // Generate token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    console.log(`User registered: ${newUser.email} (${newUser.role})`);

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle known validation errors
    if (error.message.includes('Email address already registered')) {
      return res.status(409).json({ 
        message: error.message,
        error_type: 'conflict'
      });
    }
    
    if (error.message.includes('Invalid role') || error.message.includes('required')) {
      return res.status(400).json({ 
        message: error.message,
        error_type: 'validation_error'
      });
    }

    res.status(500).json({ 
      message: "Server error during registration",
      error_type: 'server_error'
    });
  }
};

/**
 * Login user with email and password
 * Validation is handled by middleware, model handles authentication
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify password using model
    const user = await User.verifyPassword(email, password);
    
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid email or password",
        error_type: 'authentication_error'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    console.log(`User logged in: ${user.email} (${user.role})`);

    res.json({
      message: "Login successful",
      user,
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Server error during login",
      error_type: 'server_error'
    });
  }
};

/**
 * Get current user profile
 * Requires authentication middleware
 * 
 * @param {Object} req - Express request object (with user from auth middleware)
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    // User is already available from auth middleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        error_type: 'not_found'
      });
    }

    res.json({
      message: "Profile retrieved successfully",
      user
    });

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ 
      message: "Server error retrieving profile",
      error_type: 'server_error'
    });
  }
};

/**
 * Update user profile
 * Requires authentication middleware and validation
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Update user using model
    const updatedUser = await User.updateById(userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ 
        message: "User not found",
        error_type: 'not_found'
      });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update profile error:", error);
    
    if (error.message.includes('Email address already in use')) {
      return res.status(409).json({ 
        message: error.message,
        error_type: 'conflict'
      });
    }

    res.status(500).json({ 
      message: "Server error updating profile",
      error_type: 'server_error'
    });
  }
};

/**
 * Change user password
 * Requires authentication middleware and validation
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Update password using model
    await User.updatePassword(userId, newPassword, currentPassword);

    res.json({
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error("Change password error:", error);
    
    if (error.message.includes('Current password is incorrect')) {
      return res.status(400).json({ 
        message: error.message,
        error_type: 'validation_error'
      });
    }
    
    if (error.message.includes('User not found')) {
      return res.status(404).json({ 
        message: error.message,
        error_type: 'not_found'
      });
    }

    res.status(500).json({ 
      message: "Server error changing password",
      error_type: 'server_error'
    });
  }
};

/**
 * Get user statistics (Admin only)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserStatistics = async (req, res) => {
  try {
    const stats = await User.getStatistics();

    res.json({
      message: "User statistics retrieved successfully",
      statistics: stats
    });

  } catch (error) {
    console.error("Get user statistics error:", error);
    res.status(500).json({ 
      message: "Server error retrieving statistics",
      error_type: 'server_error'
    });
  }
};

module.exports = { 
  register, 
  login, 
  getProfile,
  updateProfile,
  changePassword,
  getUserStatistics
};