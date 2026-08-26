import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHeart,
  FaCompass,
  FaUser,
  FaPlusCircle,
  FaSignOutAlt,
  FaFire,
} from "react-icons/fa";
import { RiMessengerLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";

function Sidebar({ onOpenCreatePost }) {
  const { user, logout } = useAuth();

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-circle">
          <FaHeart className="brand-heart-icon" />
        </div>
        <div className="brand-texts">
          <span className="brand-title">Yaqin</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          end
        >
          <FaCompass className="nav-icon" />
          <span>Lenta (Home)</span>
        </NavLink>

        <NavLink
          to="/dating"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FaFire className="nav-icon fire-icon" />
          <span>Tanishuv (Swipe)</span>
        </NavLink>

        <NavLink
          to="/matches"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <RiMessengerLine className="nav-icon" />
          <span>Suhbatlar</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FaUser className="nav-icon" />
          <span>Mening Profilim</span>
        </NavLink>
      </nav>

      {/* Create Post Action */}
      <div className="sidebar-action-box">
        <button className="sidebar-create-btn" onClick={onOpenCreatePost}>
          <FaPlusCircle />
          <span>Yangi Post Yaratish</span>
        </button>
      </div>

      {/* Current User Card */}
      {user && (
        <div className="sidebar-user-card">
          <div className="sidebar-user-info">
            <img
              src={
                user.profile_pic ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={user.first_name || "User"}
              className="sidebar-user-avatar"
            />
            <div className="sidebar-user-text">
              <span className="sidebar-user-name">
                {user.first_name || "Foydalanuvchi"}
              </span>
              <span className="sidebar-user-region">
                📍 {user.region || "O'zbekiston"}
              </span>
            </div>
          </div>

          <button
            className="sidebar-logout-btn"
            onClick={logout}
            title="Chiqish"
          >
            <FaSignOutAlt />
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
