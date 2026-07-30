/**
 * قراءة/كتابة آمنة للتخزين — Safari Private Mode وبعض WebViews ترمي عند الوصول.
 */

function canUseStorage(storage) {
  if (typeof window === "undefined" || !storage) return false;
  try {
    const key = "__em_storage_probe__";
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

let localOk;
let sessionOk;

function localAvailable() {
  if (localOk == null) {
    try {
      localOk = canUseStorage(window.localStorage);
    } catch {
      localOk = false;
    }
  }
  return localOk;
}

function sessionAvailable() {
  if (sessionOk == null) {
    try {
      sessionOk = canUseStorage(window.sessionStorage);
    } catch {
      sessionOk = false;
    }
  }
  return sessionOk;
}

export function safeLocalGet(key, fallback = null) {
  try {
    if (!localAvailable()) return fallback;
    const value = window.localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function safeLocalSet(key, value) {
  try {
    if (!localAvailable()) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeLocalRemove(key) {
  try {
    if (!localAvailable()) return false;
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionGet(key, fallback = null) {
  try {
    if (!sessionAvailable()) return fallback;
    const value = window.sessionStorage.getItem(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function safeSessionSet(key, value) {
  try {
    if (!sessionAvailable()) return false;
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionRemove(key) {
  try {
    if (!sessionAvailable()) return false;
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
