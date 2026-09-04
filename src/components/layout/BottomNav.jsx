import React from "react";
import { NavLink } from "react-router-dom";
import { FaCompass, FaFire, FaPlus, FaUser, FaRegHeart } from "react-icons/fa";
import { RiMessengerLine } from "react-icons/ri";
import { useNotifications } from "../../context/NotificationContext";

function BottomNav({ onOpenCreatePost, onOpenNotifications }) {
  const { unreadCount } = useNotifications();

  return (
    <div className="app-bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? "active" : ""}`
        }
        end
      >
        <FaCompass className="bottom-nav-icon" />
        <span>Lenta</span>
      </NavLink>

      <NavLink
        to="/dating"
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? "active" : ""}`
        }
      >
        <FaFire className="bottom-nav-icon fire" />
        <span>Tanishuv</span>
      </NavLink>

      <button
        className="bottom-nav-create-btn"
        onClick={onOpenCreatePost}
        aria-label="Yangi Post"
      >
        <FaPlus />
      </button>

      {/* Mobile Notifications Tab Button */}
      <button
        type="button"
        className="bottom-nav-item bottom-notif-btn"
        onClick={onOpenNotifications}
      >
        <div className="bottom-nav-icon-wrapper">
          <FaRegHeart className="bottom-nav-icon" />
          {unreadCount > 0 && (
            <span className="bottom-notif-badge">{unreadCount}</span>
          )}
        </div>
        <span>Xabarlar</span>
      </button>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? "active" : ""}`
        }
      >
        <FaUser className="bottom-nav-icon" />
        <span>Profil</span>
      </NavLink>
    </div>
  );
}

export default BottomNav;
