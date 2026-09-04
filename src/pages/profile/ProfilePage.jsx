import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileAnalytics from "../../components/profile/ProfileAnalytics";
import UserPostsGrid from "../../components/profile/UserPostsGrid";
import EditProfileModal from "../../components/profile/EditProfileModal";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import toast from "react-hot-toast";

function ProfilePage({ onOpenCreatePost }) {
  const { username: paramUsername } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("posts");
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Bu o'zining profilimi yoki boshqa usernikimi?
  const isOwnProfile =
    !paramUsername ||
    (currentUser &&
      (String(paramUsername).toLowerCase() === String(currentUser.username).toLowerCase() ||
       String(paramUsername) === String(currentUser.user_id)));

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      // 1. Agar o'zining profili bo'lsa
      if (isOwnProfile) {
        if (!currentUser?.user_id) {
          setLoading(false);
          return;
        }

        try {
          // Eng yangi ma'lumotlarni backenddan olish
          const res = await api.getUserProfile(currentUser.user_id);
          if (res?.user) {
            setTargetUser(res.user);
            setUserPosts(res.posts || []);
          } else {
            setTargetUser(currentUser);
            const postsRes = await api.getPosts({ userId: currentUser.user_id });
            setUserPosts(postsRes?.posts || []);
          }
        } catch (err) {
          console.warn("My profile load err:", err);
          setTargetUser(currentUser);
        } finally {
          setLoading(false);
        }
        return;
      }

      // 2. Boshqa userning profili bo'lsa (/akbarali yoki /123456)
      try {
        const res = await api.getUserProfile(paramUsername);
        if (res?.user) {
          setTargetUser(res.user);
          setUserPosts(res.posts || []);
          setIsFollowing(Boolean(res.isFollowing));
        } else {
          setError("Foydalanuvchi topilmadi");
        }
      } catch (err) {
        console.error("User profile load error:", err);
        setError("Foydalanuvchi profili mavjud emas yoki xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [paramUsername, currentUser?.user_id, isOwnProfile]);

  const handleToggleFollow = async () => {
    if (!targetUser) return;
    try {
      const res = await api.toggleFollow(targetUser.user_id || targetUser.username);
      if (res?.success) {
        setIsFollowing(res.isFollowing);
        setTargetUser((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            followersCount: res.followersCount,
            followingCount: res.followingCount,
          },
        }));

        if (res.isFollowing) {
          toast.success(`@${targetUser.username || targetUser.first_name} ga obuna bo'ldingiz! 🎉`);
        } else {
          toast(`Obuna bekor qilindi`, { icon: "ℹ️" });
        }
      }
    } catch (err) {
      console.error("Toggle follow error:", err);
      toast.error(err.message || "Obunani o'zgartirishda xatolik");
    }
  };

  if (loading) {
    return (
      <div className="profile-page-container">
        <div className="app-loader-screen" style={{ minHeight: "350px" }}>
          <div className="loader-pulse"></div>
          <p>Profil yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="profile-page-container">
        <div className="profile-not-found-card">
          <div className="not-found-icon">🔍</div>
          <h2>Profil topilmadi</h2>
          <p>{error || "Bunday foydalanuvchi mavjud emas yoki o'chirilgan."}</p>
          <button className="go-home-btn" onClick={() => navigate("/")}>
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <ProfileHeader
        user={targetUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenEdit={() => setIsEditOpen(true)}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onToggleFollow={handleToggleFollow}
        postsCount={userPosts.length}
      />

      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === "posts" ? (
          <UserPostsGrid
            posts={userPosts}
            onOpenCreatePost={isOwnProfile ? onOpenCreatePost : undefined}
          />
        ) : isOwnProfile ? (
          <ProfileAnalytics />
        ) : null}
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && isOwnProfile && (
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onProfileUpdated={(updated) => {
            setTargetUser((prev) => ({ ...prev, ...updated }));
          }}
        />
      )}
    </div>
  );
}

export default ProfilePage;
