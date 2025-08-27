/**
 * @fileoverview Supplier Contract Modal Component
 * 
 * Modal component based on GM's ContractModal but customized for suppliers:
 * - Shows complete contract form with all fields visible
 * - Disables all fields except delivery details section
 * - Allows suppliers to see full context while editing only deliveries
 * - Maintains delivery-only save behavior
 * 
 */

import React, { useState, useMemo, useEffect } from "react";
import Modal from "../../../shared/components/UI/Modal";
import Button from "../../../shared/components/UI/Button";
import Input from "../../../shared/components/UI/Input";
import FormField from "../../../shared/components/Forms/FormField";
import { PricingCalculator, BasePriceEntry } from "../../../shared/components/Pricing";
import { Contract } from "../../GeneralManager/types/contracts";
import { DeliveryData, updateContractDeliveries } from "../../../utils/contractApi";

/**
 * Form state for delivery entry
 */
interface DeliveryFormEntry {
  id: string;
  date: string;
  quantity: string;
  unit: string;
  sizeRange: string;
}

/**
 * Props for SupplierContractModal component
 */
interface SupplierContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onSave: (updatedContract: Contract) => void;
}

/**
 * SupplierContractModal - Complete contract form for suppliers with delivery-only editing
 * 
 * Shows the exact same form as GM's ContractModal but:
 * - All fields are disabled except delivery details
 * - Suppliers can see complete contract context
 * - Only delivery changes are saved to backend
 * 
 * @param props - Component props
 * @returns Modal component for supplier contract viewing/delivery editing
 */
