import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../shared/components/Layout/DashboardLayout";
import AdminTabNavigation from "./components/shared/AdminTabNavigation";
import AdminDatabaseTable from "./components/DatabaseSystem/AdminDatabaseTable";
import UserManagement from "./components/UserManagement";
import SystemSettings from "./components/SystemSettings";
import { AdminTabType } from "./types/admin";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTabType>("database-system");

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <DashboardLayout
      title="Administrator Dashboard"
      userName={user?.name}
      onLogout={handleLogout}
    >
      <div className="space-y-0 -mt-8">
        <AdminTabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="py-8">
          {activeTab === "database-system" && <AdminDatabaseTable />}
          {activeTab === "user-management" && <UserManagement />}
          {activeTab === "system-settings" && <SystemSettings />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;