/**
 * مخزن الـ Access Token — في الذاكرة فقط (لا LocalStorage ولا SessionStorage).
 *
 * جسر التوافق (Compatibility Bridge):
 * مئات الملفات القديمة تقرأ التوكن عبر localStorage.getItem("token").
 * بدلاً من تعديلها كلها دفعة واحدة، نعترض مفتاح "token" في localStorage
 * ونحوّله إلى الذاكرة، فيعمل كل الكود القديم بدون أن يُكتب التوكن على القرص.
 * (إزالة تدريجية بدون كسر النظام — يمكن حذف الجسر بعد ترحيل كل الملفات.)
 */

import { normalizeAuthToken, isJwtExpired } from "../utils/jwt";
import { postAuthMessage, subscribeAuthMessages } from "./authChannel";

const TOKEN_KEY = "token";

let memoryToken = "";
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(memoryToken);
    } catch (err) {
      if (import.meta.env.DEV) console.error("[tokenStore] listener failed", err);
    }
  });
}

/** التوكن الحالي من الذاكرة (بدون بادئة Bearer) */
export function getAccessToken() {
  return memoryToken;
}

/** هل يوجد توكن غير منتهي في الذاكرة؟ */
export function hasFreshAccessToken() {
  return Boolean(memoryToken) && !isJwtExpired(memoryToken);
}

/**
 * تخزين توكن جديد في الذاكرة.
 * broadcast=false عندما يصل التوكن من تبويب آخر (منع حلقة رسائل).
 */
export function setAccessToken(rawToken, { broadcast = true } = {}) {
  const token = normalizeAuthToken(rawToken);
  if (!token || token === memoryToken) return memoryToken;
  memoryToken = token;
  notifyListeners();
  if (broadcast) postAuthMessage({ type: "token", token });
  return memoryToken;
}

export function clearAccessToken({ broadcast = false } = {}) {
  if (!memoryToken) return;
  memoryToken = "";
  notifyListeners();
  if (broadcast) postAuthMessage({ type: "logout" });
}

/** الاستماع لتغيّر التوكن داخل نفس التبويب */
export function subscribeAccessToken(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * تبويب جديد بلا توكن: يطلب التوكن من التبويبات المفتوحة وينتظر الرد.
 * يرجع التوكن لو وصل خلال المهلة، وإلا "".
 */
export function requestTokenFromPeers(timeoutMs = 300) {
  if (hasFreshAccessToken()) return Promise.resolve(memoryToken);
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(hasFreshAccessToken() ? memoryToken : "");
    };
    const unsubscribe = subscribeAuthMessages((msg) => {
      if (msg.type === "token" || msg.type === "login") finish();
    });
    const sent = postAuthMessage({ type: "request-token" });
    if (!sent) {
      finish();
      return;
    }
    setTimeout(finish, timeoutMs);
  });
}

/* ------------------------------------------------------------------ */
/* جسر التوافق مع localStorage                                          */
/* ------------------------------------------------------------------ */

let bridgeInstalled = false;
let nativeLocalGet = null;
let nativeLocalSet = null;
let nativeLocalRemove = null;

function isWindowLocalStorage(storage) {
  try {
    return typeof window !== "undefined" && storage === window.localStorage;
  } catch {
    return false;
  }
}

function installStorageBridge() {
  if (typeof window === "undefined" || typeof Storage === "undefined") return false;
  try {
    const proto = Storage.prototype;
    nativeLocalGet = proto.getItem;
    nativeLocalSet = proto.setItem;
    nativeLocalRemove = proto.removeItem;

    proto.getItem = function getItem(key) {
      if (key === TOKEN_KEY && isWindowLocalStorage(this)) {
        return memoryToken || null;
      }
      return nativeLocalGet.call(this, key);
    };
    proto.setItem = function setItem(key, value) {
      if (key === TOKEN_KEY && isWindowLocalStorage(this)) {
        setAccessToken(value);
        return undefined;
      }
      return nativeLocalSet.call(this, key, value);
    };
    proto.removeItem = function removeItem(key) {
      if (key === TOKEN_KEY && isWindowLocalStorage(this)) {
        clearAccessToken();
        return undefined;
      }
      return nativeLocalRemove.call(this, key);
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * ترحيل الجلسات القديمة: توكن كان محفوظاً على القرص قبل التحديث
 * يُنقل للذاكرة مرة واحدة ثم يُمسح من القرص نهائياً.
 */
function migrateLegacyPersistedToken() {
  if (typeof window === "undefined") return;
  try {
    const read = nativeLocalGet || Storage.prototype.getItem;
    const remove = nativeLocalRemove || Storage.prototype.removeItem;
    const persisted = normalizeAuthToken(read.call(window.localStorage, TOKEN_KEY));
    if (persisted) {
      remove.call(window.localStorage, TOKEN_KEY);
      if (!isJwtExpired(persisted)) {
        // بدون broadcast — كل تبويب يرحّل نسخته المحلية بنفسه
        memoryToken = persisted;
      }
    }
  } catch {
    // تجاهل — Safari Private Mode وغيره
  }
}

/** مزامنة التوكن الواصل من تبويبات أخرى */
function listenToPeers() {
  subscribeAuthMessages((msg) => {
    if (msg.type === "token" && msg.token) {
      setAccessToken(msg.token, { broadcast: false });
    } else if (msg.type === "login" && msg.token) {
      setAccessToken(msg.token, { broadcast: false });
    } else if (msg.type === "logout" || msg.type === "session-expired") {
      clearAccessToken({ broadcast: false });
    } else if (msg.type === "request-token") {
      if (hasFreshAccessToken()) {
        postAuthMessage({ type: "token", token: memoryToken });
      }
    }
  });
}

/** يُستدعى مرة واحدة كأول شيء في main.jsx قبل تحميل بقية التطبيق */
export function initTokenStore() {
  if (bridgeInstalled) return;
  bridgeInstalled = true;
  const patched = installStorageBridge();
  migrateLegacyPersistedToken();
  listenToPeers();
  if (!patched && import.meta.env.DEV) {
    console.warn("[tokenStore] storage bridge غير مدعوم — الكود القديم قد لا يجد التوكن");
  }
}
