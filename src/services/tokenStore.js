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
import {
  getAuthScopeSubdomain,
  readScopedAuthItem,
  removeScopedAuthItem,
  tenantAuthStorageKey,
  writeScopedAuthItem,
} from "../utils/tenantAuthStorage";

const TOKEN_KEY = "token";
const SCOPED_AUTH_KEYS = new Set([
  TOKEN_KEY,
  "user",
  "employee_data",
  "employee_permissions",
]);

/**
 * Fallback مؤقت: الباك اند لا يوفر بعد POST /auth/refresh بكوكي HttpOnly
 * (يرجع 404 حالياً)، وبدونه التوكن في الذاكرة يضيع مع كل تحديث صفحة
 * ولا توجد وسيلة لاسترجاعه → كل خدمات المنصة تتوقف.
 * لذلك نحفظ التوكن على القرص أيضاً (write-through) حتى يجهز الباك اند.
 * عند تفعيل /auth/refresh في الباك اند: اجعلها false ليعمل النظام بالذاكرة فقط.
 */
const PERSIST_TOKEN_FALLBACK = true;

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
  persistTokenToDisk(token);
  notifyListeners();
  if (broadcast) postAuthMessage({ type: "token", token, tenant: getAuthScopeSubdomain() });
  return memoryToken;
}

export function clearAccessToken({ broadcast = false } = {}) {
  removeTokenFromDisk();
  if (!memoryToken) return;
  memoryToken = "";
  notifyListeners();
  if (broadcast) postAuthMessage({ type: "logout", tenant: getAuthScopeSubdomain() });
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

function scopedTokenStorageKey() {
  return tenantAuthStorageKey(TOKEN_KEY);
}

/** كتابة التوكن على القرص عبر الدوال الأصلية (بدون المرور بالجسر — لا recursion) */
function persistTokenToDisk(token) {
  if (!PERSIST_TOKEN_FALLBACK || typeof window === "undefined") return;
  try {
    const write = nativeLocalSet || Storage.prototype.setItem;
    write.call(window.localStorage, scopedTokenStorageKey(), token);
    removeTokenFromDiskLegacy();
  } catch {
    // Safari Private Mode وغيره — تجاهل
  }
}

function removeTokenFromDiskLegacy() {
  if (typeof window === "undefined") return;
  try {
    const remove = nativeLocalRemove || Storage.prototype.removeItem;
    remove.call(window.localStorage, TOKEN_KEY);
  } catch {
    // تجاهل
  }
}

function removeTokenFromDisk() {
  if (typeof window === "undefined") return;
  try {
    const remove = nativeLocalRemove || Storage.prototype.removeItem;
    remove.call(window.localStorage, scopedTokenStorageKey());
    removeTokenFromDiskLegacy();
  } catch {
    // تجاهل
  }
}

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
      if (SCOPED_AUTH_KEYS.has(key) && isWindowLocalStorage(this)) {
        if (key === TOKEN_KEY) return memoryToken || null;
        return readScopedAuthItem(key);
      }
      return nativeLocalGet.call(this, key);
    };
    proto.setItem = function setItem(key, value) {
      if (key === TOKEN_KEY && isWindowLocalStorage(this)) {
        setAccessToken(value);
        return undefined;
      }
      if (SCOPED_AUTH_KEYS.has(key) && key !== TOKEN_KEY && isWindowLocalStorage(this)) {
        writeScopedAuthItem(key, value);
        return undefined;
      }
      return nativeLocalSet.call(this, key, value);
    };
    proto.removeItem = function removeItem(key) {
      if (key === TOKEN_KEY && isWindowLocalStorage(this)) {
        clearAccessToken();
        return undefined;
      }
      if (SCOPED_AUTH_KEYS.has(key) && key !== TOKEN_KEY && isWindowLocalStorage(this)) {
        removeScopedAuthItem(key);
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
 * تحميل التوكن المحفوظ على القرص إلى الذاكرة عند الإقلاع.
 * - مع الـ fallback المفعّل: يبقى التوكن على القرص (الباك اند بلا refresh).
 * - عند تعطيل الـ fallback مستقبلاً: يُرحَّل للذاكرة ويُمسح من القرص نهائياً.
 */
function loadPersistedToken() {
  if (typeof window === "undefined") return;
  try {
    const read = nativeLocalGet || Storage.prototype.getItem;
    let persisted = normalizeAuthToken(
      read.call(window.localStorage, scopedTokenStorageKey()),
    );
    if (!persisted) {
      persisted = normalizeAuthToken(readScopedAuthItem(TOKEN_KEY));
    }
    if (!persisted) return;
    if (isJwtExpired(persisted)) {
      removeTokenFromDisk();
      return;
    }
    memoryToken = persisted;
    if (!PERSIST_TOKEN_FALLBACK) removeTokenFromDisk();
  } catch {
    // تجاهل — Safari Private Mode وغيره
  }
}

/** مزامنة التوكن الواصل من تبويبات أخرى */
function listenToPeers() {
  subscribeAuthMessages((msg) => {
    const currentTenant = getAuthScopeSubdomain();
    const msgTenant = msg.tenant ?? null;
    if (String(msgTenant || "") !== String(currentTenant || "")) return;

    if (msg.type === "token" && msg.token) {
      setAccessToken(msg.token, { broadcast: false });
    } else if (msg.type === "login" && msg.token) {
      setAccessToken(msg.token, { broadcast: false });
    } else if (msg.type === "logout" || msg.type === "session-expired") {
      clearAccessToken({ broadcast: false });
    } else if (msg.type === "request-token") {
      if (hasFreshAccessToken()) {
        postAuthMessage({
          type: "token",
          token: memoryToken,
          tenant: currentTenant,
        });
      }
    }
  });
}

/** يُستدعى مرة واحدة كأول شيء في main.jsx قبل تحميل بقية التطبيق */
export function initTokenStore() {
  if (bridgeInstalled) return;
  bridgeInstalled = true;
  const patched = installStorageBridge();
  loadPersistedToken();
  listenToPeers();
  if (!patched && import.meta.env.DEV) {
    console.warn("[tokenStore] storage bridge غير مدعوم — الكود القديم قد لا يجد التوكن");
  }
}
