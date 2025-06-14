import React from "react";
import { useAuth } from "../hooks/useAuth";

const AdminDashboard: React.FC = () => {
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
                Administrator Dashboard
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
          {/* Database Management */}
          <div className="bg-white shadow-lg rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                🗄️ Database Management
              </h2>
              <p className="text-sm text-gray-500">
                Manage contract database and export data
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  View All Contracts
                </button>
                <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors">
                  Export to Excel
                </button>
                <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                  Generate Reports
                </button>
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">248</div>
                <div className="text-sm text-gray-500">Total Contracts</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">15</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">1.2TB</div>
                <div className="text-sm text-gray-500">Database Size</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">99.8%</div>
                <div className="text-sm text-gray-500">System Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
