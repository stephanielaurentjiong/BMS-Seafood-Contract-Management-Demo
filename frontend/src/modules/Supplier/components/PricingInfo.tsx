/**
 * @fileoverview Supplier Pricing Information Component
 * 
 * Displays contract pricing information for suppliers with read-only access.
 * Shows GM-configured pricing and provides access to pricing calculator for reference.
 * 
 * Features:
 * - Read-only pricing display from GM configuration
 * - Interactive calculator for price inquiries
 * - Professional layout consistent with supplier dashboard
 * - Business context explanations for pricing structure
 * 
 * Business Context:
 * - Suppliers can view pricing but cannot modify it
 * - Calculator helps suppliers understand pricing for different sizes
 * - Supports delivery planning and quantity decisions
 * - Shows transparent pricing structure for contract negotiations
 * 
 */

import React, { useState } from 'react';
import { PricingDisplay, PricingCalculator, BasePriceEntry } from '../../../shared/components/Pricing';
import Button from '../../../shared/components/UI/Button';

/**
 * Props interface for PricingInfo component
 * 
 * @interface PricingInfoProps
 * @property {BasePriceEntry[]} basePrices - Pricing entries from contract/GM
 * @property {string} contractId - Contract identifier for context (optional)
 * @property {string} supplierName - Supplier name for personalization (optional)
 */
interface PricingInfoProps {
  basePrices: BasePriceEntry[];
  contractId?: string;
  supplierName?: string;
}

/**
 * PricingInfo - Supplier pricing information and calculator component
 * 
 * Features:
 * - Contract pricing overview with professional display
 * - Toggle-able pricing calculator for size inquiries
 * - Clear business context explanations
 * - Responsive design for mobile suppliers
 * - Integration with existing supplier dashboard styling
 * 
 * Usage Patterns:
 * - View current contract pricing structure
 * - Calculate prices for delivery planning
 * - Understand size-based pricing logic
 * - Reference during quantity negotiations
 * 
 * @param props - Component props with pricing data
 * @returns Supplier-focused pricing information interface
 * 
 * @example
 * ```tsx
 * const contractPrices = [
 *   { size: 20, price: 88000 },
 *   { size: 30, price: 80000 },
 *   { size: 100, price: 48000 }
 * ];
 * 
 * <PricingInfo
 *   basePrices={contractPrices}
 *   contractId="L50302.048.00"
 *   supplierName="SAIDY"
 * />
 * ```
 */
const PricingInfo: React.FC<PricingInfoProps> = ({
  basePrices,
  contractId,
  supplierName
}) => {
  const [showCalculator, setShowCalculator] = useState(false);

  return (
    <div className="bg-white shadow-lg rounded-lg">
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              💰 Contract Pricing
              {contractId && (
                <span className="ml-2 text-sm text-gray-500">({contractId})</span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {supplierName ? `Pricing structure for ${supplierName}` : 'Current contract pricing information'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={showCalculator ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
              </svg>
              {showCalculator ? 'Hide Calculator' : 'Price Calculator'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {basePrices.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v1a2 2 0 002 2h2m0 0h2m-2 0v6m2-6h2a2 2 0 012 2v1a2 2 0 01-2 2h-2m0 0v6m0-6H9m2 6H9a2 2 0 01-2-2v-1a2 2 0 012-2h2m0 0V7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pricing information available
            </h3>
            <p className="text-gray-500">
              Pricing structure has not been configured for this contract yet.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Please contact the General Manager for pricing details.
            </p>
          </div>
        ) : (
          // Pricing Content
          <div className="space-y-6">
            {/* Business Context Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900">
                    Understanding Shrimp Sizing & Pricing
                  </h3>
                  <div className="mt-2 text-sm text-blue-800">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Smaller numbers = BIGGER shrimp</strong> (20 size = 20 pieces per pound)</li>
                      <li>Prices shown are set by General Manager</li>
                      <li>Intermediate sizes calculated using interpolation</li>
                      <li>Use calculator below to check prices for specific sizes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Display */}
            <PricingDisplay
              basePrices={basePrices}
              title="Contract Base Pricing (Read-Only)"
              showFormula={true}
              className="border-gray-200"
            />

            {/* Pricing Calculator - Conditional */}
            {showCalculator && (
              <div className="border-t border-gray-200 pt-6">
                <PricingCalculator
                  basePrices={basePrices}
                  title="Price Calculator - For Reference"
                  showDetailedBreakdown={true}
                  onCalculation={(size, result) => {
                    console.log(`Supplier price inquiry: Size ${size} = Rp${result.price}`);
                  }}
                />
              </div>
            )}

            {/* Usage Guidelines */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                📋 How to Use This Information
              </h4>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Delivery Planning:</strong> Use the calculator to understand pricing for different 
                  shrimp sizes when planning your deliveries.
                </p>
                <p>
                  <strong>Quantity Decisions:</strong> Compare prices across different sizes to optimize 
                  your supply and delivery quantities.
                </p>
                <p>
                  <strong>Questions:</strong> Contact the General Manager if you need pricing adjustments 
                  or have questions about the pricing structure.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {basePrices.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Last updated by General Manager
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Print functionality for supplier records
                  window.print();
                }}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  // Navigate to delivery planning (would need proper navigation)
                  console.log('Navigate to delivery planning');
                }}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4z" />
                </svg>
                Plan Delivery
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingInfo;