/**
 * @fileoverview Admin Database Table Component  
 * 
 * Wrapper component for the shared DatabaseTable with Admin-specific configuration.
 * Shows transferred contract data in the Administrator dashboard.
 * 
 */

import React from "react";
import { DatabaseTable as SharedDatabaseTable } from "../../../../shared/components";

/**
 * AdminDatabaseTable - Admin Dashboard Database System component
 * 
 * Uses the shared DatabaseTable component configured for Administrator view.
 * Shows transferred contracts with Admin-specific title and version.
 * Admins have read-only access to transferred contract data for system administration.
 * 
 * @returns Database table interface configured for Admin dashboard
 */
const AdminDatabaseTable: React.FC = () => {
  return (
    <SharedDatabaseTable 
      title="Database System"
      version="V1"
      showActions={true}
    />
  );
};

export default AdminDatabaseTable;