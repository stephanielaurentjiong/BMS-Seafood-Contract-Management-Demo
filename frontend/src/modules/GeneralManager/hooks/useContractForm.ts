/**
 * @fileoverview Contract Form Management Hook
 * 
 * Custom hook for managing complex contract form state and operations.
 * Handles form validation, data transformation, and CRUD operations for contract forms.
 * 
 * Features:
 * - Complex form state management with dynamic arrays
 * - Supplier ID-based assignment with dropdown integration
 * - Form validation and error handling
 * - Data transformation between form data and contract objects
 * - Support for editing existing contracts
 * - Dynamic addition/removal of pricing, penalties, and delivery details
 * 
 * Business Logic:
 * - Base pricing entries for different shrimp sizes
 * - Size penalties for out-of-specification shrimp
 * - Multiple delivery details with dates, quantities, and size ranges
 * - Supplier assignment via UUID with customizable display names
 * - Form validation ensuring required fields are filled
 * 
 * @updated 2025-08-19 - Added supplier_id support
 */

import { useState } from "react";
import { NewContractForm, Contract } from "../types/contracts";
import { createContract, transformFormDataToApi } from "../../../utils/contractApi";

/**
 * Contract Form Management Hook
 * 
 * Manages complex form state for contract creation and editing.
 * Handles dynamic arrays, validation, and data transformation.
 * 
 * @hook useContractForm
 * @returns {Object} Form state and operations
 */
