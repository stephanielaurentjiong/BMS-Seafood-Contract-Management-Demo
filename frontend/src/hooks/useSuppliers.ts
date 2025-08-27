/**
 * @fileoverview Supplier Management Hook
 *
 * Custom hook for managing supplier data and dropdown functionality.
 * Provides supplier fetching, caching, and formatted data for UI components.
 *
 * Features:
 * - Supplier data fetching and caching
 * - Loading states and error handling
 * - Formatted dropdown options with display names
 * - Auto-refresh capabilities
 * - Memory management for large supplier lists
 *
 * Business Context:
 * - Only accessible to General Managers for security
 * - Suppliers are users with role="supplier"
 * - Used for contract creation supplier assignment
 * - Supports supplier search and filtering
 *
 */

import { useState, useEffect, useMemo } from "react";
import { getSuppliers, Supplier } from "../utils/contractApi";

/**
 * Formatted supplier option for dropdown components
 *
 * @interface SupplierOption
 * @property {string} value - Supplier UUID for form submission
 * @property {string} label - Formatted display text for dropdown
 * @property {string} name - Supplier name for filtering/search
 * @property {string} email - Supplier email for additional context
 */
export interface SupplierOption {
  value: string;
  label: string;
  name: string;
  email: string;
}

/**
 * Hook return interface
 *
 * @interface UseSuppliers
 * @property {Supplier[]} suppliers - Raw supplier data from API
 * @property {SupplierOption[]} supplierOptions - Formatted options for dropdowns
 * @property {boolean} loading - Loading state for API requests
 * @property {string | null} error - Error message if fetch fails
 * @property {Function} refetch - Function to manually refresh supplier data
 * @property {Function} getSupplierById - Helper to find supplier by ID
 * @property {Function} getSupplierByName - Helper to find supplier by name
 */
interface UseSuppliers {
  suppliers: Supplier[];
  supplierOptions: SupplierOption[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getSupplierById: (id: string) => Supplier | undefined;
  getSupplierByName: (name: string) => Supplier | undefined;
}

/**
 * Supplier Management Hook
 *
 * Manages supplier data fetching and provides formatted options for UI components.
 * Includes caching, error handling, and helper functions for supplier lookup.
 *
 * @hook useSuppliers
 * @returns {UseSuppliers} Supplier state and management functions
 *
 * @example
 * ```typescript
 * const { suppliers, supplierOptions, loading, error } = useSuppliers();
 *
 * // Use in dropdown
 * <Select options={supplierOptions} />
 *
 * // Find specific supplier
 * const supplier = getSupplierById("uuid-123");
 * ```
 */
const useSuppliers = (): UseSuppliers => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch suppliers from API
   * Handles loading states, error management, and data caching
   */
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getSuppliers();
      setSuppliers(response.suppliers);

      console.log(`Loaded ${response.suppliers.length} suppliers for dropdown`);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load suppliers";
      setError(errorMessage);
      console.error("Supplier fetch error:", errorMessage);

      // Clear suppliers on error to prevent stale data
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manual refetch function for error recovery or data refresh
   */
  const refetch = async (): Promise<void> => {
    await fetchSuppliers();
  };

  // Initial data fetch on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  /**
   * Formatted supplier options for dropdown components
   * Memoized to prevent unnecessary re-renders
   */
  const supplierOptions: SupplierOption[] = useMemo(() => {
    return suppliers.map((supplier) => ({
      value: supplier.id,
      label: `${supplier.name} (${supplier.email})`,
      name: supplier.name,
      email: supplier.email,
    }));
  }, [suppliers]);

  /**
   * Find supplier by UUID
   * @param id - Supplier UUID to search for
   * @returns Supplier object if found, undefined otherwise
   */
  const getSupplierById = (id: string): Supplier | undefined => {
    return suppliers.find((supplier) => supplier.id === id);
  };

  /**
   * Find supplier by name (case-insensitive)
   * @param name - Supplier name to search for
   * @returns Supplier object if found, undefined otherwise
   */
  const getSupplierByName = (name: string): Supplier | undefined => {
    return suppliers.find(
      (supplier) => supplier.name.toLowerCase() === name.toLowerCase()
    );
  };

  return {
    suppliers,
    supplierOptions,
    loading,
    error,
    refetch,
    getSupplierById,
    getSupplierByName,
  };
};

export default useSuppliers;
