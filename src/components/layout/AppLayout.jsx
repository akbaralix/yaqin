import React, { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import RightSidebar from "./RightSidebar";
import CreatePostModal from "../feed/CreatePostModal";
import MatchModal from "../dating/MatchModal";
import { useAuth } from "../../context/AuthContext";
import { FaHeart, FaPlus } from "react-icons/fa";
import { useLocation } from "react-router-dom";

function AppLayout({ children }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { activeMatch, setActiveMatch } = useAuth();
  const location = useLocation();

  const showRightSidebar =
    location.pathname === "/" || location.pathname === "/dating";

  return (
    <div className="app-layout">
      {/* Mobile Top Header */}
      <header className="mobile-top-header">
        <div className="mobile-brand">
          <FaHeart className="mobile-brand-icon" />
          <span>Yaqin</span>
        </div>
        <button
          className="mobile-create-post-btn"
          onClick={() => setIsCreateOpen(true)}
        >
          <FaPlus />
        </button>
      </header>

      {/* Desktop Left Sidebar */}
      <Sidebar onOpenCreatePost={() => setIsCreateOpen(true)} />

      {/* Main Content Area */}
      <main className="app-main-content">
        <div className="content-inner-wrapper">{children}</div>
      </main>

      {/* Desktop Right Sidebar */}
      {showRightSidebar && <RightSidebar />}

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenCreatePost={() => setIsCreateOpen(true)} />

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
