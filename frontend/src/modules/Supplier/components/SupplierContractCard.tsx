/**
 * @fileoverview Supplier Contract Card Component
 * 
 * Displays individual contract information in the same card format as GeneralManager.
 * Shows contract details including pricing, penalties, and delivery information with supplier-specific actions.
 * 
 * Design Note: This component replicates the exact visual design from GeneralManager/ContractCard.tsx
 * but with supplier-appropriate action buttons (View Details, Update Delivery, Chat).
 * 
 */

import React, { useState, useMemo } from "react";
import { Contract } from "../../GeneralManager/types/contracts";
import { PricingCalculator, BasePriceEntry } from "../../../shared/components/Pricing";
import Modal from "../../../shared/components/UI/Modal";
import Button from "../../../shared/components/UI/Button";
import SupplierContractModal from "./SupplierContractModal";

/**
 * Props for SupplierContractCard component
 * 
 * @interface SupplierContractCardProps
 * @property {Contract} contract - Contract data to display
 * @property {Function} onViewDetails - Callback when view details button is clicked
 * @property {Function} onUpdateDelivery - Callback when update delivery button is clicked
 * @property {Function} onChat - Callback when chat button is clicked
 * @property {Function} onCalculator - Callback when calculator button is clicked
 * @property {Function} onContractUpdate - Callback when contract data is updated
 */
interface SupplierContractCardProps {
  contract: Contract;
  onViewDetails: (contract: Contract) => void;
  onUpdateDelivery: (contract: Contract) => void;
  onChat: (contractId: string) => void;
  onCalculator: (contract: Contract) => void;
  onContractUpdate?: (updatedContract: Contract) => void;
}

/**
 * SupplierContractCard - Displays individual contract in card format for suppliers
 * 
 * Features:
 * - Identical visual design to GeneralManager ContractCard
 * - Contract header with status badge  
 * - Delivery details display
 * - Pricing information layout
 * - Size penalties information
 * - Supplier-specific action buttons (View Details, Update Delivery, Calculator, Chat)
 * 
 * Visual Design:
 * - White header section with contract title and status
 * - Light grey content section with monospace font
 * - Action buttons in header (blue for view, yellow for update, purple for calculator, green for chat)
 * - Same spacing, colors, and layout as GM version
 * 
 * @param props - Component props
 * @returns Contract card with exact GM design but supplier actions
 */
