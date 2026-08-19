import React, { useState, useEffect } from "react";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileAnalytics from "../../components/profile/ProfileAnalytics";
import UserPostsGrid from "../../components/profile/UserPostsGrid";
import EditProfileModal from "../../components/profile/EditProfileModal";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

function ProfilePage({ onOpenCreatePost }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [userPosts, setUserPosts] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    async function loadMyPosts() {
      if (!user?.user_id) return;
      try {
        const res = await api.getPosts({ userId: user.user_id });
        if (res?.posts) {
          setUserPosts(res.posts);
        }
      } catch (err) {
        console.warn("Error loading user posts:", err);
      }
    }

    loadMyPosts();
  }, [user?.user_id]);

  return (
    <div className="profile-page-container">
      <ProfileHeader
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenEdit={() => setIsEditOpen(true)}
      />

      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === "posts" ? (
          <UserPostsGrid
            posts={userPosts}
            onOpenCreatePost={onOpenCreatePost}
          />
        ) : (
          <ProfileAnalytics />
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}

export default ProfilePage;
