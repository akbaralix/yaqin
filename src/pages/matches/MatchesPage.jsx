import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaComments,
  FaFire,
  FaMapMarkerAlt,
  FaSpinner,
  FaPaperPlane,
  FaCheck,
  FaCheckDouble,
} from "react-icons/fa";
import { MdOutlineDelete } from "react-icons/md";

import { PiStickerFill } from "react-icons/pi";
import { api } from "../../services/api";
import { supabase } from "../../components/supabase/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useDataCache } from "../../context/DataCacheContext";
import toast from "react-hot-toast";
import StickerPicker from "../../components/dating/StickerPicker";

function MatchesPage() {
  const { user } = useAuth();
  const { matches, matchesLoading, loadMatches, removeMatchLocally } =
    useDataCache();

  // Active chat state
  const [chatUser, setChatUser] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Delete modal state
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null); // O'chiriladigan match saqlanadi
  const [deleting, setDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const stickerPickerRef = useRef(null);

  // 1. Load user's matches (kesh bo'lsa yuklamaydi)
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // 2. Auto-scroll chat to the bottom
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (chatUser && messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages, chatUser]);

  // 3. Open Realtime Chat with a specific matched user
  const handleOpenChat = async (matchedUser) => {
    setChatUser(matchedUser);
    setMessages([]);
    setLoadingChat(true);

    try {
      const res = await api.getChatMessages(matchedUser.user_id);
      if (res?.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn("Load chat messages error:", err);
      toast.error("Xabarlar tarixini yuklab bo'lmadi");
    } finally {
      setLoadingChat(false);
      setTimeout(() => scrollToBottom("auto"), 100);
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

    const roomName = `chat_${Math.min(myId, partnerId)}_${Math.max(myId, partnerId)}`;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase.channel(roomName, {
      config: {
        broadcast: { self: false },
        presence: { key: String(myId) },
      },
    });

    channel.on("broadcast", { event: "new_message" }, ({ payload }) => {
      if (payload && String(payload.sender_id) === String(partnerId)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
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

        const isBetweenUs =
          (String(newMsg.sender_id) === String(partnerId) &&
            String(newMsg.receiver_id) === String(myId)) ||
          (String(newMsg.sender_id) === String(myId) &&
            String(newMsg.receiver_id) === String(partnerId));

        if (isBetweenUs) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            const cleaned = prev.filter(
              (m) =>
                !(
                  m.is_temp &&
                  m.text === newMsg.text &&
                  String(m.sender_id) === String(newMsg.sender_id)
                ),
            );
            return [...cleaned, newMsg];
          });
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

  // 5. Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !chatUser || !user || sending) return;

    const textToSend = chatMessage.trim();
    const myId = Number(user.user_id);
    const partnerId = Number(chatUser.user_id);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const optimisticMessage = {
      id: tempId,
      sender_id: myId,
      receiver_id: partnerId,
      text: textToSend,
      created_at: new Date().toISOString(),
      is_temp: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setChatMessage("");
    setSending(true);

    try {
      const res = await api.sendMessage(partnerId, textToSend);

      if (res?.message) {
        const savedMsg = res.message;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m)),
        );

        if (realtimeChannelRef.current) {
          realtimeChannelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: savedMsg,
          });
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Xabar yuborilmadi");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSendSticker = async (stickerUrl) => {
    if (!chatUser || !user || sending) return;

    const myId = Number(user.user_id);
    const partnerId = Number(chatUser.user_id);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const optimisticMessage = {
      id: tempId,
      sender_id: myId,
      receiver_id: partnerId,
      text: `[sticker]${stickerUrl}`,
      created_at: new Date().toISOString(),
      is_temp: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setSending(true);

    try {
      const res = await api.sendMessage(partnerId, `[sticker]${stickerUrl}`);

      if (res?.message) {
        const savedMsg = res.message;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m)),
        );

        if (realtimeChannelRef.current) {
          realtimeChannelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: savedMsg,
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

  return (
    <div className="matches-page-container fade-in-content">
      <div className="matches-header">
        <h2>
          <FaFire className="fire-icon" /> Matchlarim va Suhbatlar (
          {matches.length})
        </h2>
      </div>

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
            Tanishuv (Swipe) bo'limiga o'ting va yoqqan profillarga Like bosing.
            Ular ham sizni yoqtirishganda bu yerda paydo bo'ladi!
          </p>
          <Link to="/dating" className="go-swipe-btn">
            <FaFire /> Tanishuvni boshlash
          </Link>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((m) => (
            <div key={m.match_id} className="match-card">
              <button
                className="open-delete-modal"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMatch(m);
                  setOpenDelete(true);
                }}
              >
                <MdOutlineDelete />
              </button>
              <img
                src={
                  m.user.profile_pic ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt={m.user.first_name}
                className="match-card-avatar"
              />
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
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {openDelete && (
        <div className="modal-overlay">
          <div className="delete-chat-modal">
            <h2>Ushbu chatni rostan ham o'chirmoqchimisiz?</h2>
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

      {/* Realtime Chat Modal */}
      {chatUser && (
        <div className="modal-overlay" onClick={() => setChatUser(null)}>
          <div
            className="chat-modal scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-header">
              <div className="chat-user-header-info">
                <img
                  src={
                    chatUser.profile_pic ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt={chatUser.first_name}
                />
                <div>
                  <h4>{chatUser.first_name}</h4>
                  <span className="online-indicator">🟢 Jonli chat</span>
                </div>
              </div>
              <button
                className="close-chat-btn"
                onClick={() => setChatUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="chat-messages-body">
              <div className="match-start-notice">
                🎉 Siz va <b>{chatUser.first_name}</b> bir-biringizga yoqdingiz!
                Suhbatni birinchi bo'lib boshlang.
              </div>

              {loadingChat ? (
                <div className="matches-loading" style={{ minHeight: "150px" }}>
                  <FaSpinner className="spinner-anim" />
                </div>
              ) : messages.length === 0 ? (
                <div className="no-comments" style={{ padding: "30px 10px" }}>
                  <p>Hali xabarlar yo'q.</p>
                  <span>Salom deb birinchi qadamni qo'ying! 👋</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe =
                    String(msg.sender_id) === String(user?.user_id) ||
                    msg.sender === "me";
                  const isSticker = msg.text?.startsWith("[sticker]");
                  const stickerUrl = isSticker
                    ? msg.text.replace("[sticker]", "")
                    : null;
                  return (
                    <div
                      key={msg.id}
                      className={`chat-bubble ${isMe ? "me" : "other"} ${isSticker ? "sticker-bubble" : ""}`}
                    >
                      {isSticker ? (
                        <img
                          src={stickerUrl}
                          alt="sticker"
                          className="chat-sticker-img"
                        />
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      <span className="chat-time">
                        {formatTime(msg.created_at)}
                        {isMe && (
                          <span style={{ marginLeft: "4px", fontSize: "10px" }}>
                            {msg.is_temp ? <FaCheck /> : <FaCheckDouble />}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

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
                  className="sticker-toggle-btn"
                  onClick={() => setShowStickerPicker((prev) => !prev)}
                  title="Stikerlar"
                >
                  <PiStickerFill />
                </button>
                <input
                  type="text"
                  placeholder="Xabaringizni yozing..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={sending || !chatMessage.trim()}
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
