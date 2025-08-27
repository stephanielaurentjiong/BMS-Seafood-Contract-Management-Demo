/**
 * @fileoverview User Model
 *
 * Data access layer for user management operations.
 * Handles authentication, role management, and user CRUD operations.
 *
 * Features:
 * - Password hashing and verification
 * - Role-based user queries
 * - Authentication helpers
 * - User validation and sanitization
 *
 */

const bcrypt = require("bcryptjs");
const BaseModel = require("./BaseModel");

/**
 * User Model for handling user data operations
 *
 * @class User
 * @extends BaseModel
 */
class User extends BaseModel {
  static tableName = "users";

  /**
   * User roles enumeration
   * @readonly
   */
  static ROLES = {
    GENERAL_MANAGER: "general_manager",
    SUPPLIER: "supplier",
    ADMINISTRATOR: "administrator",
  };

  /**
   * Find user by ID
   *
   * @param {string} id - User UUID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    return await super.findById(this.tableName, id);
  }

  /**
   * Find user by email address
   *
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const users = await super.findBy(
      this.tableName,
      "email",
      email.toLowerCase()
    );
    return users[0] || null;
  }

  /**
   * Find all users by role
   *
   * @param {string} role - User role (general_manager, supplier, administrator)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of users
   */
  static async findByRole(role, options = {}) {
    const defaultOptions = {
      orderBy: "created_at",
      order: "DESC",
    };

    return await super.findBy(this.tableName, "role", role, {
      ...defaultOptions,
      ...options,
    });
  }

  /**
   * Get all suppliers for dropdown/selection purposes
   *
   * @returns {Promise<Array>} Array of suppliers with essential fields
   */
  static async getSuppliers() {
    const query = `
      SELECT id, name, email, created_at 
      FROM ${this.tableName} 
      WHERE role = $1 
      ORDER BY name ASC
    `;

    const result = await this.query(
      query,
      [this.ROLES.SUPPLIER],
      "fetch suppliers"
    );
    return result.rows;
  }

  /**
   * Create a new user with hashed password
   *
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.name - User name
   * @param {string} userData.password - Plain text password
   * @param {string} userData.role - User role
   * @returns {Promise<Object>} Created user (without password)
   * @throws {Error} If email already exists or validation fails
   */
  static async create(userData) {
    const { email, name, password, role } = userData;

    // Validate required fields
    if (!email || !name || !password || !role) {
      throw new Error("Email, name, password, and role are required");
    }

    // Validate role
    if (!Object.values(this.ROLES).includes(role)) {
      throw new Error(
        `Invalid role. Must be one of: ${Object.values(this.ROLES).join(", ")}`
      );
    }

    // Check if email already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error("Email address already registered");
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData_sanitized = {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password_hash: passwordHash,
      role: role,
    };

    const newUser = await super.create(this.tableName, userData_sanitized);

    // Remove password hash from response
    delete newUser.password_hash;

    console.log(`User created: ${newUser.email} (${newUser.role})`);
    return newUser;
  }

  /**
   * Verify user password
   *
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object (without password) if valid, null if invalid
   */
  static async verifyPassword(email, password) {
    const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
    const result = await this.query(
      query,
      [email.toLowerCase()],
      "verify user password"
    );

    const user = result.rows[0];
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    // Remove password hash from response
    delete user.password_hash;

    console.log(`Password verified for: ${user.email} (${user.role})`);
    return user;
  }

  /**
   * Update user information
   *
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user or null if not found
   */
  static async updateById(id, updateData) {
    // Don't allow direct password updates through this method
    if (updateData.password || updateData.password_hash) {
      throw new Error("Use updatePassword() method to change passwords");
    }

    // Sanitize email if provided
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();

      // Check if new email already exists (for other users)
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error("Email address already in use by another user");
      }
    }

    // Sanitize name if provided
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    const updatedUser = await super.updateById(this.tableName, id, updateData);

    if (updatedUser) {
      delete updatedUser.password_hash;
      console.log(`User updated: ${updatedUser.email} (${updatedUser.role})`);
    }

    return updatedUser;
  }

  /**
   * Update user password
   *
   * @param {string} id - User ID
   * @param {string} newPassword - New plain text password
   * @param {string} currentPassword - Current password for verification
   * @returns {Promise<boolean>} True if password updated successfully
   * @throws {Error} If current password is invalid
   */
  static async updatePassword(id, newPassword, currentPassword = null) {
    // Get user with current password hash for verification
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(
      query,
      [id],
      "fetch user for password update"
    );

    const user = result.rows[0];
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password if provided
    if (currentPassword) {
      const isValidCurrent = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );
      if (!isValidCurrent) {
        throw new Error("Current password is incorrect");
      }
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateQuery = `
      UPDATE ${this.tableName} 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;

    await this.query(
      updateQuery,
      [newPasswordHash, id],
      "update user password"
    );

    console.log(`Password updated for user: ${user.email}`);
    return true;
  }

  /**
   * Delete user by ID
   *
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if user was deleted
   */
  static async deleteById(id) {
    const user = await this.findById(id);
    const deleted = await super.deleteById(this.tableName, id);

    if (deleted && user) {
      console.log(`User deleted: ${user.email} (${user.role})`);
    }

    return deleted;
  }

  /**
   * Check if user has specific role
   *
   * @param {string} userId - User ID
   * @param {string|Array} allowedRoles - Role or array of roles to check
   * @returns {Promise<boolean>} True if user has required role
   */
  static async hasRole(userId, allowedRoles) {
    const user = await this.findById(userId);
    if (!user) {
      return false;
    }

    const rolesArray = Array.isArray(allowedRoles)
      ? allowedRoles
      : [allowedRoles];
    return rolesArray.includes(user.role);
  }

  /**
   * Get user statistics by role
   *
   * @returns {Promise<Object>} Statistics object with counts by role
   */
  static async getStatistics() {
    const query = `
      SELECT 
        role,
        COUNT(*) as count,
        MAX(created_at) as latest_registration
      FROM ${this.tableName} 
      GROUP BY role
      ORDER BY role
    `;

    const result = await this.query(query, [], "get user statistics");

    const stats = {
      total: 0,
      by_role: {},
    };

    result.rows.forEach((row) => {
      stats.total += parseInt(row.count);
      stats.by_role[row.role] = {
        count: parseInt(row.count),
        latest_registration: row.latest_registration,
      };
    });

    return stats;
  }
}

module.exports = User;
