import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  FaHeart,
  FaComments,
  FaFire,
  FaMapMarkerAlt,
  FaSpinner,
  FaPaperPlane,
  FaCheck,
  FaCheckDouble,
  FaUsers,
  FaReply,
  FaTimes,
  FaBell,
} from "react-icons/fa";
import { MdOutlineDelete } from "react-icons/md";
import { PiStickerFill } from "react-icons/pi";
import { api } from "../../services/api";
import { supabase } from "../../components/supabase/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useDataCache } from "../../context/DataCacheContext";
import toast from "react-hot-toast";
import StickerPicker from "../../components/dating/StickerPicker";

// Umumiy Guruh obyekti
const GLOBAL_GROUP_USER = {
  user_id: 1,
  first_name: "Yaqin Umumiy Guruh",
  username: "yaqin_group",
  is_group: true,
  profile_pic: "/icon.png",
  bio: "Barcha foydalanuvchilar bilan jonli guruh suhbati",
  region: "O'zbekiston",
};

function MatchesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { matches, matchesLoading, loadMatches, removeMatchLocally } =
    useDataCache();

  // Tab: "group" (Umumiy Guruh) yoki "matches" (Matchlar va Shaxsiy Chat)
  const [activeTab, setActiveTab] = useState("group");

  // Active chat state
  const [chatUser, setChatUser] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Reply holati
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);

  // Reply bildirishnomalari (ko'rilmagan replylar ro'yxati)
  const [unreadReplies, setUnreadReplies] = useState(() => {
    try {
      const saved = localStorage.getItem(
        `unread_replies_${user?.user_id || "guest"}`,
      );
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Delete modal state
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const stickerPickerRef = useRef(null);
  const autoOpenedRef = useRef(false);
  const messageInputRef = useRef(null);

  // Unread replies ni saqlash
  useEffect(() => {
    if (user?.user_id) {
      localStorage.setItem(
        `unread_replies_${user.user_id}`,
        JSON.stringify(unreadReplies),
      );
    }
  }, [unreadReplies, user?.user_id]);

  // 1. Load user's matches
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // 1.1 MatchModal yoki havola orqali kelganda to'g'ridan-to'g'ri o'sha user bilan chatni ochish
  useEffect(() => {
    if (autoOpenedRef.current) return;

    const targetUserId = searchParams.get("userId");
    const autoUser = location.state?.autoOpenUser;

    if (
      autoUser &&
      (!targetUserId || String(autoUser.user_id) === String(targetUserId))
    ) {
      autoOpenedRef.current = true;
      setActiveTab("matches");
      handleOpenChat(autoUser);
      return;
    }

    if (targetUserId && matches.length > 0) {
      const foundMatch = matches.find(
        (m) => String(m.user?.user_id) === String(targetUserId),
      );
      if (foundMatch?.user) {
        autoOpenedRef.current = true;
        setActiveTab("matches");
        handleOpenChat(foundMatch.user);
      }
    }
  }, [searchParams, location.state, matches]);

  // 2. Auto-scroll chat to the bottom
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (chatUser && messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages, chatUser]);

  // 3. Open Chat with a specific user or Group
  const handleOpenChat = async (targetUser) => {
    setChatUser(targetUser);
    setMessages([]);
    setReplyingTo(null);
    setLoadingChat(true);

    try {
      const res = await api.getChatMessages(targetUser.user_id);
      if (res?.messages) {
        setMessages(res.messages);

        if (targetUser.is_group || Number(targetUser.user_id) === 1) {
          setUnreadReplies((prev) =>
            prev.filter((item) => Number(item.partner_id) !== 1),
          );
        } else {
          setUnreadReplies((prev) =>
            prev.filter(
              (item) => String(item.partner_id) !== String(targetUser.user_id),
            ),
          );
        }
      }
    } catch (err) {
      console.warn("Load chat messages error:", err);
      toast.error("Xabarlar tarixini yuklab bo'lmadi");
    } finally {
      setLoadingChat(false);
      setTimeout(() => scrollToBottom("auto"), 150);
    }
  };

  // Match/Chatni o'chirish funksiyasi
  const handleDeleteChat = async () => {
    if (!selectedMatch) return;
    setDeleting(true);
    try {
      await api.deleteMatch(selectedMatch.match_id);
      removeMatchLocally(selectedMatch.match_id);

      if (
        chatUser &&
        String(chatUser.user_id) === String(selectedMatch.user.user_id)
      ) {
        setChatUser(null);
      }

      toast.success("Match va chat o'chirildi");
      setOpenDelete(false);
      setSelectedMatch(null);
    } catch (err) {
      console.error("Delete match error:", err);
      toast.error("O'chirishda xatolik yuz berdi");
    } finally {
      setDeleting(false);
    }
  };

  // 4. Realtime subscription via Supabase Channel
  useEffect(() => {
    if (!chatUser || !user) return;

    const myId = Number(user.user_id);
    const partnerId = Number(chatUser.user_id);
    const isGroupChat = chatUser.is_group || partnerId === 1;

    const roomName = isGroupChat
      ? "room_yaqin_global_group"
      : `chat_${Math.min(myId, partnerId)}_${Math.max(myId, partnerId)}`;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase.channel(roomName, {
      config: {
        broadcast: { self: false },
        presence: { key: String(myId) },
      },
    });

    const handleIncomingMessage = (newMsg) => {
      if (!newMsg) return;

      const isFromMe = String(newMsg.sender_id) === String(myId);

      let parsedText = newMsg.text;
      let replyTo = newMsg.reply_to || null;
      let stickerUrl = newMsg.sticker || null;

      if (
        typeof parsedText === "string" &&
        parsedText.startsWith("{") &&
        parsedText.endsWith("}")
      ) {
        try {
          const parsed = JSON.parse(parsedText);
          parsedText = parsed.text || "";
          replyTo = parsed.reply_to || replyTo;
          stickerUrl = parsed.sticker || stickerUrl;
        } catch (e) {}
      }

      const formattedMsg = {
        ...newMsg,
        text: parsedText,
        reply_to: replyTo,
        sticker: stickerUrl,
        sender_name:
          newMsg.sender_name || (isFromMe ? user.first_name : "Foydalanuvchi"),
        sender_pic: newMsg.sender_pic || (isFromMe ? user.profile_pic : null),
      };

      if (replyTo && String(replyTo.sender_id) === String(myId) && !isFromMe) {
        toast(
          (t) => (
            <div
              style={{ cursor: "pointer" }}
              onClick={() => {
                toast.dismiss(t.id);
                handleJumpToMessage(newMsg.id);
              }}
            >
              💬 <b>{formattedMsg.sender_name}</b> sizning xabaringizga javob
              berdi!
              <div
                style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}
              >
                "{formattedMsg.text?.slice(0, 40) || "Stiker"}"
              </div>
            </div>
          ),
          { icon: "🔔", duration: 5000 },
        );

        setUnreadReplies((prev) => {
          if (prev.some((item) => item.message_id === newMsg.id)) return prev;
          return [
            ...prev,
            {
              message_id: newMsg.id,
              sender_name: formattedMsg.sender_name,
              text: formattedMsg.text || "Stiker",
              created_at: newMsg.created_at,
              partner_id: isGroupChat ? 1 : newMsg.sender_id,
            },
          ];
        });
      }

      setMessages((prev) => {
        // Agar o'zimiz yuborgan bo'lsak va allaqachon qo'shilgan bo'lsa
        if (isFromMe) return prev;
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, formattedMsg];
      });
    };

    channel.on("broadcast", { event: "new_message" }, ({ payload }) => {
      if (String(payload.sender_id) !== String(myId)) {
        handleIncomingMessage(payload);
      }
    });

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const newMsg = payload.new;
        if (!newMsg) return;

        // O'zimiz yuborgan xabar bazaga tushganda qayta listenerdan olib qo'shmaymiz
        if (String(newMsg.sender_id) === String(myId)) return;

        if (isGroupChat) {
          if (Number(newMsg.receiver_id) === 1) {
            handleIncomingMessage(newMsg);
          }
        } else {
          const isBetweenUs =
            (String(newMsg.sender_id) === String(partnerId) &&
              String(newMsg.receiver_id) === String(myId)) ||
            (String(newMsg.sender_id) === String(myId) &&
              String(newMsg.receiver_id) === String(partnerId));

          if (isBetweenUs) {
            handleIncomingMessage(newMsg);
          }
        }
      },
    );

    channel.subscribe();
    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [chatUser, user]);

  // Global listener for unread replies
  useEffect(() => {
    if (!user) return;
    const myId = Number(user.user_id);

    const globalChannel = supabase.channel("global_notifications", {
      config: { broadcast: { self: false } },
    });

    globalChannel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const newMsg = payload.new;
        if (!newMsg || String(newMsg.sender_id) === String(myId)) return;

        let replyTo = null;
        let text = newMsg.text;
        if (
          typeof text === "string" &&
          text.startsWith("{") &&
          text.endsWith("}")
        ) {
          try {
            const parsed = JSON.parse(text);
            replyTo = parsed.reply_to;
          } catch (e) {}
        }

        if (replyTo && String(replyTo.sender_id) === String(myId)) {
          const isCurrentlyViewing =
            chatUser &&
            (Number(chatUser.user_id) === Number(newMsg.receiver_id) ||
              (Number(newMsg.receiver_id) === 1 && chatUser.is_group));

          if (!isCurrentlyViewing) {
            setUnreadReplies((prev) => {
              if (prev.some((item) => item.message_id === newMsg.id))
                return prev;
              return [
                ...prev,
                {
                  message_id: newMsg.id,
                  sender_name: "Yaqin Foydalanuvchi",
                  text: text || "Xabar",
                  created_at: newMsg.created_at,
                  partner_id:
                    Number(newMsg.receiver_id) === 1 ? 1 : newMsg.sender_id,
                },
              ];
            });
          }
        }
      },
    );

    globalChannel.subscribe();
    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [user, chatUser]);

  // 5. Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim() || !chatUser || !user || sending) return;

    const textToSend = chatMessage.trim();
    const myId = Number(user.user_id);
    const partnerId = Number(chatUser.user_id);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const payload = {
      text: textToSend,
      reply_to: replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text || (replyingTo.sticker ? "🖼 Stiker" : ""),
            sender_id: replyingTo.sender_id,
            sender_name:
              replyingTo.sender_name ||
              (Number(replyingTo.sender_id) === myId
                ? user.first_name
                : "Foydalanuvchi"),
            sticker: replyingTo.sticker || null,
          }
        : null,
      sticker: null,
    };

    const optimisticMessage = {
      id: tempId,
      sender_id: myId,
      receiver_id: partnerId,
      text: textToSend,
      reply_to: payload.reply_to,
      sticker: null,
      created_at: new Date().toISOString(),
      is_temp: true,
      sender_name: user.first_name || "Siz",
      sender_pic: user.profile_pic || null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setChatMessage("");
    setReplyingTo(null);
    setSending(true);

    try {
      const res = await api.sendMessage(partnerId, payload);

      if (res?.message) {
        const savedMsg = res.message;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...savedMsg, ...optimisticMessage, is_temp: false }
              : m,
          ),
        );

        if (realtimeChannelRef.current) {
          realtimeChannelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: {
              ...savedMsg,
              sender_name: user.first_name,
              sender_pic: user.profile_pic,
            },
          });
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Xabar yuborilmadi");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
      messageInputRef.current?.focus();
    }
  };

  // 6. Send Sticker
  const handleSendSticker = async (stickerUrl) => {
    if (!chatUser || !user || sending) return;

    const myId = Number(user.user_id);
    const partnerId = Number(chatUser.user_id);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const payload = {
      text: "",
      sticker: stickerUrl,
      reply_to: replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text || (replyingTo.sticker ? "🖼 Stiker" : ""),
            sender_id: replyingTo.sender_id,
            sender_name:
              replyingTo.sender_name ||
              (Number(replyingTo.sender_id) === myId
                ? user.first_name
                : "Foydalanuvchi"),
            sticker: replyingTo.sticker || null,
          }
        : null,
    };

    const optimisticMessage = {
      id: tempId,
      sender_id: myId,
      receiver_id: partnerId,
      text: "",
      sticker: stickerUrl,
      reply_to: payload.reply_to,
      created_at: new Date().toISOString(),
      is_temp: true,
      sender_name: user.first_name || "Siz",
      sender_pic: user.profile_pic || null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setShowStickerPicker(false);
    setReplyingTo(null);
    setSending(true);

    try {
      const res = await api.sendMessage(partnerId, payload);

      if (res?.message) {
        const savedMsg = res.message;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...savedMsg, ...optimisticMessage, is_temp: false }
              : m,
          ),
        );

        if (realtimeChannelRef.current) {
          realtimeChannelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: {
              ...savedMsg,
              sender_name: user.first_name,
              sender_pic: user.profile_pic,
            },
          });
        }
      }
    } catch (err) {
      console.error("Failed to send sticker:", err);
      toast.error("Stiker yuborilmadi");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleJumpToMessage = (targetMsgId) => {
    if (!targetMsgId) return;
    const targetElement = document.getElementById(`msg-${targetMsgId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(targetMsgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 2000);
    } else {
      toast("Xabar oldingi suhbat tarixida", { icon: "ℹ️" });
    }
  };

  const handleStartReply = (msg) => {
    setReplyingTo(msg);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        stickerPickerRef.current &&
        !stickerPickerRef.current.contains(e.target)
      ) {
        setShowStickerPicker(false);
      }
    };
    if (showStickerPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStickerPicker]);

  useEffect(() => {
    if (!chatUser) setShowStickerPicker(false);
  }, [chatUser]);

  const groupUnreadCount = unreadReplies.filter(
    (r) => Number(r.partner_id) === 1,
  ).length;
  const privateUnreadCount = unreadReplies.filter(
    (r) => Number(r.partner_id) !== 1,
  ).length;

  return (
    <div className="matches-page-container fade-in-content">
      {/* Top Header & Tabs Navigation */}
      <div className="matches-header-modern">
        <div className="matches-title-area">
          <h2>
            <FaComments className="chat-header-icon" /> Suhbatlar va Guruh
          </h2>
          <p>
            Saytdagi barcha foydalanuvchilar bilan umumiy guruhda yoki o'zaro
            matchlar bilan suhbatlashing
          </p>
        </div>

        {/* Tab switcher: Guruh vs Matchlarim */}
        <div className="chat-tabs-switcher">
          <button
            className={`chat-tab-btn ${activeTab === "group" ? "active" : ""}`}
            onClick={() => setActiveTab("group")}
          >
            <FaUsers />
            <span>Guruh</span>
            {groupUnreadCount > 0 && (
              <span
                className="tg-unread-badge"
                title={`${groupUnreadCount} ta yangi javob`}
              >
                <FaBell style={{ fontSize: "10px" }} /> {groupUnreadCount}
              </span>
            )}
          </button>

          <button
            className={`chat-tab-btn ${activeTab === "matches" ? "active" : ""}`}
            onClick={() => setActiveTab("matches")}
          >
            <FaHeart />
            <span>Matchlarim ({matches.length})</span>
            {privateUnreadCount > 0 && (
              <span
                className="tg-unread-badge private-badge"
                title={`${privateUnreadCount} ta javob`}
              >
                {privateUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 1. UMUMIY GURUH TAB */}
      {activeTab === "group" && (
        <div className="group-chat-banner-card">
          <div className="group-banner-info">
            <div className="group-avatar-stack">
              <img
                src={GLOBAL_GROUP_USER.profile_pic}
                alt="Yaqin Guruh"
                className="group-main-avatar"
              />
              <span className="group-live-pulse" />
            </div>
            <div className="group-info-texts">
              <div className="group-title-row">
                <h3>Yaqin Umumiy Suhbat Guruhi</h3>
                <span className="group-tag">🌐 Ochiq Guruh</span>
              </div>
            </div>
          </div>

          <div className="group-actions-area">
            {unreadReplies.some((r) => Number(r.partner_id) === 1) && (
              <div className="group-unread-alert">
                <FaBell className="bell-ring" />
                <span>Sizning xabaringizga yangi javoblar keldi!</span>
              </div>
            )}
            <button
              className="open-group-chat-btn"
              onClick={() => handleOpenChat(GLOBAL_GROUP_USER)}
            >
              <FaComments /> Guruh suhbatiga qo'shilish
            </button>
          </div>
        </div>
      )}

      {/* 2. MATCHLARIM RO'YXATI TAB */}
      {activeTab === "matches" && (
        <>
          {matchesLoading ? (
            <div className="matches-loading">
              <FaSpinner className="spinner-anim" />
            </div>
          ) : matches.length === 0 ? (
            <div className="matches-empty-state">
              <div className="empty-heart-box">
                <FaHeart />
              </div>
              <h3>Hozircha o'zaro matchlar yo'q</h3>
              <p>
                Tanishuv (Swipe) bo'limiga o'ting va yoqqan profillarga Like
                bosing. Ular ham sizni yoqtirishganda bu yerda paydo bo'ladi!
              </p>
              <Link to="/dating" className="go-swipe-btn">
                <FaFire /> Tanishuvni boshlash
              </Link>
            </div>
          ) : (
            <div className="matches-grid">
              {matches.map((m) => {
                const partnerUnread = unreadReplies.filter(
                  (r) => String(r.partner_id) === String(m.user?.user_id),
                ).length;

                return (
                  <div key={m.match_id} className="match-card">
                    <button
                      className="open-delete-modal"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMatch(m);
                        setOpenDelete(true);
                      }}
                      title="Suhbatni o'chirish"
                    >
                      <MdOutlineDelete />
                    </button>

                    <div className="match-avatar-wrapper">
                      <img
                        src={
                          m.user.profile_pic ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt={m.user.first_name}
                        className="match-card-avatar"
                      />
                      {partnerUnread > 0 && (
                        <span className="card-reply-badge">
                          <FaBell /> {partnerUnread}
                        </span>
                      )}
                    </div>

                    <div className="match-card-details">
                      <div className="match-name-row">
                        <h4>{m.user.first_name}</h4>
                        {m.user.age && <span>, {m.user.age}</span>}
                      </div>
                      <span className="match-region">
                        <FaMapMarkerAlt /> {m.user.region || "O'zbekiston"}
                      </span>

                      {m.user.bio && (
                        <p className="match-bio-excerpt">{m.user.bio}</p>
                      )}

                      <button
                        className="start-chat-btn"
                        onClick={() => handleOpenChat(m.user)}
                      >
                        <FaComments /> Suhbatlashish
                        {partnerUnread > 0 && (
                          <span className="btn-badge-dot" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {openDelete && (
        <div className="modal-overlay">
          <div className="delete-chat-modal scale-in">
            <h2>Ushbu chatni rostdan ham o'chirmoqchimisiz?</h2>
            <p>Chat tarixi butunlay o'chirilib tashlanadi.</p>
            <div className="delete-chat-buton">
              <button
                onClick={handleDeleteChat}
                disabled={deleting}
                style={{ color: "red" }}
              >
                {deleting ? "O'chirilmoqda..." : "O'chirish"}
              </button>
              <button
                onClick={() => {
                  setOpenDelete(false);
                  setSelectedMatch(null);
                }}
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL TELEGRAM-STYLE REALTIME CHAT MODAL (Group & Private) */}
      {chatUser && (
        <div className="modal-overlay" onClick={() => setChatUser(null)}>
          <div
            className={`chat-modal telegram-chat-modal scale-in ${
              chatUser.is_group || Number(chatUser.user_id) === 1
                ? "group-chat-mode"
                : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Telegram-Style Header */}
            <div className="chat-header">
              <div className="chat-user-header-info">
                {chatUser.is_group || Number(chatUser.user_id) === 1 ? (
                  <div className="header-avatar-box">
                    <img
                      src={
                        chatUser.profile_pic ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt={chatUser.first_name}
                    />
                    <span className="group-badge-icon">👥</span>
                  </div>
                ) : (
                  <Link
                    to={
                      chatUser.username
                        ? `/${chatUser.username}`
                        : chatUser.user_id
                          ? `/${chatUser.user_id}`
                          : "/profile"
                    }
                    className="header-avatar-box clickable-header-avatar"
                    title="Profilni ko'rish"
                  >
                    <img
                      src={
                        chatUser.profile_pic ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt={chatUser.first_name}
                    />
                    <span className="online-dot" />
                  </Link>
                )}

                <div className="header-text-details">
                  {chatUser.is_group || Number(chatUser.user_id) === 1 ? (
                    <h4>{chatUser.first_name}</h4>
                  ) : (
                    <Link
                      to={
                        chatUser.username
                          ? `/${chatUser.username}`
                          : chatUser.user_id
                            ? `/${chatUser.user_id}`
                            : "/profile"
                      }
                      className="header-user-name-link"
                    >
                      <h4>{chatUser.first_name}</h4>
                      {chatUser.username && (
                        <span className="header-user-handle">@{chatUser.username}</span>
                      )}
                    </Link>
                  )}
                  <span className="online-indicator">
                    {chatUser.is_group || Number(chatUser.user_id) === 1
                      ? "👥 Yaqin barcha foydalanuvchilar guruhi"
                      : "🟢 Jonli suhbat"}
                  </span>
                </div>
              </div>

              <div className="header-actions">
                <button
                  className="close-chat-btn"
                  onClick={() => setChatUser(null)}
                  title="Yopish"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 2. Messages Body */}
            <div className="chat-messages-body" ref={messagesContainerRef}>
              {messages.length === 0 &&
                (chatUser.is_group || Number(chatUser.user_id) === 1 ? (
                  <div className="match-start-notice group-welcome-notice">
                    🌟 <b>Yaqin Umumiy Guruhiga xush kelibsiz!</b>
                    <p>
                      Bu yerda barcha foydalanuvchilar fikr almashishi,
                      stikerlar yuborishi va reply qilishi mumkin.
                    </p>
                  </div>
                ) : (
                  <div className="match-start-notice">
                    🎉 Siz va <b>{chatUser.first_name}</b> bir-biringizga
                    yoqdingiz! Suhbatni birinchi bo'lib boshlang.
                  </div>
                ))}

              {/* Xabarlar ro'yxati va yuklanish steyti shu yerdan davom etadi... */}

              {loadingChat ? (
                <div className="matches-loading" style={{ minHeight: "150px" }}>
                  <FaSpinner className="spinner-anim" />
                </div>
              ) : messages.length === 0 ? (
                <div
                  className="no-comments"
                  style={{
                    textAlign: "center",
                    marginTop: 100 + 20,
                    padding: "30px 10px",
                  }}
                >
                  <p>Hali xabarlar yo'q.</p>
                  <span>Salom deb birinchi qadamni qo'ying! 👋</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe =
                    String(msg.sender_id) === String(user?.user_id) ||
                    msg.sender === "me";

                  const isLegacySticker =
                    typeof msg.text === "string" &&
                    msg.text.startsWith("[sticker]");
                  const stickerUrl =
                    msg.sticker ||
                    (isLegacySticker
                      ? msg.text.replace("[sticker]", "")
                      : null);
                  const isSticker = Boolean(stickerUrl);
                  const hasReply = Boolean(msg.reply_to);
                  const isHighlighted = highlightedMsgId === msg.id;

                  const senderProfilePath = msg.sender_username
                    ? `/${msg.sender_username}`
                    : msg.sender_id
                      ? `/${msg.sender_id}`
                      : "/profile";

                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`telegram-message-row ${isMe ? "me-row" : "other-row"} ${
                        isHighlighted ? "highlight-pulse" : ""
                      }`}
                    >
                      {!isMe &&
                        (chatUser.is_group ||
                          Number(chatUser.user_id) === 1) && (
                          <Link
                            to={senderProfilePath}
                            className="msg-sender-avatar-link"
                            title={msg.sender_name}
                          >
                            <img
                              src={
                                msg.sender_pic ||
                                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                              }
                              alt={msg.sender_name || "User"}
                              className="msg-sender-avatar"
                            />
                          </Link>
                        )}

                      <div
                        className={`chat-bubble ${isMe ? "me" : "other"} ${
                          isSticker ? "sticker-bubble" : ""
                        }`}
                      >
                        {!isMe &&
                          (chatUser.is_group ||
                            Number(chatUser.user_id) === 1) && (
                            <Link
                              to={senderProfilePath}
                              className="msg-author-name msg-author-name-link"
                            >
                              {msg.sender_name || "Foydalanuvchi"}
                              {msg.sender_username && (
                                <span className="msg-author-handle"> @{msg.sender_username}</span>
                              )}
                            </Link>
                          )}

                        {hasReply && (
                          <div
                            className="msg-reply-quote"
                            onClick={() => handleJumpToMessage(msg.reply_to.id)}
                            title="Xabarga o'tish"
                          >
                            <div className="reply-quote-bar" />
                            <div className="reply-quote-content">
                              <span className="reply-quote-author">
                                {msg.reply_to.sender_name || "Foydalanuvchi"}
                              </span>
                              {msg.reply_to.sticker ? (
                                <div className="reply-quote-sticker-preview">
                                  <img
                                    src={msg.reply_to.sticker}
                                    alt="Stiker"
                                  />
                                  <span>🖼 Stiker</span>
                                </div>
                              ) : (
                                <p className="reply-quote-text">
                                  {msg.reply_to.text || "Xabar"}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {isSticker ? (
                          <img
                            src={stickerUrl}
                            alt="sticker"
                            className="chat-sticker-img"
                            loading="lazy"
                          />
                        ) : (
                          <p className="chat-msg-text">{msg.text}</p>
                        )}

                        <div className="chat-bubble-footer">
                          <button
                            className="reply-action-trigger"
                            onClick={() => handleStartReply(msg)}
                            title="Javob berish (Reply)"
                          >
                            <FaReply />
                          </button>

                          <span className="chat-time">
                            {formatTime(msg.created_at)}
                            {isMe && (
                              <span
                                style={{ marginLeft: "4px", fontSize: "10px" }}
                              >
                                {msg.is_temp ? <FaCheck /> : <FaCheckDouble />}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 3. Reply Bar Preview */}
            {replyingTo && (
              <div className="active-reply-banner">
                <div className="reply-banner-left">
                  <FaReply className="reply-icon" />
                  <div className="reply-preview-info">
                    <span className="reply-target-name">
                      {replyingTo.sender_name ||
                        (Number(replyingTo.sender_id) === Number(user?.user_id)
                          ? "Siz"
                          : "Foydalanuvchi")}
                      ga javob
                    </span>
                    <span className="reply-target-text">
                      {replyingTo.sticker ? "🖼 Stiker" : replyingTo.text}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="cancel-reply-btn"
                  onClick={cancelReply}
                  title="Bekor qilish"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {/* 4. Chat Input & Picker */}
            <div className="chat-input-wrapper">
              {showStickerPicker && (
                <div className="sticker-picker-popup" ref={stickerPickerRef}>
                  <StickerPicker
                    onStickerSelect={handleSendSticker}
                    onClose={() => setShowStickerPicker(false)}
                  />
                </div>
              )}

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <button
                  type="button"
                  className={`sticker-toggle-btn ${showStickerPicker ? "active" : ""}`}
                  onClick={() => setShowStickerPicker((prev) => !prev)}
                  title="Stikerlar"
                >
                  <PiStickerFill />
                </button>

                <input
                  ref={messageInputRef}
                  type="text"
                  placeholder={
                    replyingTo
                      ? "Javobingizni yozing..."
                      : "Xabaringizni yozing..."
                  }
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />

                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={sending || !chatMessage.trim()}
                  title="Yuborish"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchesPage;
