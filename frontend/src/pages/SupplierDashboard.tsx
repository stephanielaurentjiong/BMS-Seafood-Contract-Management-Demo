import React from "react";
import { useAuth } from "../hooks/useAuth";

const SupplierDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🦐</span>
              <h1 className="text-2xl font-bold text-gray-900">
                Supplier Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}!
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pending Contracts */}
          <div className="bg-white shadow-lg rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                📋 Pending Contracts
              </h2>
              <p className="text-sm text-gray-500">
                Contracts waiting for your delivery details
              </p>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">📄</div>
                <p className="text-gray-500">
                  No pending contracts at the moment.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  New contracts from the General Manager will appear here.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">3</div>
                <div className="text-sm text-gray-500">
                  Completed This Month
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">92%</div>
                <div className="text-sm text-gray-500">
                  On-Time Delivery Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
