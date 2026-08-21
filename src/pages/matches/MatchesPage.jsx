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
import { PiStickerFill } from "react-icons/pi";
import { api } from "../../services/api";
import { supabase } from "../../components/supabase/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import StickerPicker from "../../components/dating/StickerPicker";

function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active chat state
  const [chatUser, setChatUser] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const stickerPickerRef = useRef(null);

  // 1. Load user's matches
  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await api.getMatches();
        if (res?.matches) {
          setMatches(res.matches);
        }
      } catch (err) {
        console.warn("Matches load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

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
      // Load historical messages from DB
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

  // 4. Realtime subscription via Supabase Channel (Postgres changes + Broadcast)
  useEffect(() => {
    if (!chatUser || !user) return;

    const myId = Number(user.user_id);
    const partnerId = Number(chatUser.user_id);

    // Unique deterministic channel room name between these 2 users
    const roomName = `chat_${Math.min(myId, partnerId)}_${Math.max(myId, partnerId)}`;

    // Clean up previous channel if any
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase.channel(roomName, {
      config: {
        broadcast: { self: false },
        presence: { key: String(myId) },
      },
    });

    // A) Fast Broadcast Listener for instant peer delivery (<10ms)
    channel.on("broadcast", { event: "new_message" }, ({ payload }) => {
      if (payload && String(payload.sender_id) === String(partnerId)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      }
    });

    // B) Database Change Listener (Postgres changes)
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
            // If message already exists by id, skip
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            // Remove matching optimistic message if any
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

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`🟢 Realtime chat connected to room: ${roomName}`);
      }
    });

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [chatUser, user]);

  // 5. Send message with instant optimistic UI + DB persistence + Realtime Broadcast
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !chatUser || !user || sending) return;

    const textToSend = chatMessage.trim();
    const myId = Number(user.user_id);
    const partnerId = Number(chatUser.user_id);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // A) Instant Optimistic Update
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
      // B) Persist to Supabase Database via API
      const res = await api.sendMessage(partnerId, textToSend);

      if (res?.message) {
        const savedMsg = res.message;

        // Replace optimistic message with actual DB record
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m)),
        );

        // C) Broadcast to partner for instant arrival
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
      // Remove temporary message on failure
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

  // Send sticker as a message
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

  // Close sticker picker when clicking outside
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

  // Close sticker picker when chat closes
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

      {loading ? (
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
                  <span className="online-indicator">
                    🟢 Jonli chat (Realtime)
                  </span>
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
              {/* Sticker Picker Popup */}
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
                  autoFocus
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
