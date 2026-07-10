import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { io } from "socket.io-client";
import PushPermissionPrompt from "../components/notifications/PushPermissionPrompt";
import {
  deleteNotification as deleteNotificationApi,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationsApi";
import { getSocketEndpoint } from "../utils/socketEndpoint";
import {
  getNotificationPermission,
  isPushSupported,
  markPushOptedIn,
  markPushPromptDismissed,
  hasOptedInToPush,
  onServiceWorkerMessage,
  setupWebPush,
  shouldPromptForPush,
  syncPushSubscriptionSilently,
} from "../utils/pushNotifications";

const NotificationContext = createContext(null);

const DROPDOWN_LIMIT = 15;

function countUnread(notifications = []) {
  return notifications.filter((item) => !item?.is_read).length;
}

export function NotificationProvider({ children }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [pushPermission, setPushPermission] = useState(getNotificationPermission());
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const socketRef = useRef(null);
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  const applyNotificationList = useCallback((list) => {
    const safeList = Array.isArray(list) ? list : [];
    setNotifications(safeList.slice(0, DROPDOWN_LIMIT));
    setUnreadCount(countUnread(safeList));
  }, []);

  const refreshNotifications = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (isFetchingRef.current && !force) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError("");

      const listRes = await fetchNotifications();
      const list = listRes?.notifications || [];
      applyNotificationList(list);
    } catch (err) {
      const message = err?.response?.data?.message;
      if (err?.response?.status !== 500) {
        setError(message || "تعذّر تحميل الإشعارات");
      }
      applyNotificationList([]);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [applyNotificationList]);

  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationRead(notificationId);
    } catch {
      await refreshNotifications(true);
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch {
      await refreshNotifications(true);
    }
  }, [refreshNotifications]);

  const removeNotification = useCallback(async (notificationId) => {
    let wasUnread = false;
    setNotifications((prev) => {
      const target = prev.find((item) => item.id === notificationId);
      wasUnread = target && !target.is_read;
      return prev.filter((item) => item.id !== notificationId);
    });
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await deleteNotificationApi(notificationId);
    } catch {
      await refreshNotifications(true);
    }
  }, [refreshNotifications]);

  const prependNotification = useCallback((notification) => {
    if (!notification?.id) return;
    setNotifications((prev) => {
      const filtered = prev.filter((item) => item.id !== notification.id);
      return [notification, ...filtered].slice(0, DROPDOWN_LIMIT);
    });
    if (!notification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const enablePushNotifications = useCallback(async () => {
    if (!isPushSupported()) {
      toast({
        title: "المتصفح لا يدعم الإشعارات",
        status: "warning",
        duration: 4000,
      });
      return { status: "unsupported" };
    }

    setPushLoading(true);
    try {
      const result = await setupWebPush({ requestPermission: true });
      const permission = getNotificationPermission();
      setPushPermission(permission);

      if (result.status === "granted") {
        setShowPushPrompt(false);
        markPushOptedIn();

        if (result.backendSynced === false) {
          toast({
            title: "تم تفعيل الإشعارات على هذا الجهاز",
            description:
              result.message ||
              "تعذّر مزامنة الاشتراك مع السيرفر — ستُعاد المحاولة تلقائياً لاحقاً",
            status: "warning",
            duration: 5000,
          });
        } else {
          toast({
            title: "تم تفعيل الإشعارات",
            description: "ستصلك التنبيهات حتى عند إغلاق الموقع",
            status: "success",
            duration: 4000,
          });
        }
      } else if (result.status === "denied") {
        setShowPushPrompt(false);
        markPushPromptDismissed();
        toast({
          title: "تم رفض الإشعارات",
          description: "يمكنك تفعيلها لاحقاً من إعدادات المتصفح",
          status: "info",
          duration: 5000,
        });
      } else if (result.status === "default") {
        toast({
          title: "لم يتم منح الإذن",
          description: "يجب الموافقة على الإشعارات من المتصفح",
          status: "info",
          duration: 4000,
        });
      } else {
        toast({
          title: "فشل تفعيل الإشعارات",
          description: result.message || "حاول مجدداً",
          status: "error",
          duration: 5000,
        });
      }

      return result;
    } finally {
      setPushLoading(false);
      if (getNotificationPermission() === "granted" || hasOptedInToPush()) {
        setShowPushPrompt(false);
      }
    }
  }, [toast]);

  const dismissPushPrompt = useCallback(() => {
    setShowPushPrompt(false);
    markPushPromptDismissed();
  }, []);

  const syncAuth = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      const token = localStorage.getItem("token");
      if (token) {
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
        }
        refreshNotifications(true);

        const permission = getNotificationPermission();
        if (permission === "granted") {
          setShowPushPrompt(false);
          syncPushSubscriptionSilently().catch(() => {});
        } else {
          setShowPushPrompt(shouldPromptForPush());
        }
      } else {
        hasInitializedRef.current = false;
        applyNotificationList([]);
        setShowPushPrompt(false);
      }
    }, 250);
  }, [applyNotificationList, refreshNotifications]);

  useEffect(() => {
    syncAuth();
    window.addEventListener("auth-storage-update", syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      window.removeEventListener("auth-storage-update", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, [syncAuth]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const socket = io(getSocketEndpoint(), {
      path: "/socket.io",
      withCredentials: true,
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 12000,
      timeout: 12000,
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsSocketConnected(true));
    socket.on("disconnect", () => setIsSocketConnected(false));
    socket.on("connect_error", () => setIsSocketConnected(false));

    socket.on("notification:new", (payload) => {
      const notification = payload?.notification || payload;
      if (notification?.id) {
        prependNotification(notification);
      } else {
        refreshNotifications(true);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsSocketConnected(false);
    };
  }, [prependNotification, refreshNotifications]);

  useEffect(() => {
    return onServiceWorkerMessage((data) => {
      if (data?.type === "NOTIFICATION_CLICK" && data.url) {
        navigate(data.url.startsWith("/") ? data.url : `/${data.url}`);
      }
      if (data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
        setupWebPush({ requestPermission: false }).catch(() => {});
      }
    });
  }, [navigate]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      isSocketConnected,
      pushPermission,
      pushSupported: isPushSupported(),
      showPushPrompt,
      pushLoading,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      removeNotification,
      enablePushNotifications,
      dismissPushPrompt,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      isSocketConnected,
      pushPermission,
      showPushPrompt,
      pushLoading,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      removeNotification,
      enablePushNotifications,
      dismissPushPrompt,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <PushPermissionPrompt />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
