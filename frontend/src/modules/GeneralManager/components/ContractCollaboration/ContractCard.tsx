/**
 * @fileoverview Contract Card Component
 * 
 * Displays individual contract information in a card format with action buttons.
 * Shows contract details including pricing, penalties, and delivery information.
 * 
 */

import React from "react";
import { Contract } from "../../types/contracts";

/**
 * Props for ContractCard component
 * 
 * @interface ContractCardProps
 * @property {Contract} contract - Contract data to display
 * @property {Function} onEdit - Callback when edit button is clicked
 * @property {Function} onDelete - Callback when delete button is clicked
 * @property {Function} onStatusToggle - Callback when status toggle is clicked
 */
interface ContractCardProps {
  contract: Contract;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onStatusToggle?: (contractId: string, newStatus: 'Open' | 'Closed') => void;
  onTransferToDb?: (contract: Contract) => void;
}

/**
 * ContractCard - Displays individual contract in card format
 * 
 * Features:
 * - Contract header with status badge
 * - Delivery details display
 * - Pricing information layout
 * - Size penalties information
 * - Action buttons (Edit, Lock, Delete, Chat)
 * 
 * @param props - Component props
 * @returns Contract card with all details and actions
 */
const ContractCard: React.FC<ContractCardProps> = ({ contract, onEdit, onDelete, onStatusToggle, onTransferToDb }) => {
  const [isToggling, setIsToggling] = React.useState(false);

  const handleStatusToggle = async () => {
    if (!onStatusToggle || isToggling) return;
    
    setIsToggling(true);
    const newStatus = contract.status === 'Open' ? 'Closed' : 'Open';
    try {
      await onStatusToggle(contract.databaseId || contract.id, newStatus);
    } catch (error) {
      console.error('Status toggle failed:', error);
    } finally {
      setIsToggling(false);
    }
  };
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Title Section - White Background */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              ({contract.type.toUpperCase()}) {contract.id} {contract.supplierName} {contract.status}
            </h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              contract.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                {contract.status === 'Open' ? (
                  <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM8 7a2 2 0 114 0v2H8V7z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 0 1 6 0z" clipRule="evenodd" />
                )}
              </svg>
              {contract.status === 'Open' ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button 
              onClick={() => onEdit(contract)}
              className="bg-yellow-500 text-white p-2 rounded shadow hover:bg-yellow-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={handleStatusToggle}
              disabled={isToggling}
              className={`p-2 rounded shadow transition-all duration-200 ${
                contract.status === 'Open' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={`Click to ${contract.status === 'Open' ? 'close' : 'open'} contract`}
            >
              {isToggling ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                </svg>
              ) : contract.status === 'Open' ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM8 7a2 2 0 114 0v2H8V7z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            {/* Transfer to Database Button - Only show for closed contracts that haven't been transferred */}
            {contract.status === 'Closed' && !contract.transferredToDb && onTransferToDb && (
              <button 
                onClick={() => onTransferToDb(contract)}
                className="bg-blue-600 text-white p-2 rounded shadow hover:bg-blue-700 transition-colors"
                title="Transfer contract data to Database System"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s8-1.79 8-4" />
                </svg>
              </button>
            )}
            <button 
              onClick={() => onDelete(contract.databaseId || contract.id)}
              className="bg-red-600 text-white p-2 rounded shadow hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Content Section - Light Grey Background */}
      <div className="bg-gray-100 px-6 py-4">
        <div className="text-gray-800 font-mono text-sm leading-relaxed text-left">
          <div className="mb-3">({contract.type.toUpperCase()}) {contract.id} {contract.supplierName} {contract.status}</div>
          
          {/* Delivery Details */}
          {contract.deliveryDetails.map((delivery, idx) => (
            <div key={idx} className="mb-3">{delivery.date} {delivery.quantity}{delivery.unit},</div>
          ))}
          
          {/* Base Pricing */}
          <div className="mb-2">
            {contract.basePricing.map(bp => bp.size).join('/')}@
          </div>
          <div className="mb-3">
            {contract.basePricing.map(bp => bp.price).join('/')},
          </div>
          
          {/* Size Penalties */}
          {contract.sizePenalties.map((penalty, idx) => (
            <div key={idx}>Sz {penalty.sizeRange} turun {penalty.penaltyAmount} {penalty.unit}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContractCard;