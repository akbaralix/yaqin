import React, { useState } from "react";
import {
  FaMapMarkerAlt,
  FaEdit,
  FaChartLine,
  FaTh,
  FaCalendarAlt,
  FaUserPlus,
  FaUserCheck,
  FaShareAlt,
} from "react-icons/fa";
import fmale from "/gender-icon/fmale/fmale-icon5.jpg";
import male from "/gender-icon/male/male-icon3.jpg";
import StickerPicker from "./StickerPicker";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

function ProfileHeader({
  user,
  activeTab,
  onTabChange,
  onOpenEdit,
  isOwnProfile = true,
  isFollowing = false,
  onToggleFollow,
  postsCount = 0,
}) {
  const { refreshUser } = useAuth();
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  if (!user) return null;

  const handleStickerSelect = async (sticker) => {
    try {
      const formData = new FormData();
      formData.append("profileSticker", sticker || "");
      const res = await api.updateProfile(formData);
      if (res?.success) {
        await refreshUser();
        toast.success(
          sticker ? "Stiker o'rnatildi! ✨" : "Stiker olib tashlandi",
        );
      }
    } catch (err) {
      console.error("Sticker update error:", err);
      toast.error("Stikerni saqlashda xatolik");
    }
  };

  const handleFollowClick = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (onToggleFollow) {
        await onToggleFollow();
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareProfile = () => {
    const url = user.username
      ? `${window.location.origin}/${user.username}`
      : `${window.location.origin}/profile`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Profil havolasi nusxalandi!");
    } else {
      toast.success("Havola nusxalandi!");
    }
  };

  const totalPosts = postsCount || user.stats?.totalPosts || 0;
  const followersCount = user.stats?.followersCount || 0;
  const followingCount = user.stats?.followingCount || 0;

  return (
    <div className="profile-header-card">
      <div className="profile-banner-bg" />

      <div className="profile-main-meta">
        <div className="profile-avatar-wrapper">
          <img
            src={
              user.profile_pic ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt={user.first_name || "Profile"}
            className="profile-big-avatar"
          />
          {user.gender && (
            <img
              className={`gender-badge ${user.gender}`}
              title={user.gender === "male" ? "Erkak" : "Ayol"}
              src={user.gender === "male" ? male : fmale}
              alt="gender"
            />
          )}
        </div>

        <div className="profile-names-section">
          {/* Header Row: Names + Action buttons */}
          <div className="profile-title-row">
            <div className="profile-full-name">
              <div className="profile-name-and-username">
                <h1>{user.first_name}</h1>
                {user.username && (
                  <span className="profile-username-handle">@{user.username}</span>
                )}
              </div>

              {/* Profile Sticker Badge */}
              <button
                className="profile-sticker-badge telegram-sparkle-badge"
                onClick={() => isOwnProfile && setIsStickerPickerOpen(true)}
                title={isOwnProfile ? "Stiker o'rnatish / o'zgartirish" : "Foydalanuvchi stikeri"}
                style={{ cursor: isOwnProfile ? "pointer" : "default" }}
              >
                <span className="sparkle-particle p-top-left">✦</span>
                <span className="sparkle-particle p-top-right">★</span>
                <span className="sparkle-particle p-bottom-left">✦</span>
                <span className="sparkle-particle p-bottom-right">★</span>
                <span className="sparkle-particle p-center-up">✦</span>

                {user?.profile_sticker ? (
                  <img
                    className="sticker-badge-img"
                    src={user.profile_sticker}
                    alt="stiker"
                  />
                ) : isOwnProfile ? (
                  <span className="sticker-placeholder">＋</span>
                ) : null}
              </button>

              {user.age && (
                <span className="profile-age"> ● {user.age} yosh</span>
              )}
            </div>

            <div className="profile-action-buttons-group">
              {isOwnProfile ? (
                <button className="profile-edit-btn" onClick={onOpenEdit}>
                  <FaEdit /> Tahrirlash
                </button>
              ) : (
                <button
                  className={`profile-follow-btn ${isFollowing ? "following" : ""}`}
                  onClick={handleFollowClick}
                  disabled={followLoading}
                >
                  {isFollowing ? (
                    <>
                      <FaUserCheck /> Obunadasiz
                    </>
                  ) : (
                    <>
                      <FaUserPlus /> Obuna bo'lish
                    </>
                  )}
                </button>
              )}

              <button
                className="profile-share-btn"
                onClick={handleShareProfile}
                title="Profilni ulashish"
              >
                <FaShareAlt />
              </button>
            </div>
          </div>

          {/* Instagram-Style Stats Counter (Posts, Followers, Following, Views) */}
          <div className="profile-instagram-stats-row">
            <div className="insta-stat-box">
              <span className="insta-stat-number">{totalPosts}</span>
              <span className="insta-stat-label">postlar</span>
            </div>
            <div className="insta-stat-box">
              <span className="insta-stat-number">{followersCount}</span>
              <span className="insta-stat-label">obunachilar</span>
            </div>
            <div className="insta-stat-box">
              <span className="insta-stat-number">{followingCount}</span>
              <span className="insta-stat-label">obunalar</span>
            </div>
            {user.stats?.viewsCount !== undefined && (
              <div className="insta-stat-box">
                <span className="insta-stat-number">{user.stats.viewsCount}</span>
                <span className="insta-stat-label">ko'rishlar</span>
              </div>
            )}
          </div>

          <div className="profile-info-badges">
            {user.region && (
              <span className="info-pill">
                <FaMapMarkerAlt /> {user.region}
              </span>
            )}
            {user.birth_date && (
              <span className="info-pill">
                <FaCalendarAlt /> {user.birth_date}
              </span>
            )}
          </div>

          {user.bio ? (
            <p className="profile-bio-text">{user.bio}</p>
          ) : (
            <p className="profile-bio-empty">
              {isOwnProfile
                ? 'O\'zingiz haqingizda ma\'lumot kiritilmagan. "Tahrirlash" orqali qo\'shing.'
                : "Bio ma'lumotlari kiritilmagan."}
            </p>
          )}

          {/* Interests Pills */}
          {Array.isArray(user.interests) && user.interests.length > 0 && (
            <div className="profile-interests-wrapper">
              <span className="interests-header-tag">Qiziqishlar:</span>
              <div className="profile-interests-chips">
                {user.interests.map((tag, idx) => (
                  <span key={idx} className="interest-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Tabs Navigation (Posts Grid vs Analytics) */}
      <div className="profile-tabs-nav">
        <button
          className={`profile-tab-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => onTabChange("posts")}
        >
          <FaTh />
          <span>Postlar ({totalPosts})</span>
        </button>

        {isOwnProfile && (
          <button
            className={`profile-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => onTabChange("analytics")}
          >
            <FaChartLine />
            <span>Statistika & Analitika</span>
          </button>
        )}
      </div>

      {/* Sticker Picker Modal */}
      {isOwnProfile && (
        <StickerPicker
          isOpen={isStickerPickerOpen}
          onClose={() => setIsStickerPickerOpen(false)}
          onSelect={handleStickerSelect}
          currentSticker={user.profile_sticker}
        />
      )}
    </div>
  );
}

export default ProfileHeader;
