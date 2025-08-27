/**
 * Purpose: Manages authentication state across your entire app
  (like a Python session manager).
 */
import { useState, useEffect } from "react";
import { User } from "../types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Runs code when component mounts
  useEffect(() => {
    // Check localStorage on app startup
    // Check if user is logged in on app start
    const token = localStorage.getItem("token");  //JWT
    const userData = localStorage.getItem("user"); //JSON string for "user" object



    // Check if the user was loggedn in previously
    // If token exists, restore user session
    // If invalid data, clear everything
    if (token && userData) {
      try {
        // Parses and restores the session
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []); // Empty array means "run once on startup"

  const login = (userData: User, token: string) => {
    // Save token and user data to localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    // Update state to show user as authenticated
    setIsAuthenticated(true);
  };

  /**
   * Clear localStorage. Reset state to unauthenticated
   */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
