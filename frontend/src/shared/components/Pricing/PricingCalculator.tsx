/**
 * @fileoverview Interactive Pricing Calculator Component
 * 
 * Side panel calculator for real-time price calculations using interpolation logic.
 * Allows users to input any size and get instant price calculations with detailed breakdowns.
 * 
 * Features:
 * - Real-time calculation as user types
 * - Detailed formula breakdown and step-by-step explanation
 * - Visual indicators for calculation type (exact, interpolated, penalty)
 * - Error handling and validation with user-friendly messages
 * - Professional calculator-style interface
 * - Support for both base price interpolation and penalty calculations
 * 
 * Business Context:
 * - Available to both GM and Supplier for price calculations
 * - Shows calculations for sizes not explicitly in the base pricing table
 * - Helps users understand pricing logic and validate calculations
 * - Supports contract negotiation and planning workflow
 * 
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BasePriceEntry, 
  PriceCalculationResult, 
  calculatePrice, 
  formatPrice 
} from '../../utils/pricingCalculator';
import Input from '../UI/Input';
import Button from '../UI/Button';

/**
 * Props interface for PricingCalculator component
 * 
 * @interface PricingCalculatorProps
 * @property {BasePriceEntry[]} basePrices - Array of base pricing entries for calculations
 * @property {string} title - Calculator title (default: "Price Calculator")
 * @property {boolean} showDetailedBreakdown - Show detailed calculation steps (default: true)
 * @property {(size: number, result: PriceCalculationResult) => void} onCalculation - Optional callback when calculation is performed
 * @property {string} className - Additional CSS classes (optional)
 */
interface PricingCalculatorProps {
  basePrices: BasePriceEntry[];
  title?: string;
  showDetailedBreakdown?: boolean;
  onCalculation?: (size: number, result: PriceCalculationResult) => void;
  className?: string;
}

/**
 * PricingCalculator - Interactive calculator for real-time price calculations
 * 
 * Features:
 * - Input field with validation and formatting
 * - Real-time calculation results
 * - Color-coded result types (exact, interpolated, penalty, error)
 * - Expandable detailed breakdown section
 * - Quick size buttons for common sizes
 * - Clear and reset functionality
 * - Responsive design for different screen sizes
 * 
 * Calculation Types:
 * - Exact: Direct match from base pricing
 * - Interpolated: Linear calculation between base prices
 * - Penalty: Progressive reduction for sizes above base range
 * - Error: Invalid input or calculation issues
 * 
 * @param props - Component props with base prices and configuration
 * @returns Interactive calculator interface with real-time results
 * 
 * @example
 * ```tsx
 * const basePrices = [
 *   { size: 20, price: 88000 },
 *   { size: 30, price: 80000 },
 *   { size: 100, price: 48000 }
 * ];
 * 
 * <PricingCalculator
 *   basePrices={basePrices}
 *   title="Contract Price Calculator"
 *   onCalculation={(size, result) => console.log(`Size ${size}: ${result.price}`)}
 * />
 * ```
 */
const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  basePrices,
  title = "Price Calculator",
  showDetailedBreakdown = true,
  onCalculation,
  className = ""
}) => {
  const [inputSize, setInputSize] = useState<string>('');
  const [calculationResult, setCalculationResult] = useState<PriceCalculationResult | null>(null);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Quick size buttons based on common business sizes
  const quickSizes = useMemo(() => {
    const baseSize = basePrices.map(p => p.size);
    const commonSizes = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200];
    
    // Filter to show only relevant sizes (some base sizes + some common intermediate sizes)
    return commonSizes
      .filter(size => !baseSize.includes(size)) // Don't duplicate base sizes
      .slice(0, 6); // Limit to 6 quick buttons
  }, [basePrices]);

  /**
   * Performs calculation and updates state
   * Handles validation, calculation, and callback invocation
   */
  const performCalculation = async (sizeValue: string) => {
    if (!sizeValue.trim()) {
      setCalculationResult(null);
      return;
    }

    const sizeNumber = parseFloat(sizeValue);
    
    if (isNaN(sizeNumber) || sizeNumber <= 0) {
      setCalculationResult({
        price: 0,
        type: 'error',
        formula: 'Invalid Input',
        breakdown: 'Please enter a valid positive number for size'
      });
      return;
    }

    setIsCalculating(true);
    
    // Small delay to show loading state for better UX
    setTimeout(() => {
      const result = calculatePrice(sizeNumber, basePrices);
      setCalculationResult(result);
      setIsCalculating(false);
      
      // Invoke callback if provided
      if (onCalculation) {
        onCalculation(sizeNumber, result);
      }
    }, 100);
  };

  // Effect to calculate when input changes
  useEffect(() => {
    performCalculation(inputSize);
  }, [inputSize, basePrices]);

  /**
   * Handles input change with validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow only numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputSize(value);
    }
  };

  /**
   * Handles quick size button clicks
   */
  const handleQuickSize = (size: number) => {
    setInputSize(size.toString());
  };

  /**
   * Clears the calculator
   */
  const handleClear = () => {
    setInputSize('');
    setCalculationResult(null);
    setShowBreakdown(false);
  };

  /**
   * Gets styling for result type
   */
  const getResultTypeStyle = (type: PriceCalculationResult['type']) => {
    switch (type) {
      case 'exact':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'interpolated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'penalty':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * Gets display label for calculation type
   */
  const getResultTypeLabel = (type: PriceCalculationResult['type']) => {
    switch (type) {
      case 'exact':
        return 'Exact Match';
      case 'interpolated':
        return 'Interpolated';
      case 'penalty':
        return 'Penalty Calculation';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Calculator Body */}
      <div className="p-6 space-y-6">
        {/* Size Input */}
        <div>
          <Input
            label="Enter Size"
            placeholder="e.g., 25, 45, 120"
            value={inputSize}
            onChange={handleInputChange}
            className="text-lg"
          />
          <div className="mt-2 text-sm text-gray-500">
            Enter shrimp size (pieces per pound)
          </div>
        </div>

        {/* Quick Size Buttons */}
        {quickSizes.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Quick Sizes:</div>
            <div className="flex flex-wrap gap-2">
              {quickSizes.map((size) => (
                <Button
                  key={size}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSize(size)}
                  className="text-xs"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Calculation Result */}
        {isCalculating && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Calculating...</span>
            </div>
          </div>
        )}

        {calculationResult && !isCalculating && (
          <div className="space-y-4">
            {/* Price Result */}
            <div className={`p-4 rounded-lg border ${getResultTypeStyle(calculationResult.type)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {getResultTypeLabel(calculationResult.type)}
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {calculationResult.type === 'error' ? 'N/A' : formatPrice(calculationResult.price)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Size {inputSize}</div>
                  <div className="text-xs text-gray-500">per pound</div>
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm font-medium text-gray-700 mb-1">Formula:</div>
              <div className="text-sm font-mono text-gray-600">{calculationResult.formula}</div>
            </div>

            {/* Detailed Breakdown */}
            {showDetailedBreakdown && calculationResult.breakdown && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-full justify-center"
                >
                  {showBreakdown ? 'Hide' : 'Show'} Detailed Breakdown
                  <svg 
                    className={`w-4 h-4 ml-2 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>

                {showBreakdown && (
                  <div className="mt-3 bg-gray-50 p-4 rounded-md">
                    <div className="text-sm font-medium text-gray-700 mb-2">Calculation Steps:</div>
                    <div className="text-sm font-mono text-gray-600 whitespace-pre-line">
                      {calculationResult.breakdown}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1"
            disabled={!inputSize && !calculationResult}
          >
            Clear
          </Button>
          {calculationResult && calculationResult.type !== 'error' && (
            <Button
              variant="primary"
              onClick={() => {
                // Copy to clipboard functionality
                const textToCopy = `Size ${inputSize}: ${formatPrice(calculationResult.price)} (${getResultTypeLabel(calculationResult.type)})`;
                navigator.clipboard.writeText(textToCopy).then(() => {
                  // Could add toast notification here
                });
              }}
              className="flex-1"
            >
              Copy Result
            </Button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      {basePrices.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Base pricing: {Math.min(...basePrices.map(p => p.size))} - {Math.max(...basePrices.map(p => p.size))} sizes configured
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingCalculator;