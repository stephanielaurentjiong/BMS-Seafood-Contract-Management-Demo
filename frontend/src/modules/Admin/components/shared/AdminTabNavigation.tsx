import React from "react";
import { AdminTabType } from "../../types/admin";

interface TabButtonProps {
  tab: AdminTabType;
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, isActive, onClick }) => (
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

interface AdminTabNavigationProps {
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
}

const AdminTabNavigation: React.FC<AdminTabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          <TabButton
            tab="database-system"
            icon="DB"
            label="Database System"
            isActive={activeTab === "database-system"}
            onClick={() => onTabChange("database-system")}
          />
          <TabButton
            tab="user-management"
            icon="👥"
            label="User Management"
            isActive={activeTab === "user-management"}
            onClick={() => onTabChange("user-management")}
          />
          <TabButton
            tab="system-settings"
            icon="⚙️"
            label="System Settings"
            isActive={activeTab === "system-settings"}
            onClick={() => onTabChange("system-settings")}
          />
        </nav>
      </div>
    </div>
  );
};

export default AdminTabNavigation;