const useContractForm = () => {
  const [formData, setFormData] = useState<NewContractForm>({
    contractId: "",
    type: "New",
    supplierId: "",
    supplierName: "",
    status: "Open", 
    basePricing: [{ id: crypto.randomUUID(), size: "", price: "" }],
    sizePenalties: [{ id: crypto.randomUUID(), sizeRange: "", penaltyAmount: "", unit: "Rp/s" }],
    deliveryDetails: [{ id: crypto.randomUUID(), date: "", quantity: "", unit: "mt", sizeRange: "" }]
  });

  /**
   * Reset form to initial empty state
   * Clears all form fields and resets to default values with single empty entries
   */
  const resetForm = () => {
    setFormData({
      contractId: "",
      type: "New",
      supplierId: "",
      supplierName: "",
      status: "Open",
      basePricing: [{ id: crypto.randomUUID(), size: "", price: "" }],
      sizePenalties: [{ id: crypto.randomUUID(), sizeRange: "", penaltyAmount: "", unit: "Rp/s" }],
      deliveryDetails: [{ id: crypto.randomUUID(), date: "", quantity: "", unit: "mt", sizeRange: "" }]
    });
  };

  /**
   * Load existing contract data into form for editing
   * Transforms Contract object to NewContractForm format with generated IDs
   * @param contract - Contract object to load for editing
   */
  const loadContractForEdit = (contract: Contract) => {
    setFormData({
      contractId: contract.id,
      type: contract.type,
      supplierId: contract.supplierId || "",
      supplierName: contract.supplierName,
      status: contract.status,
      basePricing: contract.basePricing.map(bp => ({
        id: crypto.randomUUID(),
        size: bp.size,
        price: bp.price.toString()
      })),
      sizePenalties: contract.sizePenalties.map(sp => ({
        id: crypto.randomUUID(),
        sizeRange: sp.sizeRange,
        penaltyAmount: sp.penaltyAmount.toString(),
        unit: sp.unit
      })),
      deliveryDetails: contract.deliveryDetails.map(dd => ({
        id: crypto.randomUUID(),
        date: dd.date,
        quantity: dd.quantity.toString(),
        unit: dd.unit,
        sizeRange: dd.sizeRange
      }))
    });
  };

  const handleFormChange = (field: keyof NewContractForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateBasePricing = (id: string, field: 'size' | 'price', value: string) => {
    setFormData(prev => ({
      ...prev,
      basePricing: prev.basePricing.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateSizePenalty = (id: string, field: 'sizeRange' | 'penaltyAmount' | 'unit', value: string) => {
    setFormData(prev => ({
      ...prev,
      sizePenalties: prev.sizePenalties.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateDeliveryDetail = (id: string, field: 'date' | 'quantity' | 'unit' | 'sizeRange', value: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryDetails: prev.deliveryDetails.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addBasePricing = () => {
    setFormData(prev => ({
      ...prev,
      basePricing: [...prev.basePricing, { id: crypto.randomUUID(), size: "", price: "" }]
    }));
  };

  const addSizePenalty = () => {
    setFormData(prev => ({
      ...prev,
      sizePenalties: [...prev.sizePenalties, { id: crypto.randomUUID(), sizeRange: "", penaltyAmount: "", unit: "Rp/s" }]
    }));
  };

  const addDeliveryDetail = () => {
    setFormData(prev => ({
      ...prev,
      deliveryDetails: [...prev.deliveryDetails, { id: crypto.randomUUID(), date: "", quantity: "", unit: "mt", sizeRange: "" }]
    }));
  };

  /**
   * Set supplier information from dropdown selection
   * Updates both supplier ID and display name
   * @param supplierId - Selected supplier UUID
   * @param supplierName - Supplier's name for display
   */
  const setSupplier = (supplierId: string, supplierName: string) => {
    setFormData(prev => ({
      ...prev,
      supplierId,
      supplierName
    }));
  };

  /**
   * Validate form data before submission
   * Checks required fields and data integrity
   * @returns Error message if validation fails, null if valid
   */
  const validateForm = (): string | null => {
    if (!formData.supplierId.trim()) {
      return "Please select a supplier from the dropdown";
    }
    
    if (!formData.supplierName.trim()) {
      return "Please enter supplier display name";
    }
    
    if (!formData.contractId.trim()) {
      return "Please enter contract ID";
    }

    // Validate base pricing has at least one entry
    const validPricing = formData.basePricing.filter(bp => bp.size && bp.price);
    if (validPricing.length === 0) {
      return "Please add at least one pricing entry";
    }

    return null;
  };

  /**
   * Convert form data to Contract object (for local state)
   * Transforms form fields to proper Contract interface
   * @returns Contract object for local operations
   */
  const convertToContract = (): Contract => {
    return {
      id: formData.contractId,
      type: formData.type,
      supplierId: formData.supplierId,
      supplierName: formData.supplierName,
      status: formData.status,
      basePricing: formData.basePricing.filter(bp => bp.size && bp.price).map(bp => ({
        size: bp.size,
        price: parseFloat(bp.price) || 0
      })),
      sizePenalties: formData.sizePenalties.filter(sp => sp.sizeRange && sp.penaltyAmount).map(sp => ({
        sizeRange: sp.sizeRange,
        penaltyAmount: parseFloat(sp.penaltyAmount) || 0,
        unit: sp.unit
      })),
      deliveryDetails: formData.deliveryDetails.filter(dd => dd.date && dd.quantity).map(dd => ({
        date: dd.date,
        quantity: parseFloat(dd.quantity) || 0,
        unit: dd.unit,
        sizeRange: dd.sizeRange
      })),
      createdAt: new Date()
    };
  };

  /**
   * Submit contract to backend API
   * Validates form, transforms data, and sends to server
   * @returns Promise with created contract or error
   */
  const submitContract = async () => {
    const validationError = validateForm();
    if (validationError) {
      throw new Error(validationError);
    }

    // Transform form data to API format
    const apiData = transformFormDataToApi(formData, formData.supplierId);
    
    // Submit to backend
    const response = await createContract(apiData);
    
    // Reset form on successful submission
    resetForm();
    
    return response;
  };

  return {
    formData,
    resetForm,
    loadContractForEdit,
    handleFormChange,
    setSupplier,
    updateBasePricing,
    updateSizePenalty,
    updateDeliveryDetail,
    addBasePricing,
    addSizePenalty,
    addDeliveryDetail,
    validateForm,
    convertToContract,
    submitContract
  };
};

export default useContractForm;