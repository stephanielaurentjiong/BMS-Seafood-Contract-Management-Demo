import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GeneralManagerDashboard from "./pages/GeneralManagerDashboard";
import SupplierDashboard from "./pages/SupplierDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/general-manager-dashboard"
            element={<GeneralManagerDashboard />}
          />
          <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
