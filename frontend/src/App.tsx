/**
 * This is the main component that sets up routing for
  your entire application (like Python's main() function).
  *
  *
 */

import React from "react";

/**
 * 1. BrowserRouter (Router): Enables client-side routing
  (navigating between pages without page refreshes)
  2. Routes & Route: Define which component shows for each URL
  path
  3. Navigate: Redirects users (like Python's redirect())
 */
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GeneralManagerDashboard from "./modules/GeneralManager";
import SupplierDashboard from "./modules/Supplier";
import AdminDashboard from "./modules/Admin";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Shows login component at /login */}
          <Route path="/login" element={<Login />} /> 
          <Route path="/register" element={<Register />} />
          <Route
            path="/general-manager-dashboard"
            element={<GeneralManagerDashboard />}
          />
          <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          {/* Default: redirect to login page */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
