import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(() => {
    const stored = localStorage.getItem("token");
    if (!stored) return false;
    try {
      const decoded = jwtDecode(stored);
      return Boolean(decoded.is_profile_complete || decoded.isProfileComplete);
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeMatch, setActiveMatch] = useState(null);

  // Sync token from localStorage or prop change or Telegram WebApp
  useEffect(() => {
    async function initAuth() {
      const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
      const tgUser = tg?.initDataUnsafe?.user;

      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const decoded = jwtDecode(storedToken);
          setToken(storedToken);
          const fromToken = Boolean(decoded.is_profile_complete || decoded.isProfileComplete);
          setIsProfileComplete(fromToken);

          // Fetch full user data from backend
          try {
            const data = await api.getCurrentUser();
            if (data?.user) {
              setUser(data.user);
              const fromUser = Boolean(
                data.user.is_profile_complete ||
                (data.user.gender && data.user.region && (data.user.birth_date || data.user.age) && (data.user.first_name || data.user.name))
              );
              setIsProfileComplete(fromToken || fromUser);
            }
          } catch (fetchErr) {
            console.warn("Could not fetch full user profile:", fetchErr.message);
            // Fallback to decoded token basic info
            setUser({
              user_id: decoded.user_id,
              first_name: decoded.first_name,
              is_profile_complete: fromToken,
            });
          }
        } catch (err) {
          console.error("Invalid stored token:", err);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          setIsProfileComplete(false);
        }
      } else if (tgUser && tgUser.id) {
        // Agar token yo'q bo'lsa, lekin foydalanuvchi Telegram WebApp orqali ochgan bo'lsa
        try {
          tg.ready();
          tg.expand?.();

          const data = await api.telegramWebAppAuth({
            id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            username: tgUser.username,
            photo_url: tgUser.photo_url,
          });

          if (data?.token) {
            localStorage.setItem("token", data.token);
            setToken(data.token);
            const isComplete = Boolean(
              data.is_profile_complete ||
              data.isProfileComplete ||
              data.user?.is_profile_complete ||
              (data.user?.gender &&
                data.user?.region &&
                (data.user?.birth_date || data.user?.age))
            );
            setIsProfileComplete(isComplete);
            setUser(data.user);
          }
        } catch (tgErr) {
          console.error("Telegram WebApp avto-login xatolik:", tgErr);
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
      const isComplete = Boolean(
        decoded.is_profile_complete ||
        decoded.isProfileComplete ||
        userData?.is_profile_complete ||
        (userData?.gender && userData?.region && (userData?.birth_date || userData?.age))
      );
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
