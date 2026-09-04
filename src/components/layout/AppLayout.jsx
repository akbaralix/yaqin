import React, { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import RightSidebar from "./RightSidebar";
import CreatePostModal from "../feed/CreatePostModal";
import MatchModal from "../dating/MatchModal";
import NotificationsModal from "../notifications/NotificationsModal";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { FaPlus, FaRegHeart } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import logoIcon from "/icon.png";

function AppLayout({ children }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { activeMatch, setActiveMatch } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const showRightSidebar =
    location.pathname === "/" || location.pathname === "/dating";

  return (
    <div className="app-layout">
      {/* Mobile Top Header */}
      <header className="mobile-top-header">
        <div className="mobile-brand">
          <img src={logoIcon} alt="" />
          <span>Yaqin</span>
        </div>
        <div className="mobile-header-actions">
          {/* Notification Button on Mobile Header */}
          <button
            className="mobile-notif-btn"
            onClick={() => setIsNotifOpen(true)}
            aria-label="Bildirishnomalar"
          >
            <FaRegHeart />
            {unreadCount > 0 && (
              <span className="mobile-notif-badge">{unreadCount}</span>
            )}
          </button>

          <button
            className="mobile-create-post-btn"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Yangi Post"
          >
            <FaPlus />
          </button>
        </div>
      </header>

      {/* Desktop Left Sidebar */}
      <Sidebar
        onOpenCreatePost={() => setIsCreateOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Main Content Area */}
      <main className="app-main-content">
        <div className="content-inner-wrapper">{children}</div>
      </main>

      {/* Desktop Right Sidebar */}
      {showRightSidebar && <RightSidebar onOpenNotifications={() => setIsNotifOpen(true)} />}

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onOpenCreatePost={() => setIsCreateOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Global Notifications Modal / Drawer */}
      <NotificationsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      {/* Global Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={() => {
          // Trigger page reload / state refresh if on feed
          if (location.pathname === "/") {
            window.location.reload();
          }
        }}
      />

      {/* Global Match Celebration Modal */}
      {activeMatch && (
        <MatchModal
          matchUser={activeMatch}
          onClose={() => setActiveMatch(null)}
        />
      )}
    </div>
  );
}

export default AppLayout;
