/**
 * @fileoverview Pricing Display Component
 * 
 * Displays predefined pricing entries from General Manager with calculated interpolated prices.
 * Shows only the sizes and prices that were inputted by the GM, not all possible calculated values.
 * 
 * Features:
 * - Clean table display of GM-entered sizes and prices
 * - Visual indicators for direct vs interpolated prices
 * - Responsive design with mobile-friendly layout
 * - Integration with pricing calculation utilities
 * - Professional styling consistent with existing design system
 * 
 * Business Context:
 * - Only displays pricing data that GM has explicitly entered
 * - Does not show calculated prices for intermediate sizes
 * - Used by both GM (for review) and Supplier (for reference)
 * - Supports the contract negotiation workflow
 * 
 */

import React from 'react';
import { BasePriceEntry, formatPrice } from '../../utils/pricingCalculator';

/**
 * Props interface for PricingDisplay component
 * 
 * @interface PricingDisplayProps
 * @property {BasePriceEntry[]} basePrices - Array of GM-inputted pricing entries
 * @property {string} title - Display title for the pricing section (default: "Base Pricing")
 * @property {boolean} showFormula - Whether to show interpolation formula info (default: false)
 * @property {string} className - Additional CSS classes for styling (optional)
 */
interface PricingDisplayProps {
  basePrices: BasePriceEntry[];
  title?: string;
  showFormula?: boolean;
  className?: string;
}

/**
 * PricingDisplay - Displays GM-inputted pricing in professional table format
 * 
 * Features:
 * - Responsive table layout with proper spacing
 * - Size column showing shrimp sizes (pieces per pound)
 * - Price column with formatted Rupiah display
 * - Sort by size ascending (smaller numbers = bigger shrimp)
 * - Empty state handling when no prices are available
 * - Professional styling with hover effects
 * 
 * Design Notes:
 * - Uses existing design system colors and spacing
 * - Mobile-responsive with horizontal scrolling if needed  
 * - Clear typography hierarchy for easy reading
 * - Consistent with other table components in the system
 * 
 * @param props - Component props with pricing data and display options
 * @returns Formatted pricing table showing only GM-entered values
 * 
 * @example
 * ```tsx
 * const gmPrices = [
 *   { size: 20, price: 88000 },
 *   { size: 30, price: 80000 },
 *   { size: 100, price: 48000 }
 * ];
 * 
 * <PricingDisplay 
 *   basePrices={gmPrices}
 *   title="Contract Base Pricing"
 *   showFormula={true}
 * />
 * ```
 */
const PricingDisplay: React.FC<PricingDisplayProps> = ({
  basePrices,
  title = "Base Pricing",
  showFormula = false,
  className = ""
}) => {
  // Sort prices by size ascending for consistent display
  const sortedPrices = [...basePrices].sort((a, b) => a.size - b.size);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {sortedPrices.length} size{sortedPrices.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {/* Formula Information */}
        {showFormula && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-blue-900">Pricing Information</h4>
                <div className="mt-1 text-sm text-blue-700">
                  <p className="mb-1">• Smaller numbers = BIGGER shrimp (20 size = 20 pieces per pound)</p>
                  <p className="mb-1">• Prices shown are for sizes specifically entered by management</p>
                  <p>• Intermediate sizes calculated using linear interpolation</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Table */}
      <div className="overflow-hidden">
        {sortedPrices.length === 0 ? (
          // Empty State
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v1a2 2 0 002 2h2m0 0h2m-2 0v6m2-6h2a2 2 0 012 2v1a2 2 0 01-2 2h-2m0 0v6m0-6H9m2 6H9a2 2 0 01-2-2v-1a2 2 0 012-2h2m0 0V7" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pricing data</h3>
            <p className="mt-1 text-sm text-gray-500">Base pricing has not been configured yet.</p>
          </div>
        ) : (
          // Pricing Table
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                    <div className="text-xs normal-case text-gray-400 font-normal">pieces/pound</div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                    <div className="text-xs normal-case text-gray-400 font-normal">Rupiah/pound</div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relative Size
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPrices.map((entry, index) => {
                  // Determine relative size category for visual reference
                  let sizeCategory = '';
                  let sizeCategoryColor = '';
                  
                  if (entry.size <= 30) {
                    sizeCategory = 'Large';
                    sizeCategoryColor = 'bg-green-100 text-green-800';
                  } else if (entry.size <= 60) {
                    sizeCategory = 'Medium';
                    sizeCategoryColor = 'bg-yellow-100 text-yellow-800';
                  } else if (entry.size <= 100) {
                    sizeCategory = 'Small';
                    sizeCategoryColor = 'bg-orange-100 text-orange-800';
                  } else {
                    sizeCategory = 'Extra Small';
                    sizeCategoryColor = 'bg-red-100 text-red-800';
                  }

                  return (
                    <tr 
                      key={`${entry.size}-${index}`}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-semibold text-gray-900">{entry.size}</div>
                          <div className="ml-2 text-xs text-gray-500">
                            ({entry.size} pcs/lb)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(entry.price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          per pound
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sizeCategoryColor}`}>
                          {sizeCategory}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Information */}
      {sortedPrices.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Size range: {Math.min(...sortedPrices.map(p => p.size))} - {Math.max(...sortedPrices.map(p => p.size))}
            </div>
            <div>
              Price range: {formatPrice(Math.min(...sortedPrices.map(p => p.price)))} - {formatPrice(Math.max(...sortedPrices.map(p => p.price)))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingDisplay;