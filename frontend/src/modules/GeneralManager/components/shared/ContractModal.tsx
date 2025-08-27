/**
 * @fileoverview Contract Modal Component
 * 
 * Complex modal form for creating and editing seafood purchase contracts.
 * Handles dynamic form sections including pricing, penalties, and delivery details.
 * 
 * Features:
 * - Contract basic information (ID, type, supplier, status)
 * - Dynamic base pricing entries for different shrimp sizes
 * - Size penalty configuration for out-of-spec shrimp
 * - Multiple delivery detail entries with dates and quantities
 * - Form validation and submission
 * 
 */

import React, { useState, useMemo } from "react";
import Modal from "../../../../shared/components/UI/Modal";
import Button from "../../../../shared/components/UI/Button";
import Input from "../../../../shared/components/UI/Input";
import FormField from "../../../../shared/components/Forms/FormField";
import { PricingDisplay, PricingCalculator, BasePriceEntry } from "../../../../shared/components/Pricing";
import { NewContractForm } from "../../types/contracts";
import useSuppliers from "../../../../hooks/useSuppliers";

/**
 * Props for ContractModal component
 * 
 * @interface ContractModalProps
 * @property {boolean} isOpen - Whether modal is visible
 * @property {NewContractForm} formData - Current form data
 * @property {Function} onClose - Callback to close modal
 * @property {Function} onSave - Callback to save contract
 * @property {Function} addBasePricing - Add new pricing entry
 * @property {Function} addSizePenalty - Add new penalty entry
 * @property {Function} addDeliveryDetail - Add new delivery entry
 * @property {Function} handleFormChange - Handle basic form changes
 * @property {Function} setSupplier - Set supplier from dropdown selection
 * @property {Function} updateBasePricing - Update pricing entry
 * @property {Function} updateSizePenalty - Update penalty entry
 * @property {Function} updateDeliveryDetail - Update delivery entry
 * @property {boolean} isEditing - Whether in edit mode
 */
interface ContractModalProps {
  isOpen: boolean;
  formData: NewContractForm;
  onClose: () => void;
  onSave: () => void;
  addBasePricing: () => void;
  addSizePenalty: () => void;
  addDeliveryDetail: () => void;
  handleFormChange: (field: keyof NewContractForm, value: any) => void;
  setSupplier: (supplierId: string, supplierName: string) => void;
  updateBasePricing: (id: string, field: 'size' | 'price', value: string) => void;
  updateSizePenalty: (id: string, field: 'sizeRange' | 'penaltyAmount' | 'unit', value: string) => void;
  updateDeliveryDetail: (id: string, field: 'date' | 'quantity' | 'unit' | 'sizeRange', value: string) => void;
  isEditing?: boolean;
}

