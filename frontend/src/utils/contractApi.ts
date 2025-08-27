/**
 * @fileoverview Contract API Client
 * 
 * API client functions for contract management with supplier ID-based relationships.
 * Handles contract CRUD operations, supplier management, and proper data transformation
 * between frontend and backend formats.
 * 
 * Features:
 * - Contract creation with supplier_id relationships
 * - Supplier dropdown data fetching
 * - Role-based contract filtering
 * - Data format transformation and validation
 * - Comprehensive error handling
 * 
 * Backend Integration:
 * - Uses new supplier_id structure for reliable supplier assignment
 * - Maintains backward compatibility with name-based contracts
 * - Supports customizable display names for contracts
 * 
 */

import api from './api';
import { Contract } from '../modules/GeneralManager/types/contracts';

/**
 * Supplier interface for dropdown selections
 * 
 * @interface Supplier
 * @property {string} id - Unique supplier UUID from users table
 * @property {string} name - Supplier display name
 * @property {string} email - Supplier email address
 * @property {string} created_at - Account creation timestamp
 */
export interface Supplier {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

/**
 * API response format for supplier list
 * 
 * @interface SuppliersResponse
 * @property {string} message - Success message
 * @property {Supplier[]} suppliers - Array of available suppliers
 * @property {number} count - Total supplier count
 */
export interface SuppliersResponse {
  message: string;
  suppliers: Supplier[];
  count: number;
}

/**
 * Raw API contract data from backend (snake_case)
 * 
 * @interface ApiContractData
 * @property {string} id - Database UUID
 * @property {string} unique_id - Business contract ID
 * @property {string} contract_type - Contract type
 * @property {string} supplier_id - Supplier UUID
 * @property {string} supplier_name - Display name
 * @property {string} status - Contract status
 * @property {Array} base_pricing - Pricing data
 * @property {Array} size_penalties - Penalty data
 * @property {Array} deliveries - Delivery data
 * @property {string} created_at - Creation timestamp
 */
export interface ApiContractData {
  id: string;
  unique_id: string;
  contract_type: string;
  supplier_id?: string;
  supplier_name: string;
  status: string;
  base_pricing: any[];
  size_penalties?: any[];
  deliveries?: any[];
  created_at: string;
}

/**
 * API response format for contract operations
 * 
 * @interface ContractResponse
 * @property {string} message - Success/error message
 * @property {ApiContractData} contract - Raw contract data from backend
 */
export interface ContractResponse {
  message: string;
  contract: ApiContractData;
}

/**
 * API response format for contract list
 * 
 * @interface ContractsResponse
 * @property {string} message - Success message
 * @property {ApiContractData[]} contracts - Array of raw contract data from backend
 * @property {number} count - Total contract count
 * @property {string} user_role - Current user's role
 */
export interface ContractsResponse {
  message: string;
  contracts: ApiContractData[];
  count: number;
  user_role: string;
}

/**
 * Contract creation data for API submission
 * 
 * @interface CreateContractData
 * @property {string} contract_type - Contract type (New, Add, Change)
 * @property {string} supplier_id - UUID of selected supplier
 * @property {string} supplier_name - Display name for contract (optional)
 * @property {Array} base_pricing - Pricing entries with numeric values
 * @property {Array} size_penalties - Penalty rules (optional)
 */
export interface CreateContractData {
  contract_type: string;
  supplier_id: string;
  supplier_name?: string;
  base_pricing: Array<{ size: number; price: number }>;
  size_penalties?: Array<{ range: string; penalty_amount: number; unit: string }>;
}

/**
 * Get all suppliers for dropdown selection (General Manager only)
 * 
 * Fetches list of all users with role="supplier" for use in contract creation forms.
 * Only accessible to general managers for security.
 * 
 * @returns {Promise<SuppliersResponse>} List of suppliers with ID, name, email
 * @throws {Error} If user lacks permissions or network error
 * 
 * @example
 * ```typescript
 * const suppliers = await getSuppliers();
 * // suppliers.suppliers = [
 * //   { id: "uuid-123", name: "SAIDY", email: "saidy@seafood.com" },
 * //   { id: "uuid-456", name: "PT. MINA JAYA", email: "mina@seafood.com" }
 * // ]
 * ```
 */
export const getSuppliers = async (): Promise<SuppliersResponse> => {
  try {
    const response = await api.get<SuppliersResponse>('/contracts/suppliers');
    return response.data;
  } catch (error: any) {
    console.error('Get suppliers error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch suppliers'
    );
  }
};

/**
 * Create a new contract with supplier ID relationship
 * 
 * Submits contract creation request with proper supplier_id linkage.
 * Transforms frontend form data to backend expected format.
 * 
 * @param {CreateContractData} contractData - Contract data for creation
 * @returns {Promise<ContractResponse>} Created contract with assigned ID
 * @throws {Error} If validation fails or creation error
 * 
 * @example
 * ```typescript
 * const contractData = {
 *   contract_type: "New",
 *   supplier_id: "uuid-123-abc",
 *   supplier_name: "SAIDY - Jakarta Branch",
 *   base_pricing: [
 *     { size: 20, price: 88 },
 *     { size: 30, price: 80 }
 *   ]
 * };
 * const result = await createContract(contractData);
 * ```
 */
export const createContract = async (
  contractData: CreateContractData
): Promise<ContractResponse> => {
  try {
    const response = await api.post<ContractResponse>('/contracts', contractData);
    return response.data;
  } catch (error: any) {
    console.error('Create contract error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to create contract'
    );
  }
};

/**
 * Get contracts filtered by user role
 * 
 * Fetches contracts based on current user's role:
 * - GM: Contracts they created
 * - Supplier: Contracts assigned to them (via supplier_id)
 * - Admin: All contracts with additional metadata
 * 
 * @returns {Promise<ContractsResponse>} Role-filtered contract list
 * @throws {Error} If fetch fails or authorization error
 * 
 * @example
 * ```typescript
 * const contracts = await getContracts();
 * // For supplier: only contracts where supplier_id matches user ID
 * // For GM: only contracts they created
 * ```
 */
export const getContracts = async (): Promise<ContractsResponse> => {
  try {
    const response = await api.get<ContractsResponse>('/contracts');
    return response.data;
  } catch (error: any) {
    console.error('Get contracts error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch contracts'
    );
  }
};

/**
 * Get single contract by ID with access control
 * 
 * Fetches detailed contract information with role-based access:
 * - GM: Can view their own contracts
 * - Supplier: Can view contracts assigned to them
 * - Admin: Can view all contracts
 * 
 * @param {string} contractId - UUID of contract to fetch
 * @returns {Promise<ContractResponse>} Contract details with access validation
 * @throws {Error} If contract not found or access denied
 * 
 * @example
 * ```typescript
 * const contract = await getContractById("uuid-123-abc");
 * // Returns full contract details if user has access
 * ```
 */
export const getContractById = async (
  contractId: string
): Promise<ContractResponse> => {
  try {
    const response = await api.get<ContractResponse>(`/contracts/${contractId}`);
    return response.data;
  } catch (error: any) {
    console.error('Get contract error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch contract'
    );
  }
};

/**
 * Update contract status (General Manager only)
 * 
 * Updates contract status (Open/Closed) with proper authorization.
 * Only the GM who created the contract can change its status.
 * 
 * @param {string} contractId - UUID of contract to update
 * @param {string} status - New status (Open or Closed)
 * @returns {Promise<ContractResponse>} Updated contract data
 * @throws {Error} If unauthorized or update fails
 * 
 * @example
 * ```typescript
 * await updateContractStatus("uuid-123-abc", "Closed");
 * // Contract status updated to Closed
 * ```
 */
export const updateContractStatus = async (
  contractId: string,
  status: string
): Promise<ContractResponse> => {
  try {
    const response = await api.put<ContractResponse>(`/contracts/${contractId}/status`, {
      status,
    });
    return response.data;
  } catch (error: any) {
    console.error('Update contract status error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to update contract status'
    );
  }
};

/**
 * Update contract data interface for API calls
 * 
 * @interface UpdateContractData
 * @property {string} contract_type - Contract type (New, Add, Change)
 * @property {string} supplier_id - UUID of selected supplier
 * @property {string} supplier_name - Display name for contract (optional)
 * @property {Array} base_pricing - Pricing entries with numeric values
 * @property {Array} size_penalties - Penalty rules (optional)
 */
export interface UpdateContractData {
  contract_type?: string;
  supplier_id?: string;
  supplier_name?: string;
  base_pricing?: Array<{ size: number; price: number }>;
  size_penalties?: Array<{ range: string; penalty_amount: number; unit: string }>;
}

/**
 * Update contract (General Manager only)
 * 
 * Updates contract details including pricing, penalties, supplier assignment.
 * Only the GM who created the contract can update it.
 * Changes are persisted to database and reflected across all dashboards.
 * 
 * @param {string} contractId - UUID of contract to update
 * @param {UpdateContractData} updateData - Contract data to update
 * @returns {Promise<ContractResponse>} Updated contract data
 * @throws {Error} If unauthorized, validation fails, or update error
 * 
 * @example
 * ```typescript
 * const updateData = {
 *   contract_type: "Change",
 *   base_pricing: [
 *     { size: 20, price: 90 },
 *     { size: 30, price: 85 }
 *   ],
 *   size_penalties: [
 *     { range: "101-150", penalty_amount: 200, unit: "Rp/s" }
 *   ]
 * };
 * const result = await updateContract("uuid-123-abc", updateData);
 * // Contract updated and persisted to database
 * ```
 */
export const updateContract = async (
  contractId: string,
  updateData: UpdateContractData
): Promise<ContractResponse> => {
  try {
    const response = await api.put<ContractResponse>(`/contracts/${contractId}`, updateData);
    return response.data;
  } catch (error: any) {
    console.error('Update contract error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to update contract'
    );
  }
};

/**
 * Transform frontend contract form data to API format
 * 
 * Converts form data with string values to proper backend format with
 * numeric values and correct structure.
 * 
 * @param {any} formData - Form data from useContractForm
 * @param {string} supplierId - Selected supplier UUID
 * @returns {CreateContractData} API-ready contract data
 * 
 * @example
 * ```typescript
 * const apiData = transformFormDataToApi(formData, "uuid-123");
 * // Converts string prices to numbers, filters empty entries
 * ```
 */
export const transformFormDataToApi = (
  formData: any,
  supplierId: string
): CreateContractData => {
  return {
    contract_type: formData.type,
    supplier_id: supplierId,
    supplier_name: formData.supplierName || undefined,
    base_pricing: formData.basePricing
      .filter((bp: any) => bp.size && bp.price)
      .map((bp: any) => ({
        size: parseFloat(bp.size),
        price: parseFloat(bp.price),
      })),
    size_penalties: formData.sizePenalties
      .filter((sp: any) => sp.sizeRange && sp.penaltyAmount)
      .map((sp: any) => ({
        range: sp.sizeRange,
        penalty_amount: parseFloat(sp.penaltyAmount),
        unit: sp.unit,
      })),
  };
};

/**
 * Delete contract (General Manager only)
 * 
 * Permanently deletes a contract from the database with proper authorization.
 * Only the GM who created the contract can delete it.
 * Automatically invalidates caches and removes from supplier dashboards.
 * 
 * @param {string} contractId - UUID of contract to delete
 * @returns {Promise<{message: string, deleted_contract: any}>} Deletion confirmation
 * @throws {Error} If unauthorized, contract not found, or deletion fails
 * 
 * @example
 * ```typescript
 * await deleteContract("uuid-123-abc");
 * // Contract permanently removed from database and supplier dashboards
 * ```
 */
export const deleteContract = async (
  contractId: string
): Promise<{message: string, deleted_contract: any}> => {
  try {
    const response = await api.delete(`/contracts/${contractId}`);
    return response.data;
  } catch (error: any) {
    console.error('Delete contract error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to delete contract'
    );
  }
};

/**
 * Delivery data structure for API submission
 * 
 * @interface DeliveryData
 * @property {string} date - Human readable delivery date (e.g., "27 Mei")
 * @property {number} quantity - Delivery quantity (positive number)
 * @property {string} unit - Quantity unit (mt, kg, ton)
 * @property {string} sizeRange - Shrimp size range (e.g., "20-25")
 */
export interface DeliveryData {
  date: string;
  quantity: number;
  unit: string;
  sizeRange: string;
}

/**
 * Update contract deliveries (Supplier only)
 * 
 * Updates delivery schedules for a contract that is assigned to the supplier.
 * Only the assigned supplier can update delivery details.
 * Validates delivery data and updates the contract with new schedule.
 * 
 * @param {string} contractId - UUID of contract to update
 * @param {DeliveryData[]} deliveries - Array of delivery schedules
 * @returns {Promise<ContractResponse>} Updated contract with new deliveries
 * @throws {Error} If unauthorized, validation fails, or update error
 * 
 * @example
 * ```typescript
 * const deliveries = [
 *   { date: "27 Mei", quantity: 7, unit: "mt", sizeRange: "20-25" },
 *   { date: "30 Mei", quantity: 5, unit: "mt", sizeRange: "26-30" }
 * ];
 * const result = await updateContractDeliveries("uuid-123-abc", deliveries);
 * // Contract delivery schedule updated and supplier_filled set to true
 * ```
 */
export const updateContractDeliveries = async (
  contractId: string,
  deliveries: DeliveryData[],
  contractType?: string | null,
  changeDetails?: string
): Promise<ContractResponse> => {
  try {
    const requestBody: any = { deliveries };
    
    // Include contract type and change details if provided
    if (contractType) {
      requestBody.contractType = contractType;
      requestBody.changeDetails = changeDetails;
    }
    
    console.log(`API call: updateContractDeliveries for ${contractId}`, {
      deliveryCount: deliveries.length,
      contractType,
      changeDetails
    });
    
    const response = await api.put<ContractResponse>(
      `/contracts/${contractId}/deliveries`,
      requestBody
    );
    return response.data;
  } catch (error: any) {
    console.error('Update contract deliveries error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to update contract deliveries'
    );
  }
};

/**
 * Transform API contract data to frontend format
 * 
 * Converts backend contract data to frontend Contract interface format.
 * Handles data type conversions and structure mapping.
 * 
 * @param {ApiContractData} apiContract - Contract data from API response
 * @returns {Contract} Frontend-compatible contract object
 * 
 * @example
 * ```typescript
 * const frontendContract = transformApiDataToContract(apiResponse.contract);
 * // Converts API format to frontend Contract interface
 * ```
 */
export const transformApiDataToContract = (apiContract: ApiContractData): Contract => {
  return {
    id: apiContract.unique_id || apiContract.id,
    databaseId: apiContract.id, // Always use the database UUID for API operations
    type: apiContract.contract_type,
    supplierId: apiContract.supplier_id,
    supplierName: apiContract.supplier_name,
    status: apiContract.status,
    basePricing: (apiContract.base_pricing || []).map((bp: any) => ({
      size: bp.size?.toString() || '0',
      price: bp.price || 0,
    })),
    sizePenalties: (apiContract.size_penalties || []).map((sp: any) => ({
      sizeRange: sp.range || sp.sizeRange || '',
      penaltyAmount: sp.penalty_amount || sp.penaltyAmount || 0,
      unit: sp.unit || '',
    })),
    deliveryDetails: (apiContract.deliveries || []).map((dd: any) => ({
      date: dd.date || '',
      quantity: dd.quantity || 0,
      unit: dd.unit || '',
      sizeRange: dd.sizeRange || '',
    })),
    createdAt: new Date(apiContract.created_at),
  };
};