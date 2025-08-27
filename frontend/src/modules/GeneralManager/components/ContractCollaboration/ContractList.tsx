/**
 * @fileoverview Contract List Component
 * 
 * Main container component for displaying and managing contracts in the Contract Collaboration tab.
 * Provides header with action button and renders list of contract cards.
 * 
 * Features:
 * - Header with "New Collaborative Contract" button
 * - List of contract cards with individual actions
 * - Empty state when no contracts exist
 * - Handles contract CRUD operations through callbacks
 * 
 */

import React from "react";
import Button from "../../../../shared/components/UI/Button";
import ContractCard from "./ContractCard";
import { Contract } from "../../types/contracts";

/**
 * Props for ContractList component
 * 
 * @interface ContractListProps
 * @property {Contract[]} contracts - Array of contracts to display
 * @property {Function} onNewContract - Callback to create new contract
 * @property {Function} onEditContract - Callback to edit existing contract
 * @property {Function} onDeleteContract - Callback to delete contract
 */
interface ContractListProps {
  contracts: Contract[];
  onNewContract: () => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (contractId: string) => void;
  onStatusToggle: (contractId: string, newStatus: 'Open' | 'Closed') => void;
  onTransferToDb?: (contract: Contract) => void;
}

/**
 * ContractList - Main contract management interface
 * 
 * Displays all contracts in card format with management capabilities.
 * Provides header with action button and handles empty states.
 * 
 * Features:
 * - Header with "New Collaborative Contract" button
 * - Contract cards in chronological order (newest first)
 * - Empty state message when no contracts exist
 * - Contract action delegation to individual cards
 * 
 * @param props - Component props with contracts and callbacks
 * @returns Contract list interface with header and cards
 */
const ContractList: React.FC<ContractListProps> = ({
  contracts,
  onNewContract,
  onEditContract,
  onDeleteContract,
  onStatusToggle,
  onTransferToDb
}) => {
  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contract Collaboration (V2)</h2>
        <Button 
          onClick={onNewContract}
          variant="primary"
          className="bg-green-600 hover:bg-green-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Collaborative Contract
        </Button>
      </div>

      {/* Contract Cards */}
      <div className="space-y-6">
        {contracts.map((contract) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onEdit={onEditContract}
            onDelete={onDeleteContract}
            onStatusToggle={onStatusToggle}
            onTransferToDb={onTransferToDb}
          />
        ))}
        
        {contracts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No contracts yet. Create your first collaborative contract!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractList;