import React from "react";
import Button from "../../../shared/components/UI/Button";

const DatabaseManagement: React.FC = () => {
  return (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button variant="primary" className="flex flex-col items-center p-6 h-24">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7l2-2h12l2 2M4 7l8 5 8-5" />
            </svg>
            <span className="text-sm">Export Contracts</span>
          </Button>

          <Button variant="secondary" className="flex flex-col items-center p-6 h-24">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm">View Reports</span>
          </Button>

          <Button variant="outline" className="flex flex-col items-center p-6 h-24">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm">Backup Data</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagement;