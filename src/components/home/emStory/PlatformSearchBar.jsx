import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EM, emFont } from "./theme";
import { searchTeacherPlatforms } from "../../../api/tenantPublicApi";
import { useDebounce } from "../../../Hooks/tenantPublic/useDebounce";

function hostLabel(item) {
  try {
    if (item?.platformUrl) return new URL(item.platformUrl).host;
  } catch {
    /* ignore */
  }
  return item?.subdomain ? `${item.subdomain}.em-online.online` : "";
}

/**
 * Live search for teacher platforms on the marketing landing.
 * Debounced + abortable requests; opens platform in the same tab.
 */
export default function PlatformSearchBar({
  variant = "hero",
  placeholder = "ابحث عن منصة مدرّسك بالاسم…",
  className = "",
}) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const wrapperRef = useRef(null);
  const abortRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebounce(query, 280);
  const isCompact = variant === "nav";

  const runSearch = useCallback(async (q) => {
    const trimmed = String(q || "").trim();
    if (trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await searchTeacherPlatforms(trimmed, {
        limit: 10,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setResults(Array.isArray(res?.data) ? res.data : []);
      setActiveIndex(-1);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setResults([]);
      setError(err?.message || "تعذر البحث");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void runSearch(debounced);
  }, [debounced, open, runSearch]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const openPlatform = (item) => {
    const url = item?.platformUrl;
    if (!url) return;
    window.location.assign(url);
  };

  const showPanel = open && String(query).trim().length >= 1;

  const onKeyDown = (e) => {
    if (!showPanel) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex] || results[0];
      if (item) openPlatform(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${className}`}
      style={emFont}
      role="search"
    >
      <label htmlFor={inputId} className="sr-only">
        البحث عن منصة مدرس
      </label>
      <div
        className={`flex items-center gap-2 border ${
          isCompact ? "h-9 rounded-full px-3" : "min-h-[52px] rounded-2xl px-3.5 sm:px-4"
        }`}
        style={{
          borderColor: EM.lineStrong,
          background: isCompact ? "rgba(255,255,255,0.05)" : "rgba(13,20,36,0.92)",
          boxShadow: isCompact ? "none" : "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        <span
          aria-hidden
          className={`shrink-0 ${isCompact ? "text-sm" : "text-base"}`}
          style={{ color: EM.textSoft }}
        >
          ⌕
        </span>
        <input
          id={inputId}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:opacity-60 ${
            isCompact ? "text-[12px] font-semibold" : "text-[14px] font-bold sm:text-[15px]"
          }`}
          style={{ color: EM.text }}
        />
        {loading ? (
          <span
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-transparent"
            style={{ borderTopColor: EM.blue, borderRightColor: EM.blue }}
            aria-label="جاري البحث"
          />
        ) : query ? (
          <button
            type="button"
            aria-label="مسح"
            className="shrink-0 rounded-full px-2 text-xs font-bold"
            style={{ color: EM.textSoft }}
            onClick={() => {
              setQuery("");
              setResults([]);
              setError(null);
            }}
          >
            ✕
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-[70] mt-2 w-full overflow-hidden border shadow-2xl ${
            isCompact ? "rounded-xl" : "rounded-2xl"
          }`}
          style={{
            borderColor: EM.line,
            background: EM.bgElevated,
            maxHeight: isCompact ? 320 : 420,
            overflowY: "auto",
          }}
        >
          {loading && !results.length ? (
            <p className="px-4 py-5 text-center text-sm font-semibold" style={{ color: EM.textMuted }}>
              جاري البحث…
            </p>
          ) : error ? (
            <p className="px-4 py-5 text-center text-sm font-semibold" style={{ color: EM.orange }}>
              {error}
            </p>
          ) : !results.length ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-extrabold" style={{ color: EM.text }}>
                لا توجد منصات بهذا الاسم
              </p>
              <p className="mt-1 text-xs font-medium" style={{ color: EM.textMuted }}>
                جرّب الاسم الأول أو جزء من الاسم
              </p>
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item, idx) => {
                const active = idx === activeIndex;
                const host = hostLabel(item);
                return (
                  <li key={item.subdomain || idx} role="option" aria-selected={active}>
                    <button
                      type="button"
                      id={`${listboxId}-opt-${idx}`}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-right transition"
                      style={{
                        background: active ? EM.bgCardHover : "transparent",
                        borderBottom:
                          idx < results.length - 1 ? `1px solid ${EM.line}` : "none",
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => openPlatform(item)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-extrabold" style={{ color: EM.text }}>
                          {item.teacherName}
                        </p>
                        {item.displayName && item.displayName !== item.teacherName ? (
                          <p className="truncate text-[11px] font-semibold" style={{ color: EM.textSoft }}>
                            {item.displayName}
                          </p>
                        ) : null}
                        <p
                          className="mt-0.5 truncate text-[11px] font-medium dir-ltr"
                          style={{ color: EM.textMuted, direction: "ltr", textAlign: "right" }}
                        >
                          {host}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold text-white"
                        style={{ background: EM.blue }}
                      >
                        فتح المنصة
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
