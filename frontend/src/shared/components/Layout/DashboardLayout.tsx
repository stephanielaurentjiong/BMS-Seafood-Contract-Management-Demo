import React from "react";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  title: string;
  userName?: string;
  onLogout: () => void;
  children: React.ReactNode;
  icon?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  userName,
  onLogout,
  children,
  icon
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title={title}
        userName={userName}
        onLogout={onLogout}
        icon={icon}
      />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;