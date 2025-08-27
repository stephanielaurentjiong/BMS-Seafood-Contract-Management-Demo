/**
 * @fileoverview Shared Database Table Component  
 * 
 * Displays transferred contract data in tabular format for both GM and Admin dashboards.
 * Shows real contract data that has been transferred from closed contracts.
 * 
 * Features:
 * - Header with database action buttons (customizable per role)
 * - Real transferred contract data from API
 * - Dynamic pricing display with vertical stacked layout
 * - Delivery details (Bongkar, Size Range, Ton) properly separated
 * - Loading and error states
 * - Pagination support
 * - Role-based customization
 * 
 * Business Context:
 * - Shows finalized contract data that has been transferred to Database System
 * - Displays data in the format specified: ID, Date, Supplier, Bongkar, Size Range, Ton, etc.
 * - Supports data export and management operations
 * 
 */

import React, { useState, useEffect } from "react";
import Button from "../UI/Button";
import api from "../../../utils/api";

/**
 * Interface for transferred contract data from API
 */
interface TransferredContract {
  id: string;
  contract_id: string;
  supplier_name: string;
  bongkar: string[]; // Delivery dates
  size_ranges: string[]; // Size ranges  
  tons: number[]; // Delivery quantities
  dynamic_pricing: any; // Pricing structure
  size_penalties: any[]; // Size penalty rules
  transfer_date: string;
  status: string;
  transferred_by_name: string;
  index_value: number;
  notes: string;
}

/**
 * Interface for API response
 */
interface TransferredContractsResponse {
  transfers: TransferredContract[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Props for DatabaseTable component
 */
interface DatabaseTableProps {
  /**
   * Title to display in the header
   */
  title?: string;
  
  /**
   * Version indicator (e.g., "V1", "V2")
   */
  version?: string;
  
  /**
   * Whether to show action buttons in header
   */
  showActions?: boolean;
  
  /**
   * Custom action buttons to display
   */
  customActions?: React.ReactNode;
  
  /**
   * Additional CSS classes for styling
   */
  className?: string;
}

/**
 * DatabaseTable - Shared component for displaying transferred contract data
 * 
 * Fetches and displays real contract data that has been transferred from closed contracts.
 * Can be customized for different roles (GM, Admin) through props.
 * 
 * Features:
 * - Real-time data fetching from /api/contracts/transfers
 * - Proper error handling and loading states
 * - Displays data in required format (Bongkar, Size Range, Ton separated)
 * - Vertical pricing display with scrolling
 * - Pagination for large datasets
 * - Role-based customization through props
 * 
 * @param props - Component configuration props
 * @returns Database table interface with real transferred contract data
 */
const DatabaseTable: React.FC<DatabaseTableProps> = ({
  title = "Database System",
  version = "V2",
  showActions = true,
  customActions,
  className = ""
}) => {
  const [transfers, setTransfers] = useState<TransferredContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  /**
   * Fetch transferred contracts from API
   */
  const fetchTransferredContracts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Use the configured API client instead of fetch
      const response = await api.get(`/contracts/transfers?page=${page}&limit=20`);
      const data: TransferredContractsResponse = response.data;
      setTransfers(data.transfers);
      setPagination(data.pagination);

      console.log(`Loaded ${data.transfers.length} transferred contracts`);

    } catch (err: any) {
      console.error('Error fetching transferred contracts:', err);
      setError(err.message || 'Failed to load transferred contracts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchTransferredContracts();
  }, []);

  /**
   * Format dynamic pricing for vertical display
   * Converts pricing data to array of pricing entries for vertical stacking
   */
  const formatPricingEntries = (dynamicPricing: any): Array<{size: number, price: string}> => {
    if (!dynamicPricing || typeof dynamicPricing !== 'object') {
      return [];
    }

    let pricingArray: Array<{size: number, price: number}> = [];

    // If it's an array of pricing objects
    if (Array.isArray(dynamicPricing)) {
      pricingArray = dynamicPricing;
    }
    // If it's an object with pricing data
    else if (dynamicPricing.base_pricing && Array.isArray(dynamicPricing.base_pricing)) {
      pricingArray = dynamicPricing.base_pricing;
    }

    // Convert prices to k format and return formatted entries
    return pricingArray.map(p => ({
      size: p.size,
      price: formatPriceWithK(p.price)
    }));
  };

  /**
   * Convert price to k format (e.g., 88000 → 88k, 1500 → 1.5k)
   */
  const formatPriceWithK = (price: number): string => {
    if (price >= 1000) {
      const kValue = price / 1000;
      // Show decimal only if needed (e.g., 1.5k not 1.0k)
      return kValue % 1 === 0 ? `${kValue}k` : `${kValue.toFixed(1)}k`;
    }
    return `${price}`;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Default action buttons
  const defaultActions = (
    <>
      <Button variant="primary">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        New Database Entry
      </Button>
      <Button variant="primary" className="bg-green-600 hover:bg-green-700">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
        </svg>
        Import Excel
      </Button>
      <Button variant="secondary" className="bg-purple-600 hover:bg-purple-700">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
        </svg>
        Export
      </Button>
    </>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with action buttons */}
      {(showActions || customActions) && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {title} ({version})
          </h2>
          {showActions && (
            <div className="flex space-x-3">
              {customActions || defaultActions}
            </div>
          )}
        </div>
      )}

      {/* Status indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Showing transferred contracts from closed contracts. Total: {pagination.total} contracts.
            </p>
          </div>
        </div>
      </div>

      {/* Database Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bongkar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ton</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dynamic Pricing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Index</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-gray-500">Loading transferred contracts...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="text-red-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-medium">Failed to load transferred contracts</p>
                      <p className="text-sm text-gray-500 mt-1">{error}</p>
                      <button 
                        onClick={() => fetchTransferredContracts()}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>No transferred contracts yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Close contracts and transfer them to see data here.
                    </p>
                  </td>
                </tr>
              ) : (
                transfers.map((transfer, index) => (
                  <tr key={transfer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {transfer.contract_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transfer.transfer_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {transfer.supplier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {transfer.bongkar.map((date, idx) => (
                          <div key={idx} className="text-blue-600">{date}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {transfer.size_ranges.map((range, idx) => (
                          <div key={idx} className="text-green-600">{range}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {transfer.tons.map((ton, idx) => (
                          <div key={idx} className="text-purple-600 font-medium">{ton}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {formatPricingEntries(transfer.dynamic_pricing).length > 0 ? (
                          <div className="space-y-1">
                            {formatPricingEntries(transfer.dynamic_pricing).map((pricing, pIdx) => (
                              <div key={pIdx} className="text-blue-600 text-xs whitespace-nowrap">
                                {pricing.size}: {pricing.price}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-blue-600 text-xs">N/A</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transfer.index_value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transfer.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button className="text-green-600 hover:text-green-800" title="View Details">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="text-blue-600 hover:text-blue-800" title="Export">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transfers.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchTransferredContracts(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchTransferredContracts(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTable;