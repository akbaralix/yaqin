import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeMatch, setActiveMatch] = useState(null);

  // Sync token from localStorage or prop change
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const decoded = jwtDecode(storedToken);
          setToken(storedToken);
          setIsProfileComplete(Boolean(decoded.is_profile_complete));

          // Fetch full user data from backend
          try {
            const data = await api.getCurrentUser();
            if (data?.user) {
              setUser(data.user);
              setIsProfileComplete(Boolean(data.user.is_profile_complete));
            }
          } catch (fetchErr) {
            console.warn("Could not fetch full user profile:", fetchErr.message);
            // Fallback to decoded token basic info
            setUser({
              user_id: decoded.user_id,
              first_name: decoded.first_name,
              is_profile_complete: Boolean(decoded.is_profile_complete),
            });
          }
        } catch (err) {
          console.error("Invalid stored token:", err);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          setIsProfileComplete(false);
        }
      } else {
        setToken(null);
        setUser(null);
        setIsProfileComplete(false);
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const loginWithToken = (newToken, userData = null) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    try {
      const decoded = jwtDecode(newToken);
      const isComplete = Boolean(decoded.is_profile_complete || userData?.is_profile_complete);
      setIsProfileComplete(isComplete);
      setUser(userData || decoded);
    } catch (e) {
      console.error("Failed to decode token on login:", e);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsProfileComplete(false);
    window.location.href = "/login";
  };

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      if (res?.user) {
        setUser(res.user);
        setIsProfileComplete(Boolean(res.user.is_profile_complete));
      }
    } catch (e) {
      console.error("Failed to refresh user profile:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        setUser,
        isProfileComplete,
        loading,
        loginWithToken,
        logout,
        refreshUser,
        activeMatch,
        setActiveMatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
