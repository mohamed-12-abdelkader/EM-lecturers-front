import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaClock, FaFire, FaSearch, FaStar, FaTimes } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "../../../Hooks/tenantPublic/useDebounce";
import {
  fetchGlobalSearch,
  fetchGlobalSearchSuggestions,
  fetchGlobalSearchTrending,
  fetchPopularCourses,
  fetchPopularTeachers,
} from "../../../api/seoPublicApi";
import { fetchTenantSearch } from "../../../api/tenantPublicApi";
import TenantHighlightText from "./TenantHighlightText";

const RECENT_KEY = "tenant-search-recent";
const MAX_RECENT = 8;

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(query) {
  const q = String(query || "").trim();
  if (!q) return;
  const list = [q, ...loadRecent().filter((x) => x !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

function groupResults(items = []) {
  const teachers = [];
  const courses = [];
  const subjects = new Set();
  const lessons = [];

  items.forEach((item) => {
    if (item.type === "teacher") teachers.push(item);
    else if (item.type === "course") {
      courses.push(item);
      if (item.subject) subjects.add(item.subject);
      if (item.grade) subjects.add(item.grade);
    }
  });

  return {
    teachers,
    courses,
    subjects: [...subjects],
    lessons,
    total: items.length,
  };
}

/**
 * Smart search bar: autocomplete, suggestions, recent, trending, live results.
 */
export default function TenantSearchBar({
  subdomain,
  variant = "inline",
  placeholder = "ابحث عن مدرس، كورس، مادة...",
  onResults,
  autoNavigate = true,
  searchPath = subdomain ? "/search" : "/search",
}) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(loadRecent);
  const debounced = useDebounce(query, 280);
  const isTenant = Boolean(subdomain);

  const { data: suggestionsData } = useQuery({
    queryKey: ["search-suggestions", subdomain, debounced],
    queryFn: () =>
      isTenant
        ? fetchTenantSearch(subdomain, { q: debounced, limit: 8 }).then((r) => ({
            data: {
              suggestions: (r?.data?.items || []).map((i) => i.title),
            },
          }))
        : fetchGlobalSearchSuggestions(debounced),
    enabled: open && debounced.length >= 2,
    staleTime: 60_000,
  });

  const { data: liveData, isFetching } = useQuery({
    queryKey: ["search-live", subdomain, debounced],
    queryFn: () =>
      isTenant
        ? fetchTenantSearch(subdomain, { q: debounced, limit: 12 })
        : fetchGlobalSearch({ q: debounced, limit: 12 }),
    enabled: open && debounced.length >= 2,
    staleTime: 30_000,
  });

  const { data: trendingData } = useQuery({
    queryKey: ["search-trending", subdomain],
    queryFn: () => fetchGlobalSearchTrending(),
    enabled: open && !debounced,
    staleTime: 300_000,
  });

  const { data: popularTeachers } = useQuery({
    queryKey: ["popular-teachers"],
    queryFn: () => fetchPopularTeachers(6),
    enabled: open && !debounced && !isTenant,
    staleTime: 300_000,
  });

  const { data: popularCourses } = useQuery({
    queryKey: ["popular-courses", subdomain],
    queryFn: () => fetchPopularCourses(6),
    enabled: open && !debounced,
    staleTime: 300_000,
  });

  const suggestions = suggestionsData?.data?.suggestions || [];
  const liveItems = liveData?.data?.items || [];
  const grouped = groupResults(liveItems);

  useEffect(() => {
    if (onResults && debounced.length >= 2) onResults(grouped, debounced);
  }, [liveData, debounced, onResults]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const goSearch = useCallback(
    (q) => {
      const term = String(q || "").trim();
      if (!term) return;
      saveRecent(term);
      setRecent(loadRecent());
      setOpen(false);
      if (autoNavigate) {
        navigate(`${searchPath}?q=${encodeURIComponent(term)}`);
      }
    },
    [autoNavigate, navigate, searchPath],
  );

  const onSubmit = (e) => {
    e.preventDefault();
    goSearch(query);
  };

  const panelClass =
    variant === "hero"
      ? "w-full max-w-2xl"
      : "relative w-full max-w-md";

  return (
    <div ref={wrapperRef} className={panelClass}>
      <form onSubmit={onSubmit} role="search">
        <label htmlFor={inputId} className="sr-only">
          {placeholder}
        </label>
        <div className="relative flex items-center">
          <FaSearch
            className="pointer-events-none absolute right-4 text-slate-400"
            aria-hidden
          />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute left-3 text-slate-400 hover:text-slate-600"
              aria-label="مسح البحث"
            >
              <FaTimes />
            </button>
          ) : null}
        </div>
      </form>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-[min(70vh,28rem)] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          {debounced.length >= 2 ? (
            <>
              {isFetching ? (
                <p className="px-4 py-2 text-xs text-slate-500">جاري البحث...</p>
              ) : null}
              {grouped.teachers.length > 0 ? (
                <Section title="المدرسون">
                  {grouped.teachers.map((item) => (
                    <ResultRow
                      key={`t-${item.id}`}
                      item={item}
                      query={debounced}
                      onPick={() => {
                        if (item.public_url) window.location.href = item.public_url;
                        else goSearch(item.title);
                      }}
                    />
                  ))}
                </Section>
              ) : null}
              {grouped.courses.length > 0 ? (
                <Section title="الكورسات">
                  {grouped.courses.map((item) => (
                    <ResultRow
                      key={`c-${item.id}`}
                      item={item}
                      query={debounced}
                      onPick={() => {
                        if (item.public_url) window.location.href = item.public_url;
                        else goSearch(item.title);
                      }}
                    />
                  ))}
                </Section>
              ) : null}
              {grouped.subjects.length > 0 ? (
                <Section title="المواد">
                  {grouped.subjects.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="option"
                      className="flex w-full items-center gap-2 px-4 py-2 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => goSearch(s)}
                    >
                      <TenantHighlightText text={s} query={debounced} />
                    </button>
                  ))}
                </Section>
              ) : null}
              {!isFetching && liveItems.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">لا توجد نتائج مطابقة</p>
              ) : null}
            </>
          ) : (
            <>
              {suggestions.length > 0 ? (
                <Section title="اقتراحات">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full px-4 py-2 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => goSearch(s)}
                    >
                      {s}
                    </button>
                  ))}
                </Section>
              ) : null}
              {recent.length > 0 ? (
                <Section title="عمليات بحث سابقة" icon={FaClock}>
                  {recent.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full px-4 py-2 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => goSearch(s)}
                    >
                      {s}
                    </button>
                  ))}
                </Section>
              ) : null}
              {(trendingData?.data?.trending || []).length > 0 ? (
                <Section title="الأكثر بحثاً" icon={FaFire}>
                  {trendingData.data.trending.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full px-4 py-2 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => goSearch(s)}
                    >
                      {s}
                    </button>
                  ))}
                </Section>
              ) : null}
              {(popularTeachers?.data?.teachers || []).length > 0 ? (
                <Section title="مدرسون رائجون" icon={FaStar}>
                  {popularTeachers.data.teachers.map((item) => (
                    <ResultRow
                      key={item.id}
                      item={item}
                      onPick={() => {
                        if (item.public_url) window.location.href = item.public_url;
                      }}
                    />
                  ))}
                </Section>
              ) : null}
              {(popularCourses?.data?.courses || []).length > 0 ? (
                <Section title="كورسات رائجة" icon={FaFire}>
                  {popularCourses.data.courses.map((item) => (
                    <ResultRow
                      key={item.id}
                      item={item}
                      onPick={() => {
                        if (item.public_url) window.location.href = item.public_url;
                      }}
                    />
                  ))}
                </Section>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="border-b border-slate-100 last:border-0 dark:border-slate-800">
      <p className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500">
        {Icon ? <Icon className="text-orange-500" aria-hidden /> : null}
        {title}
      </p>
      {children}
    </div>
  );
}

function ResultRow({ item, query, onPick }) {
  return (
    <button
      type="button"
      role="option"
      className="flex w-full items-center gap-3 px-4 py-2 text-right transition hover:bg-slate-50 dark:hover:bg-slate-800"
      onClick={onPick}
    >
      {item.avatar ? (
        <img
          src={item.avatar}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm dark:bg-blue-900/50">
          {item.type === "course" ? "📘" : "👨‍🏫"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {query ? <TenantHighlightText text={item.title} query={query} /> : item.title}
        </p>
        {item.subtitle ? (
          <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
        ) : null}
      </div>
    </button>
  );
}
