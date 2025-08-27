import React from "react";
import Button from "../../../shared/components/UI/Button";

const UserManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button variant="primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New User
        </Button>
      </div>

      {/* User Cards */}
      <div className="space-y-6">
        {/* Sample user card */}
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  John Doe - General Manager
                </h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="bg-blue-500 text-white p-2 rounded shadow hover:bg-blue-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="bg-red-600 text-white p-2 rounded shadow hover:bg-red-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 px-6 py-4">
            <div className="text-gray-800 text-sm">
              <div className="mb-2">Email: john.doe@example.com</div>
              <div className="mb-2">Role: General Manager</div>
              <div className="mb-2">Last Login: 2 hours ago</div>
              <div>Permissions: Full Access</div>
            </div>
          </div>
        </div>

        {/* Another sample user */}
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Saidy - Supplier
                </h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="bg-blue-500 text-white p-2 rounded shadow hover:bg-blue-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="bg-red-600 text-white p-2 rounded shadow hover:bg-red-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 px-6 py-4">
            <div className="text-gray-800 text-sm">
              <div className="mb-2">Email: saidy@supplier.com</div>
              <div className="mb-2">Role: Supplier</div>
              <div className="mb-2">Last Login: 1 day ago</div>
              <div>Permissions: Contract Management</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;