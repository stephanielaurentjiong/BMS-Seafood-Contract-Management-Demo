/**
 * @fileoverview Email Service Layer
 * 
 * Email notification service for contract management events.
 * Handles contract notifications, status updates, and system alerts.
 * 
 * Features:
 * - Contract creation notifications
 * - Status change notifications
 * - Template-based email formatting
 * - Retry logic for failed sends
 * - Email queue management (future enhancement)
 * 
 */

/**
 * Email Service for notifications
 * Note: This is a mock implementation for development.
 * In production, integrate with services like SendGrid, AWS SES, or SMTP.
 * 
 * @class EmailService
 */
class EmailService {
  static isEnabled = process.env.EMAIL_ENABLED === 'true';
  static fromEmail = process.env.EMAIL_FROM || 'noreply@seafoodcontracts.com';

  /**
   * Send contract creation notification to supplier
   * 
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email
   * @param {string} params.supplierName - Supplier name
   * @param {string} params.contractId - Contract ID
   * @param {string} params.contractType - Contract type
   * @param {string} params.createdBy - Creator name
   * @returns {Promise<boolean>} Success status
   */
  static async sendContractNotification(params) {
    if (!this.isEnabled) {
      console.log('Email service disabled, logging notification instead');
      console.log('Contract Notification:', params);
      return true;
    }

    try {
      const { to, supplierName, contractId, contractType, createdBy } = params;

      const subject = `New ${contractType} Contract: ${contractId}`;
      const htmlContent = this.generateContractNotificationTemplate({
        supplierName,
        contractId,
        contractType,
        createdBy
      });

      const emailData = {
        to,
        from: this.fromEmail,
        subject,
        html: htmlContent,
        text: this.htmlToText(htmlContent)
      };

      // Mock email sending (replace with actual email service)
      await this.mockSendEmail(emailData);

      console.log(`Contract notification sent to ${to} for contract ${contractId}`);
      return true;

    } catch (error) {
      console.error('Contract notification error:', error);
      return false;
    }
  }

  /**
   * Send contract status change notification
   * 
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email
   * @param {string} params.supplierName - Supplier name
   * @param {string} params.contractId - Contract ID
   * @param {string} params.status - New status
   * @returns {Promise<boolean>} Success status
   */
  static async sendContractStatusNotification(params) {
    if (!this.isEnabled) {
      console.log('Email service disabled, logging status notification instead');
      console.log('Status Notification:', params);
      return true;
    }

    try {
      const { to, supplierName, contractId, status } = params;

      const subject = `Contract ${contractId} Status Update: ${status}`;
      const htmlContent = this.generateStatusNotificationTemplate({
        supplierName,
        contractId,
        status
      });

      const emailData = {
        to,
        from: this.fromEmail,
        subject,
        html: htmlContent,
        text: this.htmlToText(htmlContent)
      };

      await this.mockSendEmail(emailData);

      console.log(`Status notification sent to ${to} for contract ${contractId}`);
      return true;

    } catch (error) {
      console.error('Status notification error:', error);
      return false;
    }
  }

  /**
   * Generate contract notification email template
   * 
   * @param {Object} params - Template parameters
   * @returns {string} HTML email content
   * @private
   */
  static generateContractNotificationTemplate(params) {
    const { supplierName, contractId, contractType, createdBy } = params;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contract Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .contract-id { font-size: 18px; font-weight: bold; color: #2563eb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🦐 New Contract Assigned</h1>
          </div>
          <div class="content">
            <h2>Hello ${supplierName},</h2>
            <p>A new ${contractType.toLowerCase()} contract has been created and assigned to you.</p>
            
            <p><strong>Contract Details:</strong></p>
            <ul>
              <li>Contract ID: <span class="contract-id">${contractId}</span></li>
              <li>Type: ${contractType}</li>
              <li>Created by: ${createdBy}</li>
              <li>Status: Open</li>
            </ul>
            
            <p>Please log in to your supplier dashboard to review the contract details and provide your delivery information.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/supplier-dashboard" class="button">
              View Contract
            </a>
            
            <p>If you have any questions, please contact the contract manager.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Seafood Contract Management System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate status notification email template
   * 
   * @param {Object} params - Template parameters
   * @returns {string} HTML email content
   * @private
   */
  static generateStatusNotificationTemplate(params) {
    const { supplierName, contractId, status } = params;
    
    const statusColor = status === 'completed' ? '#10b981' : '#f59e0b';
    const statusMessage = status === 'completed' 
      ? 'has been completed and closed.' 
      : `status has been updated to: ${status}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .contract-id { font-size: 18px; font-weight: bold; color: ${statusColor}; }
          .status { font-weight: bold; color: ${statusColor}; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Contract Status Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${supplierName},</h2>
            <p>Your contract <span class="contract-id">${contractId}</span> ${statusMessage}</p>
            
            <p>Status: <span class="status">${status}</span></p>
            
            ${status === 'completed' 
              ? '<p>Thank you for your partnership in completing this contract successfully.</p>'
              : '<p>Please check your supplier dashboard for any required actions.</p>'
            }
          </div>
          <div class="footer">
            <p>This is an automated message from the Seafood Contract Management System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text
   * 
   * @param {string} html - HTML content
   * @returns {string} Plain text
   * @private
   */
  static htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Mock email sending function
   * Replace with actual email service integration
   * 
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Mock response
   * @private
   */
  static async mockSendEmail(emailData) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock successful response
    return {
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      to: emailData.to,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate email address
   * 
   * @param {string} email - Email address
   * @returns {boolean} Is valid email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Send system alert email (for admins)
   * 
   * @param {Object} params - Alert parameters
   * @param {string} params.type - Alert type
   * @param {string} params.message - Alert message
   * @param {Object} params.data - Additional data
   * @returns {Promise<boolean>} Success status
   */
  static async sendSystemAlert(params) {
    const { type, message, data = {} } = params;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail || !this.isValidEmail(adminEmail)) {
      console.warn('No valid admin email configured for system alerts');
      return false;
    }

    try {
      const subject = `System Alert: ${type}`;
      const htmlContent = `
        <h2>System Alert</h2>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        ${Object.keys(data).length > 0 ? `<p><strong>Data:</strong> <pre>${JSON.stringify(data, null, 2)}</pre></p>` : ''}
      `;

      const emailData = {
        to: adminEmail,
        from: this.fromEmail,
        subject,
        html: htmlContent,
        text: this.htmlToText(htmlContent)
      };

      await this.mockSendEmail(emailData);
      console.log(`System alert sent: ${type}`);
      return true;

    } catch (error) {
      console.error('System alert error:', error);
      return false;
    }
  }
}

module.exports = EmailService;