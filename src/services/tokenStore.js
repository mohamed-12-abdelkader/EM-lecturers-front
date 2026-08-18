/**
 * مخزن الـ Access Token — الذاكرة + localStorage (مفتاح token لكل منصة).
 *
 * جسر التوافق: الكود القديم يقرأ localStorage.getItem("token") — يُحوَّل للذاكرة.
 */

import { normalizeAuthToken, isJwtExpired } from "../utils/jwt";
import { postAuthMessage, subscribeAuthMessages } from "./authChannel";
import {
  getAuthScopeSubdomain,
  readScopedAuthItem,
  removeScopedAuthItem,
  writeScopedAuthItem,
} from "../utils/tenantAuthStorage";

const TOKEN_KEY = "token";
const SCOPED_AUTH_KEYS = new Set([
  TOKEN_KEY,
  "user",
  "employee_data",
  "employee_permissions",
]);

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

export function getAccessToken() {
  return memoryToken;
}

export function hasFreshAccessToken() {
  return Boolean(memoryToken) && !isJwtExpired(memoryToken);
}

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

export function subscribeAccessToken(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

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

let bridgeInstalled = false;
let nativeLocalGet = null;
let nativeLocalSet = null;
let nativeLocalRemove = null;

function persistTokenToDisk(token) {
  if (!PERSIST_TOKEN_FALLBACK || typeof window === "undefined") return;
  try {
    const write = nativeLocalSet || Storage.prototype.setItem;
    write.call(window.localStorage, TOKEN_KEY, token);
  } catch {
    // Safari Private Mode وغيره
  }
}

function removeTokenFromDisk() {
  if (typeof window === "undefined") return;
  try {
    const remove = nativeLocalRemove || Storage.prototype.removeItem;
    remove.call(window.localStorage, TOKEN_KEY);
  } catch {
    // ignore
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

function loadPersistedToken() {
  if (typeof window === "undefined") return;
  try {
    const read = nativeLocalGet || Storage.prototype.getItem;
    let persisted = normalizeAuthToken(read.call(window.localStorage, TOKEN_KEY));
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
    // ignore
  }
}

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
