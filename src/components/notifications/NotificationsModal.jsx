import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaComment,
  FaUserPlus,
  FaFire,
  FaCheckDouble,
  FaTimes,
  FaRegBell,
} from "react-icons/fa";
import { useNotifications } from "../../context/NotificationContext";

function NotificationsModal({ isOpen, onClose }) {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    loading,
  } = useNotifications();

  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like_post":
        return <span className="notif-type-icon like"><FaHeart /></span>;
      case "comment_post":
        return <span className="notif-type-icon comment"><FaComment /></span>;
      case "follow":
        return <span className="notif-type-icon follow"><FaUserPlus /></span>;
      case "dating_like":
        return <span className="notif-type-icon dating-like"><FaFire /></span>;
      case "dating_match":
        return <span className="notif-type-icon dating-match"><FaHeart /></span>;
      default:
        return <span className="notif-type-icon default"><FaHeart /></span>;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const diffMin = Math.floor(
      (Date.now() - new Date(isoString).getTime()) / (1000 * 60)
    );
    if (diffMin < 1) return "Hozirgina";
    if (diffMin < 60) return `${diffMin}d oldin`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}soat oldin`;
    return `${Math.floor(diffHr / 24)}kun oldin`;
  };

  const getTargetUrl = (notif) => {
    if (notif.type === "dating_match") {
      return "/matches";
    }
    if (notif.type === "dating_like") {
      return "/dating";
    }
    if (notif.sender?.username) {
      return `/${notif.sender.username}`;
    }
    if (notif.sender?.user_id) {
      return `/${notif.sender.user_id}`;
    }
    return "/profile";
  };

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div
        className="notifications-drawer scale-in"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="notif-header">
          <div className="notif-header-title">
            <FaRegBell className="header-bell-icon" />
            <h3>Bildirishnomalar</h3>
            {unreadCount > 0 && (
              <span className="notif-unread-badge-pill">{unreadCount} yangi</span>
            )}
          </div>
          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                title="Barchasini o'qilgan deb belgilash"
              >
                <FaCheckDouble /> O'qildi
              </button>
            )}
            <button className="notif-close-btn" onClick={onClose} title="Yopish">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Body list */}
        <div className="notif-list-body">
          {loading ? (
            <div className="notif-loading">
              <div className="notif-skeleton-item" />
              <div className="notif-skeleton-item" />
              <div className="notif-skeleton-item" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty-box">
              <div className="empty-bell-circle">
                <FaRegBell />
              </div>
              <h4>Hozircha yangi bildirishnomalar yo'q</h4>
              <p>
                Postingizga like, izoh, yangi obunachilar yoki tanishuvlar paydo bo'lganda shu yerda ko'rasiz.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const targetUrl = getTargetUrl(notif);

              return (
                <div
                  key={notif.id}
                  className={
otif-item }
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id);
                  }}
                >
                  <Link
                    to={targetUrl}
                    className="notif-avatar-box"
                    onClick={onClose}
                  >
                    <img
                      src={
                        notif.sender?.profile_pic ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt={notif.sender?.first_name || "Foydalanuvchi"}
                      className="notif-avatar"
                    />
                    {getNotificationIcon(notif.type)}
                  </Link>

                  <div className="notif-content-box">
                    <Link
                      to={targetUrl}
                      className="notif-text-link"
                      onClick={onClose}
                    >
                      <span className="notif-sender-name">
                        {notif.sender?.profile_sticker && (
                          <img
                            src={notif.sender.profile_sticker}
                            alt="stiker"
                            className="notif-sticker-img"
                          />
                        )}
                        {notif.sender?.first_name || "Foydalanuvchi"}
                      </span>{" "}
                      <span className="notif-action-text">{notif.text}</span>
                    </Link>
                    <span className="notif-time">{formatTime(notif.created_at)}</span>
                  </div>

                  {notif.post_image && (
                    <Link
                      to={targetUrl}
                      className="notif-post-thumb"
                      onClick={onClose}
                    >
                      <img src={notif.post_image} alt="Post" />
                    </Link>
                  )}

                  {!notif.is_read && <span className="notif-unread-dot" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsModal;