const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  formData,
  onClose,
  onSave,
  addBasePricing,
  addSizePenalty,
  addDeliveryDetail,
  handleFormChange,
  setSupplier,
  updateBasePricing,
  updateSizePenalty,
  updateDeliveryDetail,
  isEditing = false
}) => {
  const [showPricingCalculator, setShowPricingCalculator] = useState(false);
  const { supplierOptions, loading: suppliersLoading, error: suppliersError } = useSuppliers();

  // Convert form data to BasePriceEntry format for pricing components
  const basePricesForCalculation: BasePriceEntry[] = useMemo(() => {
    return formData.basePricing
      .filter(pricing => pricing.size && pricing.price)
      .map(pricing => ({
        size: parseFloat(pricing.size) || 0,
        price: parseFloat(pricing.price) * 1000 || 0 // Convert from k Rupiah to Rupiah
      }))
      .filter(entry => entry.size > 0 && entry.price >= 0);
  }, [formData.basePricing]);
  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={onSave}>
        {isEditing ? 'Update Contract' : 'Save Contract'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Contract' : 'New Contract'}
      size="xl"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Contract Type and ID Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Contract Type">
            <select
              value={formData.type}
              onChange={(e) => handleFormChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="New">NEW</option>
              <option value="Add">ADD</option>
              <option value="Change">CHANGE</option>
            </select>
          </FormField>
          
          <Input
            label="Contract ID"
            placeholder="Unique ID (L.xxx)"
            value={formData.contractId}
            onChange={(e) => handleFormChange('contractId', e.target.value)}
            required
          />
        </div>

        {/* Supplier Selection and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <FormField label="Select Supplier">
              {suppliersLoading ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  Loading suppliers...
                </div>
              ) : suppliersError ? (
                <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600">
                  Error: {suppliersError}
                </div>
              ) : (
                <select
                  value={formData.supplierId}
                  onChange={(e) => {
                    const selectedOption = supplierOptions.find(option => option.value === e.target.value);
                    if (selectedOption) {
                      setSupplier(selectedOption.value, selectedOption.name);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a supplier...</option>
                  {supplierOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
            
            {/* Display Name Input (Editable) */}
            {formData.supplierId && (
              <Input
                label="Display Name (Optional)"
                placeholder="Custom name for this contract"
                value={formData.supplierName}
                onChange={(e) => handleFormChange('supplierName', e.target.value)}
                className="text-sm"
              />
            )}
          </div>
          
          <FormField label="Status">
            <select
              value={formData.status}
              onChange={(e) => handleFormChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </FormField>
        </div>

        {/* Base Pricing Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Base Pricing (CEO sets this)</h4>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPricingCalculator(!showPricingCalculator)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
                </svg>
                Calculator
              </Button>
              <Button variant="primary" size="sm" onClick={addBasePricing}>
                + Add Size
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {formData.basePricing.map((pricing) => (
              <div key={pricing.id} className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Size"
                  value={pricing.size}
                  onChange={(e) => updateBasePricing(pricing.id, 'size', e.target.value)}
                />
                <Input
                  placeholder="Price (k Rupiah)"
                  value={pricing.price}
                  onChange={(e) => updateBasePricing(pricing.id, 'price', e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Pricing Calculator */}
          {basePricesForCalculation.length > 0 && showPricingCalculator && (
            <div className="mt-6">
              <PricingCalculator
                basePrices={basePricesForCalculation}
                title="Price Calculator"
                showDetailedBreakdown={true}
                onCalculation={(size, result) => {
                  console.log(`Price calculation: Size ${size} = Rp${result.price}`);
                }}
              />
            </div>
          )}

          {basePricesForCalculation.length === 0 && formData.basePricing.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Complete pricing information needed
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Please enter valid size and price values to enable pricing calculations and preview.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Size Penalties Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Size Penalties (Turun)</h4>
            <Button variant="secondary" size="sm" onClick={addSizePenalty}>
              + Add Range
            </Button>
          </div>
          <div className="space-y-2">
            {formData.sizePenalties.map((penalty) => (
              <div key={penalty.id} className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Size Range (e.g., 100-150)"
                  value={penalty.sizeRange}
                  onChange={(e) => updateSizePenalty(penalty.id, 'sizeRange', e.target.value)}
                />
                <Input
                  placeholder="Penalty Amount"
                  value={penalty.penaltyAmount}
                  onChange={(e) => updateSizePenalty(penalty.id, 'penaltyAmount', e.target.value)}
                />
                <FormField>
                  <select
                    value={penalty.unit}
                    onChange={(e) => updateSizePenalty(penalty.id, 'unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Rp/s">Rp/s</option>
                    <option value="Rp/kg">Rp/kg</option>
                    <option value="Rp/sz">Rp/sz</option>
                  </select>
                </FormField>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Delivery Details (Supplier fills this)</h4>
            <Button variant="primary" size="sm" onClick={addDeliveryDetail}>
              + Add Delivery
            </Button>
          </div>
          <div className="space-y-2">
            {formData.deliveryDetails.map((delivery) => (
              <div key={delivery.id} className="grid grid-cols-4 gap-4">
                <Input
                  placeholder="Date (e.g., 27 Mei)"
                  value={delivery.date}
                  onChange={(e) => updateDeliveryDetail(delivery.id, 'date', e.target.value)}
                />
                <Input
                  placeholder="Quantity"
                  value={delivery.quantity}
                  onChange={(e) => updateDeliveryDetail(delivery.id, 'quantity', e.target.value)}
                />
                <FormField>
                  <select
                    value={delivery.unit}
                    onChange={(e) => updateDeliveryDetail(delivery.id, 'unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mt">mt</option>
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                  </select>
                </FormField>
                <Input
                  placeholder="Size Range (e.g., 30-90)"
                  value={delivery.sizeRange}
                  onChange={(e) => updateDeliveryDetail(delivery.id, 'sizeRange', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ContractModal;