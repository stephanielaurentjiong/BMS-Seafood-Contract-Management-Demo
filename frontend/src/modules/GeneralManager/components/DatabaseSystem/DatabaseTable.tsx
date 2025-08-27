/**
 * @fileoverview GM Database Table Component  
 * 
 * Wrapper component for the shared DatabaseTable with GM-specific configuration.
 * Shows transferred contract data in the General Manager dashboard.
 * 
 */

import React from "react";
import { DatabaseTable as SharedDatabaseTable } from "../../../../shared/components";

/**
 * DatabaseTable - GM Dashboard Database System component
 * 
 * Uses the shared DatabaseTable component configured for General Manager view.
 * Shows transferred contracts with GM-specific title and version.
 * 
 * @returns Database table interface configured for GM dashboard
 */
const DatabaseTable: React.FC = () => {
  return (
    <SharedDatabaseTable 
      title="Database System"
      version="V2"
      showActions={true}
    />
  );
};

export default DatabaseTable;