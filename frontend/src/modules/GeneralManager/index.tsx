/**
 * @fileoverview General Manager Dashboard - Main component for contract management
 * 
 * This is the primary dashboard interface for General Managers in the Seafood Contract Management System. It provides a tabbed interface for managing contracts and database operations with full CRUD capabilities.
 * 
 * Features:
 * - Contract Collaboration: Create, edit, delete contracts with suppliers
 * - Database System: View and manage contract database with import/export
 * - Modal-based contract creation/editing with complex pricing logic
 * - Tab-based navigation for organized workflow
 * 
 * Business Logic:
 * - Contract pricing with size-based interpolation (20-100 sizes)
 * - Size penalties for out-of-range shrimp sizes (101+ sizes)  
 * - Delivery scheduling with multiple dates and quantities
 * - Status tracking (New, Open, Agreed, Completed)
 * 
 * @version 2.0.0 (Refactored from monolithic 693-line component)
 */

import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../shared/components/Layout/DashboardLayout";
import TabNavigation from "./components/shared/TabNavigation";
import api from "../../utils/api";
import ContractModal from "./components/shared/ContractModal";
import ContractList from "./components/ContractCollaboration/ContractList";
import DatabaseTable from "./components/DatabaseSystem/DatabaseTable";
import useContracts from "./hooks/useContracts";
import useContractForm from "./hooks/useContractForm";
import { TabType, Contract } from "./types/contracts";
import { transformApiDataToContract, updateContract as updateContractApi, transformFormDataToApi } from "../../utils/contractApi";

/**
 * GeneralManagerDashboard - Main dashboard component for General Managers
 * 
 * Provides a comprehensive interface for managing seafood contracts with suppliers.
 * Uses a modular architecture with separated business logic and reusable components.
 * 
 * Architecture:
 * - Hook-based state management (useContracts, useContractForm)
 * - Modular components for maintainability
 * - Tab-based navigation for workflow organization
 * - Modal-based contract editing with complex form validation
 * 
 * @component
 * @returns {JSX.Element} The complete General Manager Dashboard interface
 */
