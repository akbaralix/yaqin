import React from "react";
import { NavLink } from "react-router-dom";
import { FaCompass, FaFire, FaPlus, FaUser } from "react-icons/fa";
import { RiMessengerLine } from "react-icons/ri";

function BottomNav({ onOpenCreatePost }) {
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

      <NavLink
        to="/matches"
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? "active" : ""}`
        }
      >
        <RiMessengerLine className="bottom-nav-icon" />
        <span>Suhbatlar</span>
      </NavLink>

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
