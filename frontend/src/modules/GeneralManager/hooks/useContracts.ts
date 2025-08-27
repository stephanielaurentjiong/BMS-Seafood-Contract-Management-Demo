/**
 * @fileoverview Contract Management Hook
 * 
 * Custom hook for managing contract state and operations in the General Manager Dashboard.
 * Provides CRUD operations for contracts with API integration and state management.
 * 
 * Features:
 * - Contract state management with API integration
 * - CRUD operations (Create, Read, Update, Delete)
 * - Contract ID generation following L{timestamp}.{random}.00 format
 * - Loading states and error handling
 * - Real-time sync with backend
 * 
 * @updated 2025-08-19 - Added API integration
 */

import { useState, useEffect } from "react";
import { Contract } from "../types/contracts";
import { getContracts, transformApiDataToContract, updateContractStatus, deleteContract as deleteContractApi } from "../../../utils/contractApi";

/**
 * Contract Management Hook
 * 
 * Manages the state and operations for contracts in the General Manager Dashboard.
 * Integrates with backend API for real-time data synchronization.
 * 
 * @hook useContracts
 * @returns {Object} Contract state and CRUD operations
 * @returns {Contract[]} contracts - Array of all contracts
 * @returns {boolean} loading - Loading state for API requests
 * @returns {string | null} error - Error message if operations fail
 * @returns {Function} addContract - Add new contract to state
 * @returns {Function} updateContract - Update existing contract by ID
 * @returns {Function} deleteContract - Remove contract from state by ID
 * @returns {Function} generateContractId - Generate unique contract ID
 * @returns {Function} refreshContracts - Manually refresh contract data
 * @returns {Function} updateStatus - Update contract status
 */
const useContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch contracts from API
   * Handles loading states, error management, and data transformation
   */
  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getContracts();
      const transformedContracts = response.contracts.map(transformApiDataToContract);
      setContracts(transformedContracts);
      
      console.log(`Loaded ${transformedContracts.length} contracts for GM dashboard`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load contracts';
      setError(errorMessage);
      console.error('Contract fetch error:', errorMessage);
      
      // Clear contracts on error to prevent stale data
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manual refresh function for error recovery or data refresh
   */
  const refreshContracts = async (): Promise<void> => {
    await fetchContracts();
  };

  // Initial data fetch on mount
  useEffect(() => {
    fetchContracts();
  }, []);

  /**
   * Add new contract to the contracts list
   * Prepends the new contract to maintain chronological order (newest first)
   * @param contract - Complete contract object to add
   */
  const addContract = (contract: Contract) => {
    setContracts(prev => [contract, ...prev]);
  };

  /**
   * Update existing contract by replacing it with updated version
   * Finds contract by ID and replaces entire object
   * @param updatedContract - Updated contract object with same ID
   */
  const updateContract = (updatedContract: Contract) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === updatedContract.id ? updatedContract : contract
      )
    );
  };

  /**
   * Delete contract via API and remove from state
   * Calls backend API to permanently delete contract, then updates local state
   * Only succeeds if user has permission to delete the contract
   * @param contractId - Unique contract identifier to remove
   */
  const deleteContract = async (contractId: string) => {
    try {
      // Call API to delete contract from database
      await deleteContractApi(contractId);
      
      // Only remove from local state if API call succeeded
      setContracts(prev => prev.filter(contract => 
        (contract.databaseId || contract.id) !== contractId
      ));
      
      console.log(`Contract ${contractId} deleted successfully`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete contract';
      setError(errorMessage);
      console.error('Contract deletion error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Update contract status via API
   * @param contractId - Contract UUID to update
   * @param status - New status (Open or Closed)
   */
  const updateStatus = async (contractId: string, status: string) => {
    try {
      await updateContractStatus(contractId, status);
      
      // Update local state
      setContracts(prev => 
        prev.map(contract => 
          (contract.databaseId || contract.id) === contractId ? { ...contract, status } : contract
        )
      );
      
      console.log(`Contract ${contractId} status updated to ${status}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update contract status';
      setError(errorMessage);
      console.error('Status update error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Generate unique contract ID following business format
   * Format: L{8-digit-timestamp}.{3-digit-random}.00
   * Example: L50302048.123.00
   * @returns Formatted contract ID string
   */
  const generateContractId = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `L${timestamp}.${random}.00`;
  };

  return {
    contracts,
    loading,
    error,
    addContract,
    updateContract,
    deleteContract,
    generateContractId,
    refreshContracts,
    updateStatus
  };
};

export default useContracts;