const SupplierContractModal: React.FC<SupplierContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSave
}) => {
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryFormEntry[]>([]);
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPricingCalculator, setShowPricingCalculator] = useState(false);

  // Convert contract to form data for display
  const formData = useMemo(() => ({
    contractId: contract.id,
    type: contract.type,
    supplierId: contract.supplierId || '',
    supplierName: contract.supplierName,
    status: contract.status,
    basePricing: contract.basePricing.map((pricing, index) => ({
      id: `pricing-${index}`,
      size: pricing.size,
      price: pricing.price.toString() // Display price as-is to match GM format
    })),
    sizePenalties: contract.sizePenalties.map((penalty, index) => ({
      id: `penalty-${index}`,
      sizeRange: penalty.sizeRange,
      penaltyAmount: penalty.penaltyAmount.toString(),
      unit: penalty.unit
    }))
  }), [contract]);

  // Convert base pricing for calculator
  const basePricesForCalculation: BasePriceEntry[] = useMemo(() => {
    return contract.basePricing
      .filter(pricing => pricing.size && pricing.price)
      .map(pricing => ({
        size: parseFloat(pricing.size) || 0,
        price: pricing.price || 0 // Use pricing.price directly as it's already in Rupiah
      }))
      .filter(entry => entry.size > 0 && entry.price >= 0);
  }, [contract.basePricing]);

  // Initialize delivery details when modal opens
  useEffect(() => {
    if (isOpen && contract) {
      const initialDeliveries = contract.deliveryDetails.map((delivery, index) => ({
        id: `delivery-${index}`,
        date: delivery.date,
        quantity: delivery.quantity.toString(),
        unit: delivery.unit,
        sizeRange: delivery.sizeRange
      }));
      
      // If no existing deliveries, start with one empty entry
      if (initialDeliveries.length === 0) {
        setDeliveryDetails([{ id: 'delivery-0', date: '', quantity: '', unit: 'mt', sizeRange: '' }]);
      } else {
        setDeliveryDetails(initialDeliveries);
      }
      setError(null);
    }
  }, [isOpen, contract]);

  /**
   * Add new delivery entry
   */
  const addDeliveryDetail = () => {
    const newId = `delivery-${Date.now()}`;
    setDeliveryDetails(prev => [...prev, { 
      id: newId, 
      date: '', 
      quantity: '', 
      unit: 'mt', 
      sizeRange: '' 
    }]);
  };

  /**
   * Update delivery entry field
   */
  const updateDeliveryDetail = (id: string, field: keyof Omit<DeliveryFormEntry, 'id'>, value: string) => {
    setDeliveryDetails(prev => prev.map(delivery => 
      delivery.id === id ? { ...delivery, [field]: value } : delivery
    ));
  };

  /**
   * Remove delivery entry
   */
  const removeDeliveryDetail = (id: string) => {
    setDeliveryDetails(prev => prev.filter(delivery => delivery.id !== id));
  };

  /**
   * Validate delivery entries
   */
  const validateDeliveries = (): string[] => {
    const errors: string[] = [];

    // Allow 0 deliveries - suppliers can delete all delivery entries
    if (deliveryDetails.length === 0) {
      return errors; // No validation errors for empty deliveries
    }

    deliveryDetails.forEach((delivery, index) => {
      if (!delivery.date.trim()) {
        errors.push(`Delivery ${index + 1}: Date is required`);
      }
      if (!delivery.quantity.trim()) {
        errors.push(`Delivery ${index + 1}: Quantity is required`);
      } else {
        const qty = parseFloat(delivery.quantity);
        if (isNaN(qty) || qty <= 0) {
          errors.push(`Delivery ${index + 1}: Quantity must be a positive number`);
        }
      }
      if (!delivery.unit) {
        errors.push(`Delivery ${index + 1}: Unit is required`);
      }
      if (!delivery.sizeRange.trim()) {
        errors.push(`Delivery ${index + 1}: Size range is required`);
      }
    });

    return errors;
  };

  /**
   * Detect contract type change based on delivery modifications
   */
  const detectContractTypeChange = (originalDeliveries: any[], newDeliveries: DeliveryFormEntry[]): { type: string | null, details: string } => {
    const originalData = originalDeliveries.map(d => ({
      date: d.date,
      quantity: d.quantity.toString(),
      unit: d.unit,
      sizeRange: d.sizeRange
    }));

    // Priority 1: If ANY existing delivery was modified → "Change"
    const modifications: string[] = [];
    const hasModifications = originalData.some((orig, index) => {
      const updated = newDeliveries[index];
      if (!updated) return false; // Delivery was removed
      
      if (orig.date !== updated.date) {
        modifications.push(`date changed from '${orig.date}' to '${updated.date}'`);
        return true;
      }
      if (orig.quantity !== updated.quantity) {
        modifications.push(`quantity changed from '${orig.quantity}' to '${updated.quantity}'`);
        return true;
      }
      if (orig.unit !== updated.unit) {
        modifications.push(`unit changed from '${orig.unit}' to '${updated.unit}'`);
        return true;
      }
      if (orig.sizeRange !== updated.sizeRange) {
        modifications.push(`size range changed from '${orig.sizeRange}' to '${updated.sizeRange}'`);
        return true;
      }
      return false;
    });
    
    if (hasModifications) {
      return {
        type: "Change",
        details: `Modified existing deliveries: ${modifications.join(', ')}`
      };
    }
    
    // Priority 2: If deliveries were added (but none modified) → "Add"  
    if (newDeliveries.length > originalData.length) {
      const addedCount = newDeliveries.length - originalData.length;
      return {
        type: "Add",
        details: `Added ${addedCount} new ${addedCount === 1 ? 'delivery' : 'deliveries'}`
      };
    }
    
    return { type: null, details: 'No changes requiring type update' }; // No type change needed
  };

  /**
   * Save delivery changes (delivery-only save behavior)
   */
  const handleSave = async () => {
    try {
      setError(null);
      
      // Check if contract is closed
      if (contract.status === 'Closed') {
        setError('Cannot update deliveries. This contract has been closed by the General Manager.');
        return;
      }
      
      // Validate form data
      const validationErrors = validateDeliveries();
      if (validationErrors.length > 0) {
        setError(validationErrors.join('\n'));
        return;
      }

      setSaving(true);

      // Transform form data to API format
      const deliveryData: DeliveryData[] = deliveryDetails.map(delivery => ({
        date: delivery.date.trim(),
        quantity: parseFloat(delivery.quantity),
        unit: delivery.unit,
        sizeRange: delivery.sizeRange.trim()
      }));

      // Detect contract type change based on delivery modifications
      const typeChange = detectContractTypeChange(contract.deliveryDetails, deliveryDetails);
      
      console.log(`Contract type detection:`, typeChange);
      if (typeChange.type) {
        console.log(`📝 Contract ${contract.id} type will change from "${contract.type}" to "${typeChange.type}" - ${typeChange.details}`);
      }

      // Call API to update deliveries with contract type change
      const contractIdToUse = contract.databaseId || contract.id;
      console.log(`Updating deliveries for contract ID: ${contractIdToUse}`);
      console.log(`Delivery data:`, deliveryData);
      
      await updateContractDeliveries(
        contractIdToUse, 
        deliveryData,
        typeChange.type,
        typeChange.details
      );

      // Transform updated contract back to frontend format
      const updatedContract: Contract = {
        ...contract,
        type: typeChange.type || contract.type, // Update contract type if changed
        deliveryDetails: deliveryData.map(d => ({
          date: d.date,
          quantity: d.quantity,
          unit: d.unit,
          sizeRange: d.sizeRange
        }))
      };

      // Notify parent component of successful save
      onSave(updatedContract);
      onClose();

      console.log(`Deliveries updated for contract ${contract.id}`);

    } catch (err: any) {
      console.error('Failed to update deliveries:', err);
      setError(err.message || 'Failed to update delivery details');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle modal close with confirmation if unsaved changes
   */
  const handleClose = () => {
    if (loading) return; // Prevent closing while saving
    onClose();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={loading}>
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={loading || contract.status === 'Closed'}>
        {loading ? 'Saving...' : 'Save Delivery Changes'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Contract Details - ${contract.id}`}
      size="xl"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Contract Type and ID Row - DISABLED */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Contract Type">
            <select
              value={formData.type}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
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
            onChange={() => {}} // Dummy handler for disabled input
            disabled
            className="bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Supplier Selection and Status Row - DISABLED */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <FormField label="Supplier">
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                {formData.supplierName}
              </div>
            </FormField>
          </div>
          
          <FormField label="Status">
            <select
              value={formData.status}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </FormField>
        </div>

        {/* Base Pricing Section - DISABLED */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-600">Base Pricing (CEO sets this)</h4>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPricingCalculator(!showPricingCalculator)}
                disabled={basePricesForCalculation.length === 0}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
                </svg>
                Calculator
              </Button>
              <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                + Add Size (Disabled)
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {formData.basePricing.map((pricing) => (
              <div key={pricing.id} className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Size"
                  value={pricing.size}
                  onChange={() => {}} // Dummy handler for disabled input
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <Input
                  placeholder="Price (k Rupiah)"
                  value={pricing.price}
                  onChange={() => {}} // Dummy handler for disabled input
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
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

          {formData.basePricing.length === 0 && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-500">No pricing information available for this contract.</p>
            </div>
          )}
        </div>

        {/* Size Penalties Section - DISABLED */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-600">Size Penalties (Turun)</h4>
            <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
              + Add Range (Disabled)
            </Button>
          </div>
          <div className="space-y-2">
            {formData.sizePenalties.map((penalty) => (
              <div key={penalty.id} className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Size Range (e.g., 100-150)"
                  value={penalty.sizeRange}
                  onChange={() => {}} // Dummy handler for disabled input
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <Input
                  placeholder="Penalty Amount"
                  value={penalty.penaltyAmount}
                  onChange={() => {}} // Dummy handler for disabled input
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <FormField>
                  <select
                    value={penalty.unit}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  >
                    <option value="Rp/s">Rp/s</option>
                    <option value="Rp/kg">Rp/kg</option>
                    <option value="Rp/sz">Rp/sz</option>
                  </select>
                </FormField>
              </div>
            ))}
          </div>
          {formData.sizePenalties.length === 0 && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-500">No size penalties defined for this contract.</p>
            </div>
          )}
        </div>

        {/* Closed Contract Warning */}
        {contract.status === 'Closed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Contract Closed
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>This contract has been closed by the General Manager. Delivery details cannot be modified.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <pre className="whitespace-pre-wrap">{error}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Details Section - ENABLED */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Delivery Details (You can edit this)</h4>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={addDeliveryDetail}
              disabled={loading || contract.status === 'Closed'}
            >
              + Add Delivery
            </Button>
          </div>
          <div className="space-y-2">
            {deliveryDetails.map((delivery) => (
              <div key={delivery.id} className="relative">
                <div className="grid grid-cols-4 gap-4">
                  <Input
                    placeholder="Date (e.g., 27 Mei)"
                    value={delivery.date}
                    onChange={(e) => updateDeliveryDetail(delivery.id, 'date', e.target.value)}
                    disabled={loading || contract.status === 'Closed'}
                  />
                  <Input
                    placeholder="Quantity"
                    value={delivery.quantity}
                    onChange={(e) => updateDeliveryDetail(delivery.id, 'quantity', e.target.value)}
                    disabled={loading || contract.status === 'Closed'}
                  />
                  <FormField>
                    <select
                      value={delivery.unit}
                      onChange={(e) => updateDeliveryDetail(delivery.id, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading || contract.status === 'Closed'}
                    >
                      <option value="mt">mt</option>
                      <option value="kg">kg</option>
                      <option value="ton">ton</option>
                    </select>
                  </FormField>
                  <div className="relative">
                    <Input
                      placeholder="Size Range (e.g., 30-90)"
                      value={delivery.sizeRange}
                      onChange={(e) => updateDeliveryDetail(delivery.id, 'sizeRange', e.target.value)}
                      disabled={loading || contract.status === 'Closed'}
                    />
                    <button
                      onClick={() => removeDeliveryDetail(delivery.id)}
                      className="absolute -right-8 top-2 text-red-600 hover:text-red-800 transition-colors"
                      disabled={loading || contract.status === 'Closed'}
                      title="Remove this delivery"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {deliveryDetails.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No delivery schedules
              </h3>
              <p className="text-gray-500 mb-4">Add your first delivery schedule to get started.</p>
              <Button 
                onClick={addDeliveryDetail} 
                disabled={loading || contract.status === 'Closed'}
              >
                Add First Delivery
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SupplierContractModal;