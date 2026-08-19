import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/login/login.jsx";
import CompleteProfile from "./pages/login/completeProfile.jsx";
import HomePage from "./pages/home/HomePage.jsx";
import DatingPage from "./pages/dating/DatingPage.jsx";
import MatchesPage from "./pages/matches/MatchesPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { token, isProfileComplete, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loader-screen">
        <div className="loader-pulse"></div>
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isProfileComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

// Complete Profile Route Guard
function CompleteProfileGuard() {
  const { token, isProfileComplete, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loader-screen">
        <div className="loader-pulse"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isProfileComplete) {
    return <Navigate to="/" replace />;
  }

  return <CompleteProfile />;
}

function App() {
  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            background: "#1e1b4b",
            color: "#fff",
            fontSize: "14px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          },
        }}
      />

      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/complete-profile" element={<CompleteProfileGuard />} />

        {/* Main Application Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dating"
          element={
            <ProtectedRoute>
              <DatingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <MatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