const SupplierContractCard: React.FC<SupplierContractCardProps> = ({ 
  contract, 
  onViewDetails, 
  onUpdateDelivery, 
  onChat,
  onCalculator,
  onContractUpdate
}) => {
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [currentContract, setCurrentContract] = useState<Contract>(contract);

  // Update current contract when prop changes
  React.useEffect(() => {
    setCurrentContract(contract);
  }, [contract]);

  // Convert contract pricing to BasePriceEntry format for calculator
  const contractPricing: BasePriceEntry[] = useMemo(() => {
    return currentContract.basePricing
      .filter(pricing => pricing.size && pricing.price)
      .map(pricing => ({
        size: parseFloat(pricing.size) || 0,
        price: parseFloat(pricing.price.toString()) || 0 // Use price directly as it's already in Rupiah
      }))
      .filter(entry => entry.size > 0 && entry.price >= 0)
      .sort((a, b) => a.size - b.size);
  }, [currentContract.basePricing]);

  const handleCalculatorClick = () => {
    setShowCalculatorModal(true);
    onCalculator(currentContract);
  };

  const handleUpdateDeliveryClick = () => {
    setShowDeliveryModal(true);
    onUpdateDelivery(currentContract);
  };

  const handleDeliverySave = (updatedContract: Contract) => {
    setCurrentContract(updatedContract);
    onContractUpdate?.(updatedContract);
    console.log(`Contract ${updatedContract.id} deliveries updated in UI`);
  };
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Title Section - White Background (Exact copy from GM) */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              ({currentContract.type.toUpperCase()}) {currentContract.id} {currentContract.supplierName} {currentContract.status}
            </h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              currentContract.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              {currentContract.status === 'Open' ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          
          {/* Action Buttons - Supplier specific but same visual style */}
          <div className="flex space-x-2">
            <button 
              onClick={() => onViewDetails(currentContract)}
              className="bg-blue-500 text-white p-2 rounded shadow hover:bg-blue-600 transition-colors"
              title="View Contract Details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button 
              onClick={handleUpdateDeliveryClick}
              disabled={currentContract.status === 'Closed'}
              className={`p-2 rounded shadow transition-colors ${
                currentContract.status === 'Closed'
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
              title={currentContract.status === 'Closed' 
                ? 'Contract is closed - delivery updates not allowed'
                : 'Update Delivery Details'
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4z" />
              </svg>
            </button>
            <button 
              onClick={handleCalculatorClick}
              className="bg-purple-500 text-white p-2 rounded shadow hover:bg-purple-600 transition-colors"
              title="Price Calculator"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
              </svg>
            </button>
            <button 
              onClick={() => onChat(currentContract.id)}
              className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-colors"
              title="Chat with General Manager"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Content Section - Light Grey Background (Exact copy from GM) */}
      <div className="bg-gray-100 px-6 py-4">
        <div className="text-gray-800 font-mono text-sm leading-relaxed text-left">
          <div className="mb-3">({currentContract.type.toUpperCase()}) {currentContract.id} {currentContract.supplierName} {currentContract.status}</div>
          
          {/* Delivery Details */}
          {currentContract.deliveryDetails.map((delivery, idx) => (
            <div key={idx} className="mb-3">{delivery.date} {delivery.quantity}{delivery.unit},</div>
          ))}
          
          {/* Base Pricing */}
          <div className="mb-2">
            {currentContract.basePricing.map(bp => bp.size).join('/')}@
          </div>
          <div className="mb-3">
            {currentContract.basePricing.map(bp => bp.price).join('/')},
          </div>
          
          {/* Size Penalties */}
          {currentContract.sizePenalties.map((penalty, idx) => (
            <div key={idx}>Sz {penalty.sizeRange} turun {penalty.penaltyAmount} {penalty.unit}</div>
          ))}
        </div>
      </div>

      {/* Pricing Calculator Modal */}
      <Modal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        title={`Price Calculator - Contract ${currentContract.id}`}
        size="lg"
        footer={
          <Button 
            variant="outline" 
            onClick={() => setShowCalculatorModal(false)}
          >
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Contract Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">
                  Contract {currentContract.id} - {currentContract.supplierName}
                </h3>
                <div className="mt-2 text-sm text-blue-800">
                  <p className="mb-1">This calculator uses the specific pricing structure from your assigned contract.</p>
                  <p className="mb-1">• <strong>Base sizes:</strong> {contractPricing.map(p => p.size).join(', ')}</p>
                  <p>• <strong>Calculation methods:</strong> Exact match, Linear interpolation, Progressive penalties</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Calculator Component */}
          {contractPricing.length > 0 ? (
            <PricingCalculator
              basePrices={contractPricing}
              title="Contract Price Calculator"
              showDetailedBreakdown={true}
              onCalculation={(size, result) => {
                console.log(`Supplier price calculation for ${currentContract.id}: Size ${size} = Rp${result.price}`);
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v1a2 2 0 002 2h2m0 0h2m-2 0v6m2-6h2a2 2 0 012 2v1a2 2 0 01-2 2h-2m0 0v6m0-6H9m2 6H9a2 2 0 01-2-2v-1a2 2 0 012-2h2m0 0V7" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pricing data available
              </h3>
              <p>This contract does not have valid pricing information for calculations.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Supplier Contract Modal */}
      <SupplierContractModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        contract={currentContract}
        onSave={handleDeliverySave}
      />
    </div>
  );
};

export default SupplierContractCard;