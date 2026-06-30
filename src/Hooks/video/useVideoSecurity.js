import { useCallback, useEffect, useRef, useState } from "react";
import { logVideoSecurityEvent } from "../../api/videoSecurityApi";

const LOCK_PREFIX = "video-playback-lock:";
const CHANNEL_NAME = "video-security-channel";

function readUserProfile() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      name:
        user.name ||
        `${user.fname || ""} ${user.lname || ""}`.trim() ||
        user.username ||
        "مستخدم",
      email: user.email || user.mail || "",
    };
  } catch {
    return { name: "مستخدم", email: "" };
  }
}

export function useVideoSecurity({
  videoId,
  sessionId,
  token,
  enabled = true,
  onThreat,
}) {
  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);
  const tabLockRef = useRef(null);
  const channelRef = useRef(null);

  const logEvent = useCallback(
    (type, message, metadata = {}) => {
      if (!videoId || !sessionId) return;
      logVideoSecurityEvent(videoId, sessionId, token, {
        type,
        message,
        metadata,
      });
    },
    [videoId, sessionId, token],
  );

  const triggerThreat = useCallback(
    (reason, eventType = "security_violation") => {
      if (blocked) return;
      setBlocked(true);
      setBlockReason(reason);
      logEvent(eventType, reason);
      onThreat?.(reason, eventType);
    },
    [blocked, logEvent, onThreat],
  );

  /* جلسة تبويب واحد */
  useEffect(() => {
    if (!enabled || !videoId) return undefined;

    const lockKey = `${LOCK_PREFIX}${videoId}`;
    const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    tabLockRef.current = tabId;

    const claim = () => {
      const current = sessionStorage.getItem(lockKey);
      if (!current) {
        sessionStorage.setItem(lockKey, tabId);
        return true;
      }
      return current === tabId;
    };

    if (!claim()) {
      triggerThreat(
        "هذا الفيديو مفتوح بالفعل في تبويب أو جهاز آخر. أغلق التبويب الآخر للمتابعة.",
        "duplicate_tab",
      );
      return undefined;
    }

    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(CHANNEL_NAME)
        : null;
    channelRef.current = channel;

    channel?.postMessage({ type: "claim", videoId, tabId });

    const onMessage = (e) => {
      const msg = e.data;
      if (msg?.videoId !== videoId) return;
      if (msg.type === "claim" && msg.tabId !== tabId) {
        triggerThreat(
          "تم فتح نسخة أخرى من الفيديو. يُسمح بتشغيل واحد فقط.",
          "duplicate_tab",
        );
      }
    };
    channel?.addEventListener("message", onMessage);

    const interval = window.setInterval(() => {
      const owner = sessionStorage.getItem(lockKey);
      if (owner && owner !== tabId) {
        triggerThreat("انتهت جلسة التشغيل — يوجد مشغّل آخر نشط.", "session_replaced");
      } else if (owner === tabId) {
        sessionStorage.setItem(lockKey, tabId);
      }
    }, 3000);

    return () => {
      window.clearInterval(interval);
      channel?.removeEventListener("message", onMessage);
      channel?.close();
      if (sessionStorage.getItem(lockKey) === tabId) {
        sessionStorage.removeItem(lockKey);
      }
    };
  }, [enabled, videoId, triggerThreat]);

  /* DevTools detection */
  useEffect(() => {
    if (!enabled || blocked) return undefined;

    let rafId;
    const THRESHOLD = 160;

    const check = () => {
      const widthGap = window.outerWidth - window.innerWidth > THRESHOLD;
      const heightGap = window.outerHeight - window.innerHeight > THRESHOLD;
      const suspected = widthGap || heightGap;

      if (suspected && !devtoolsOpen) {
        setDevtoolsOpen(true);
        logEvent("devtools_opened", "اشتباه بفتح أدوات المطور");
        triggerThreat(
          "تم إيقاف الفيديو لأسباب أمنية. أغلق أدوات المطور (DevTools) ثم أعد تحميل الصفحة.",
          "devtools_opened",
        );
      }
      rafId = window.requestAnimationFrame(check);
    };

    rafId = window.requestAnimationFrame(check);
    return () => window.cancelAnimationFrame(rafId);
  }, [enabled, blocked, devtoolsOpen, logEvent, triggerThreat]);

  /* حماية لوحة المفاتيح والنسخ */
  useEffect(() => {
    if (!enabled) return undefined;

    const preventContext = (e) => e.preventDefault();
    const preventKeys = (e) => {
      const key = e.key?.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      if (
        key === "f12" ||
        key === "printscreen" ||
        (ctrl && shift && ["i", "j", "c", "k"].includes(key)) ||
        (ctrl && ["u", "s", "p", "c", "x", "a"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (key === "printscreen") {
          logEvent("screenshot_attempt", "محاولة التقاط شاشة");
        }
      }
    };

    const preventDrag = (e) => e.preventDefault();

    document.addEventListener("contextmenu", preventContext, true);
    document.addEventListener("keydown", preventKeys, true);
    document.addEventListener("selectstart", preventContext, true);
    document.addEventListener("dragstart", preventDrag, true);
    document.addEventListener("copy", preventContext, true);
    document.addEventListener("cut", preventContext, true);

    return () => {
      document.removeEventListener("contextmenu", preventContext, true);
      document.removeEventListener("keydown", preventKeys, true);
      document.removeEventListener("selectstart", preventContext, true);
      document.removeEventListener("dragstart", preventDrag, true);
      document.removeEventListener("copy", preventContext, true);
      document.removeEventListener("cut", preventContext, true);
    };
  }, [enabled, logEvent]);

  /* تسجيل الشاشة — كشف محدود عبر PiP وتغيّر الرؤية */
  useEffect(() => {
    if (!enabled || blocked) return undefined;

    const onVisibility = () => {
      if (document.hidden) {
        logEvent("tab_hidden", "إخفاء التبويب أثناء المشاهدة");
      }
    };

    const pipInterval = window.setInterval(() => {
      if (document.pictureInPictureElement) {
        logEvent("pip_detected", "صورة داخل صورة");
        triggerThreat("تم إيقاف التشغيل — وضع PiP غير مسموح.", "pip_blocked");
      }
    }, 2000);

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(pipInterval);
    };
  }, [enabled, blocked, logEvent, triggerThreat]);

  const watermarkProfile = {
    ...readUserProfile(),
    ip: "—",
    viewId: sessionId || "",
    time: new Date().toLocaleString("ar-EG"),
  };

  return {
    blocked,
    blockReason,
    devtoolsOpen,
    watermarkProfile,
    logEvent,
    triggerThreat,
  };
}
