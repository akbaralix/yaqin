import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { api } from "../services/api";
import { supabase } from "../components/supabase/supabaseClient";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const realtimeChannelRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res?.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount ?? res.notifications.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.warn("Load notifications error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.user_id || unreadCount === 0) return;
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await api.markNotificationsAsRead();
    } catch (err) {
      console.warn("Mark all read error:", err);
    }
  }, [user?.user_id, unreadCount]);

  const markAsRead = useCallback(async (notifId) => {
    if (!notifId) return;
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await api.markSingleNotificationAsRead(notifId);
    } catch (err) {
      console.warn("Mark single read error:", err);
    }
  }, []);

  // Realtime tinglovchi va periodik yuklash
  useEffect(() => {
    if (!user?.user_id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();

    // Supabase Realtime channel
    const channelName = `user-notifs-${user.user_id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.user_id}`,
        },
        async (payload) => {
          if (payload?.new) {
            // Yangi bildirishnoma kelganda ro'yxatni yangilaymiz
            await loadNotifications();
            toast("Yangi bildirishnoma keldi! 🔔", {
              icon: "🔔",
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    // Har 40 soniyada fonda yangilab turish
    const interval = setInterval(() => {
      loadNotifications();
    }, 40000);

    return () => {
      clearInterval(interval);
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [user?.user_id, loadNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        loadNotifications,
        markAllAsRead,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
