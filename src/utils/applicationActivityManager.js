/**
 * ApplicationActivityManager — يتتبع الأنشطة الحرجة عبر التبويبات
 * لمنع إعادة تحميل التطبيق أثناء امتحان / محاضرة / نموذج مهم.
 */

export const ACTIVITY_TYPES = Object.freeze({
  EXAM: "exam",
  LECTURE: "lecture",
  LIVE_LECTURE: "live_lecture",
  FORM: "form",
  UPLOAD: "upload",
  PAYMENT: "payment",
  EDIT: "edit",
});

const STORAGE_KEY = "em-critical-activities";
const CHANNEL_NAME = "em-app-activity";
const HEARTBEAT_MS = 5_000;
const STALE_MS = 20_000;

const CRITICAL_SET = new Set(Object.values(ACTIVITY_TYPES));

function createTabId() {
  try {
    const existing = sessionStorage.getItem("em-activity-tab-id");
    if (existing) return existing;
    const id = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("em-activity-tab-id", id);
    return id;
  } catch {
    return `t_${Date.now().toString(36)}`;
  }
}

function readRegistry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRegistry(registry) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch {
    /* ignore quota */
  }
}

function pruneStale(registry, now = Date.now()) {
  const next = {};
  for (const [tabId, entry] of Object.entries(registry || {})) {
    if (!entry || typeof entry !== "object") continue;
    if (now - Number(entry.updatedAt || 0) > STALE_MS) continue;
    const activities = Array.isArray(entry.activities)
      ? entry.activities.filter((a) => CRITICAL_SET.has(a.type))
      : [];
    if (!activities.length) continue;
    next[tabId] = { ...entry, activities, updatedAt: entry.updatedAt };
  }
  return next;
}

class ApplicationActivityManager {
  constructor() {
    this.tabId = createTabId();
    /** @type {Map<string, { type: string, id: string }>} */
    this.local = new Map();
    this.listeners = new Set();
    this.channel = null;
    this.heartbeatTimer = null;

    if (typeof window !== "undefined") {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = () => this._emit();
      } catch {
        this.channel = null;
      }

      window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY) this._emit();
      });

      window.addEventListener("beforeunload", () => {
        this._clearTabFromRegistry();
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") this._syncRegistry();
      });
    }
  }

  startActivity(type, id = "default") {
    if (!CRITICAL_SET.has(type)) return () => {};
    const key = `${type}:${id}`;
    this.local.set(key, { type, id: String(id) });
    this._syncRegistry();
    this._ensureHeartbeat();
    return () => this.endActivity(type, id);
  }

  endActivity(type, id = "default") {
    const key = `${type}:${id}`;
    if (!this.local.has(key)) return;
    this.local.delete(key);
    this._syncRegistry();
    if (!this.local.size) this._stopHeartbeat();
  }

  endAll(type) {
    for (const [key, value] of [...this.local.entries()]) {
      if (!type || value.type === type) this.local.delete(key);
    }
    this._syncRegistry();
    if (!this.local.size) this._stopHeartbeat();
  }

  getActiveActivities({ includeOtherTabs = true } = {}) {
    const local = [...this.local.values()];
    if (!includeOtherTabs) return local;

    const registry = pruneStale(readRegistry());
    const merged = new Map();
    for (const item of local) merged.set(`${item.type}:${item.id}`, item);
    for (const [tabId, entry] of Object.entries(registry)) {
      if (tabId === this.tabId) continue;
      for (const item of entry.activities || []) {
        merged.set(`${tabId}:${item.type}:${item.id}`, {
          ...item,
          tabId,
        });
      }
    }
    return [...merged.values()];
  }

  isCriticalActivityActive({ includeOtherTabs = true } = {}) {
    if (this.local.size > 0) return true;
    if (!includeOtherTabs) return false;
    const registry = pruneStale(readRegistry());
    return Object.entries(registry).some(
      ([tabId, entry]) => tabId !== this.tabId && (entry.activities || []).length > 0,
    );
  }

  isLocalCriticalActivityActive() {
    return this.local.size > 0;
  }

  subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _emit() {
    const snapshot = {
      local: this.getActiveActivities({ includeOtherTabs: false }),
      all: this.getActiveActivities({ includeOtherTabs: true }),
      isCritical: this.isCriticalActivityActive(),
      isLocalCritical: this.isLocalCriticalActivityActive(),
    };
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch {
        /* ignore */
      }
    });
    try {
      this.channel?.postMessage({ type: "activity-changed", at: Date.now() });
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("em:critical-activity-changed", { detail: snapshot }),
      );
    }
  }

  _syncRegistry() {
    const registry = pruneStale(readRegistry());
    if (this.local.size === 0) {
      delete registry[this.tabId];
    } else {
      registry[this.tabId] = {
        activities: [...this.local.values()],
        updatedAt: Date.now(),
      };
    }
    writeRegistry(registry);
    this._emit();
  }

  _clearTabFromRegistry() {
    const registry = pruneStale(readRegistry());
    delete registry[this.tabId];
    writeRegistry(registry);
  }

  _ensureHeartbeat() {
    if (this.heartbeatTimer || typeof window === "undefined") return;
    this.heartbeatTimer = window.setInterval(() => {
      if (!this.local.size) {
        this._stopHeartbeat();
        return;
      }
      this._syncRegistry();
    }, HEARTBEAT_MS);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

const applicationActivityManager = new ApplicationActivityManager();

export default applicationActivityManager;
export { applicationActivityManager };
