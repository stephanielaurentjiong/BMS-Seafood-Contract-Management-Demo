import React from "react";

interface DashboardHeaderProps {
  title: string;
  userName?: string;
  onLogout: () => void;
  icon?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  userName,
  onLogout,
  icon = "🦐"
}) => {
  return (
    <div className="bg-white shadow">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="py-6 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{icon}</span>
            <h1 className="text-2xl font-bold text-gray-900">
              {title}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {userName && (
              <span className="text-sm text-gray-600">
                Welcome, {userName}!
              </span>
            )}
            <button
              onClick={onLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;