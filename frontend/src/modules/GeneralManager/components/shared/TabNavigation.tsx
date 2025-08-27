/**
 * @fileoverview Tab Navigation Component
 * 
 * Provides tab-based navigation for the General Manager Dashboard.
 * Switches between Contract Collaboration and Database System views.
 * 
 */

import React from "react";
import { TabType } from "../../types/contracts";

/**
 * Props for individual tab button component
 * 
 * @interface TabButtonProps
 * @property {TabType} tab - Tab identifier
 * @property {string} icon - Icon text to display
 * @property {string} label - Tab label text
 * @property {boolean} isActive - Whether this tab is currently active
 * @property {Function} onClick - Callback when tab is clicked
 */
interface TabButtonProps {
  tab: TabType;
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * TabButton - Individual clickable tab with icon and label
 * 
 * @param props - Tab button props
 * @returns Styled tab button with active/inactive states
 */
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

/**
 * Props for TabNavigation component
 * 
 * @interface TabNavigationProps
 * @property {TabType} activeTab - Currently active tab
 * @property {Function} onTabChange - Callback when tab selection changes
 */
interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

/**
 * TabNavigation - Main tab navigation component
 * 
 * Features:
 * - Database System tab for contract table view
 * - Contract Collaboration tab for contract cards view
 * - Active state styling with blue accent
 * - Responsive design with proper spacing
 * 
 * @param props - Navigation props
 * @returns Tab navigation bar with two tabs
 */
const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
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
            tab="contract-collaboration"
            icon="CC"
            label="Contract Collaboration"
            isActive={activeTab === "contract-collaboration"}
            onClick={() => onTabChange("contract-collaboration")}
          />
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;