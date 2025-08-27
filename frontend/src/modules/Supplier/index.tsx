import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../shared/components/Layout/DashboardLayout";
import SupplierContractCard from "./components/SupplierContractCard";
import { Contract } from "../GeneralManager/types/contracts";
import { getContracts, transformApiDataToContract } from "../../utils/contractApi";

const SupplierDashboard: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  /**
   * Fetch contracts assigned to this supplier
   * Uses API with role-based filtering
   */
  const fetchSupplierContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getContracts();
      const transformedContracts = response.contracts.map(transformApiDataToContract);
      setContracts(transformedContracts);
      
      console.log(`Loaded ${transformedContracts.length} contracts for supplier ${user?.name}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load contracts';
      setError(errorMessage);
      console.error('Supplier contract fetch error:', errorMessage);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contracts on component mount
  useEffect(() => {
    if (isAuthenticated && user?.role === 'supplier') {
      fetchSupplierContracts();
    }
  }, [isAuthenticated, user?.role]);

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

  if (user.role !== 'supplier') {
    return <Navigate to="/login" replace />;
  }

  const handleViewDetails = (contract: Contract) => {
    console.log("View details for contract:", contract.id);
    // In real app: navigate to contract details page or open modal
  };

  const handleUpdateDelivery = (contract: Contract) => {
    console.log("Update delivery for contract:", contract.id);
    // In real app: open delivery form modal or navigate to delivery page
  };

  const handleChat = (contractId: string) => {
    console.log("Open chat for contract:", contractId);
    // In real app: open chat interface with GM
  };

  const handleCalculator = (contract: Contract) => {
    console.log("Open calculator for contract:", contract.id);
    // In real app: open pricing calculator modal/popup
  };

  const handleContractUpdate = (updatedContract: Contract) => {
    // Update the contract in the local state when deliveries are saved
    setContracts(prevContracts => 
      prevContracts.map(contract => {
        // Check both possible ID fields for a match
        const contractIdentifier = contract.databaseId || contract.id;
        const updatedIdentifier = updatedContract.databaseId || updatedContract.id;
        
        return contractIdentifier === updatedIdentifier ? updatedContract : contract;
      })
    );
    console.log(`Contract ${updatedContract.id} updated in supplier dashboard`);
  };

  return (
    <DashboardLayout
      title="Supplier Dashboard"
      userName={user?.name}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              📋 My Contracts
            </h2>
            <p className="text-sm text-gray-500">
              View and manage your assigned contracts
            </p>
          </div>
        </div>

        {/* Contract Cards */}
        {loading ? (
          <div className="bg-white shadow-lg rounded-lg">
            <div className="p-6">
              <div className="text-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Loading your contracts...</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white shadow-lg rounded-lg">
            <div className="p-6">
              <div className="text-center py-12 text-red-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">Failed to load contracts</p>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
                <button 
                  onClick={fetchSupplierContracts}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white shadow-lg rounded-lg">
            <div className="p-6">
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p>No contracts available</p>
                <p className="text-sm text-gray-400 mt-2">
                  New contracts from the General Manager will appear here.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {contracts.map((contract) => (
              <SupplierContractCard
                key={contract.id}
                contract={contract}
                onViewDetails={handleViewDetails}
                onUpdateDelivery={handleUpdateDelivery}
                onChat={handleChat}
                onCalculator={handleCalculator}
                onContractUpdate={handleContractUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SupplierDashboard;