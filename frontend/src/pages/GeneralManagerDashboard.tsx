import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

type TabType = "contract-collaboration" | "database-system";

const GeneralManagerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("contract-collaboration");

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const TabButton: React.FC<{
    tab: TabType;
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        isActive
          ? "text-blue-600 border-blue-600"
          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  const ContractCollaborationTab: React.FC = () => (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contract Collaboration (V2)</h2>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Collaborative Contract</span>
        </button>
      </div>

      {/* Contract Cards */}
      <div className="space-y-6">
        {/* Contract Card with Border */}
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Title Section - White Background */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  (New) L50302.048.00 SAIDY Open
                </h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                  </svg>
                  Supplier Filled
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button className="bg-yellow-500 text-white p-2 rounded shadow hover:bg-yellow-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="bg-red-600 text-white p-2 rounded shadow hover:bg-red-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Content Section - Light Grey Background */}
          <div className="bg-gray-100 px-6 py-4">
            <div className="text-gray-800 font-mono text-sm leading-relaxed text-left">
              <div className="mb-3">(New) L50302.048.00 SAIDY Open</div>
              <div className="mb-3">27 Mei 7mt,</div>
              <div className="mb-2">20/25/30/40@</div>
              <div className="mb-3">88/88/80/77,</div>
              <div>Sz 100-150 turun 200 Rp/sz</div>
            </div>
          </div>
        </div>

        {/* Additional contract cards can be added here with same structure */}
        {/* Example of second contract card */}
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Title Section - White Background */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  (Add) L50302.049.00 BUDI Pending
                </h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Pending Review
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button className="bg-yellow-500 text-white p-2 rounded shadow hover:bg-yellow-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="bg-red-600 text-white p-2 rounded shadow hover:bg-red-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Content Section - Light Grey Background */}
          <div className="bg-gray-100 px-6 py-4">
            <div className="text-gray-800 font-mono text-sm leading-relaxed text-left">
              <div className="mb-3">(Add) L50302.049.00 BUDI Pending</div>
              <div className="mb-3">28 Mei 5mt,</div>
              <div className="mb-2">15/20/25/30@</div>
              <div className="mb-3">90/85/82/78,</div>
              <div>Sz 80-120 turun 150 Rp/sz</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DatabaseSystemTab: React.FC = () => (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Database System (V1)</h2>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Database Entry</span>
          </button>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
            </svg>
            <span>Import Excel</span>
          </button>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
            </svg>
            <span>Export</span>
          </button>
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
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">L50302.048.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2025-05-23</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">SAIDY</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">30-May-25</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10 sd 40</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">11</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="space-y-1">
                    <div className="text-blue-600">20: $88</div>
                    <div className="text-blue-600">30: $80</div>
                    <div className="text-blue-600">40: $77</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">365</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">28-5</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-green-600 hover:text-green-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🦐</span>
              <h1 className="text-2xl font-bold text-gray-900">
                General Manager Dashboard
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

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <TabButton
              tab="database-system"
              icon="DB"
              label="Database System"
              isActive={activeTab === "database-system"}
              onClick={() => setActiveTab("database-system")}
            />
            <TabButton
              tab="contract-collaboration"
              icon="CC"
              label="Contract Collaboration"
              isActive={activeTab === "contract-collaboration"}
              onClick={() => setActiveTab("contract-collaboration")}
            />
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === "contract-collaboration" && <ContractCollaborationTab />}
          {activeTab === "database-system" && <DatabaseSystemTab />}
        </div>
      </div>
    </div>
  );
};

export default GeneralManagerDashboard;