const GeneralManagerDashboard: React.FC = () => {
  // Authentication and user management
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  
  /** @type {TabType} Current active tab - determines which view is displayed */
  const [activeTab, setActiveTab] = useState<TabType>("contract-collaboration");
  
  /** @type {boolean} Controls contract modal visibility for create/edit operations */
  const [showContractModal, setShowContractModal] = useState(false);
  
  /** @type {Contract|null} Contract being edited (null for new contracts) */
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  /**
   * Contract management hook providing CRUD operations with API integration
   * @hook useContracts
   * @returns {Object} Contract operations and state
   */
  const {
    contracts,        // Array of all contracts
    addContract,      // Add new contract to state
    updateContract,   // Update existing contract
    deleteContract,   // Remove contract from state
    refreshContracts, // Manually refresh contract data
    updateStatus      // Update contract status
  } = useContracts();

  /**
   * Form management hook for contract creation/editing with API integration
   * @hook useContractForm
   * @returns {Object} Form state and handlers for complex contract forms
   */
  const {
    formData,              // Current form data with supplier_id, pricing, penalties, delivery details
    resetForm,             // Reset form to initial state
    loadContractForEdit,   // Load contract data for editing
    handleFormChange,      // Handle basic form field changes
    setSupplier,           // Set supplier from dropdown selection
    updateBasePricing,     // Update base pricing entries
    updateSizePenalty,     // Update size penalty entries
    updateDeliveryDetail,  // Update delivery detail entries
    addBasePricing,        // Add new base pricing entry
    addSizePenalty,        // Add new size penalty entry
    addDeliveryDetail,     // Add new delivery detail entry
    validateForm,          // Validate form data before submission
    convertToContract,     // Convert form data to Contract object
    submitContract         // Submit contract to API
  } = useContractForm();

  /** @type {boolean} Saving state for contract submission */
  const [saving, setSaving] = useState(false);

  /**
   * Handle user logout and redirect to login page
   * Clears authentication state and navigates away from dashboard
   * @function handleLogout
   * @returns {void}
   */
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  /**
   * Open modal for creating new contract
   * Resets form data and opens modal in create mode
   * @function handleNewContract
   * @returns {void}
   */
  const handleNewContract = () => {
    resetForm();
    setEditingContract(null);
    setShowContractModal(true);
  };

  /**
   * Open modal for editing existing contract
   * Loads contract data into form and opens modal in edit mode
   * @function handleEditContract
   * @param {Contract} contract - Contract to edit
   * @returns {void}
   */
  const handleEditContract = (contract: Contract) => {
    loadContractForEdit(contract);
    setEditingContract(contract);
    setShowContractModal(true);
  };

  /**
   * Delete contract with user confirmation
   * Shows confirmation dialog before making API call to delete contract
   * @function handleDeleteContract
   * @param {string} contractId - ID of contract to delete
   * @returns {Promise<void>}
   */
  const handleDeleteContract = async (contractId: string) => {
    if (window.confirm("Are you sure you want to delete this contract? This action cannot be undone.")) {
      try {
        await deleteContract(contractId);
        alert('Contract deleted successfully!');
      } catch (error: any) {
        alert(`Failed to delete contract: ${error.message}`);
      }
    }
  };

  /**
   * Toggle contract status between Open and Closed
   * Makes API call to update contract status and refreshes local state
   * @function handleStatusToggle
   * @param {string} contractId - ID of contract to update status
   * @param {string} newStatus - New status ('Open' or 'Closed')
   * @returns {Promise<void>}
   */
  const handleStatusToggle = async (contractId: string, newStatus: 'Open' | 'Closed') => {
    try {
      await updateStatus(contractId, newStatus);
      console.log(`Contract ${contractId} status updated to ${newStatus}`);
      
      // Show success notification
      const action = newStatus === 'Closed' ? 'closed' : 'opened';
      alert(`Contract successfully ${action}! ${newStatus === 'Closed' ? 'Suppliers can no longer edit delivery details.' : 'Suppliers can now edit delivery details.'}`);
      
    } catch (error: any) {
      console.error('Status toggle error:', error);
      alert(`Failed to update contract status: ${error.message}`);
    }
  };

  /**
   * Transfer contract data to Database System
   * Transforms contract data and sends to backend for database storage
   * @function handleTransferToDb
   * @param {Contract} contract - Contract to transfer to database system
   * @returns {Promise<void>}
   */
  const handleTransferToDb = async (contract: Contract) => {
    if (!window.confirm(`Are you sure you want to transfer contract ${contract.id} to the Database System? This action will finalize the contract data.`)) {
      return;
    }

    try {
      console.log('Transferring contract to database:', contract);
      
      // API call to transfer contract to Database System
      const response = await api.post(`/contracts/${contract.databaseId || contract.id}/transfer`);

      console.log('Transfer response:', response.data);

      // Refresh contracts to update transfer status
      await refreshContracts();
      
      alert(`Contract ${contract.id} successfully transferred to Database System!`);
      
    } catch (error: any) {
      console.error('Transfer error:', error);
      alert(`Failed to transfer contract: ${error.message}`);
    }
  };

  /**
   * Save contract via API (create new or update existing)
   * Validates form data, submits to backend, and updates local state
   * Handles both create and update operations with proper error handling
   * @function handleSaveContract
   * @returns {Promise<void>}
   */
  const handleSaveContract = async () => {
    try {
      setSaving(true);
      
      if (editingContract) {
        // For editing: use API to update contract in database
        const error = validateForm();
        if (error) {
          alert(error);
          return;
        }
        
        // Transform form data to API format
        const apiData = transformFormDataToApi(formData, formData.supplierId || '');
        
        // Call API to update contract
        const response = await updateContractApi(
          editingContract.databaseId || editingContract.id,
          apiData
        );
        
        // Transform response back to frontend format and update local state
        const updatedContract = transformApiDataToContract(response.contract);
        updateContract(updatedContract);
        
        alert('Contract updated successfully!');
      } else {
        // For new contracts: use API submission
        const response = await submitContract();
        
        // Transform API response to Contract format and add to local state
        const newContract = transformApiDataToContract(response.contract);
        
        addContract(newContract);
        alert('Contract created successfully!');
      }
      
      // Close modal and reset form
      setEditingContract(null);
      setShowContractModal(false);
      
    } catch (error: any) {
      console.error('Save contract error:', error);
      alert(`Failed to save contract: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Close contract modal and reset form state
   * Cancels any pending create/edit operations
   * @function handleCloseModal
   * @returns {void}
   */
  const handleCloseModal = () => {
    resetForm();
    setEditingContract(null);
    setShowContractModal(false);
  };

  // Authentication guards
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'general_manager') {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout
      title="General Manager Dashboard"
      userName={user?.name}
      onLogout={handleLogout}
    >
      <div className="space-y-0 -mt-8">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="py-8">
          {activeTab === "contract-collaboration" && (
            <ContractList
              contracts={contracts}
              onNewContract={handleNewContract}
              onEditContract={handleEditContract}
              onDeleteContract={handleDeleteContract}
              onStatusToggle={handleStatusToggle}
              onTransferToDb={handleTransferToDb}
            />
          )}
          
          {activeTab === "database-system" && (
            <DatabaseTable />
          )}
        </div>

        <ContractModal
          isOpen={showContractModal}
          formData={formData}
          onClose={handleCloseModal}
          onSave={handleSaveContract}
          addBasePricing={addBasePricing}
          addSizePenalty={addSizePenalty}
          addDeliveryDetail={addDeliveryDetail}
          handleFormChange={handleFormChange}
          setSupplier={setSupplier}
          updateBasePricing={updateBasePricing}
          updateSizePenalty={updateSizePenalty}
          updateDeliveryDetail={updateDeliveryDetail}
          isEditing={!!editingContract}
        />
      </div>
    </DashboardLayout>
  );
};

export default GeneralManagerDashboard;