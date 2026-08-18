/**
 * Token accessor — يقرأ/يكتب localStorage.token فقط (origin الحالي).
 * جسر توافق: localStorage.getItem("token") يعمل للكود القديم.
 */
import { normalizeAuthToken } from "../utils/jwt";
import { safeLocalGet, safeLocalRemove, safeLocalSet } from "../utils/safeStorage";
import { TOKEN_KEY, readAuthToken } from "../utils/authStorage";

const BRIDGE_KEYS = new Set(["token", "user"]);

let bridgeInstalled = false;
let nativeLocalGet = null;
let nativeLocalSet = null;
let nativeLocalRemove = null;

export function getAccessToken() {
  return readAuthToken();
}

export function hasFreshAccessToken() {
  const token = getAccessToken();
  return Boolean(token);
}

export function setAccessToken(rawToken) {
  const token = normalizeAuthToken(rawToken);
  if (!token) return "";
  safeLocalSet(TOKEN_KEY, token);
  return token;
}

export function clearAccessToken() {
  safeLocalRemove(TOKEN_KEY);
}

export function subscribeAccessToken() {
  return () => {};
}

export function requestTokenFromPeers() {
  return Promise.resolve(getAccessToken() || "");
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
      if (BRIDGE_KEYS.has(key) && isWindowLocalStorage(this)) {
        return nativeLocalGet.call(this, key);
      }
      return nativeLocalGet.call(this, key);
    };
    proto.setItem = function setItem(key, value) {
      if (key === TOKEN_KEY && isWindowLocalStorage(this)) {
        setAccessToken(value);
        return undefined;
      }
      if (key === "user" && isWindowLocalStorage(this)) {
        nativeLocalSet.call(this, key, value);
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

export function initTokenStore() {
  if (bridgeInstalled) return;
  bridgeInstalled = true;
  installStorageBridge();
}
