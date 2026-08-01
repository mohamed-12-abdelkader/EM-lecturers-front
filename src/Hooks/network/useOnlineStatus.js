import { useSyncExternalStore } from "react";

function subscribe(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

function getServerSnapshot() {
  return true;
}

/** حالة الاتصال بالإنترنت — تتحدث لحظياً مع أحداث online/offline */
export default function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
