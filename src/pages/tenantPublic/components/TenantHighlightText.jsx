/** Highlight matching query tokens in Arabic/Latin text. */
export default function TenantHighlightText({ text, query, className = "" }) {
  const value = String(text ?? "");
  const q = String(query ?? "").trim();
  if (!q || !value) return <span className={className}>{value}</span>;

  const tokens = q.split(/\s+/).filter(Boolean);
  const pattern = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  if (!pattern) return <span className={className}>{value}</span>;

  const parts = value.split(new RegExp(`(${pattern})`, "gi"));
  return (
    <span className={className}>
      {parts.map((part, i) =>
        tokens.some((t) => part.toLowerCase() === t.toLowerCase()) ? (
          <mark
            key={i}
            className="rounded bg-yellow-200/80 px-0.5 text-inherit dark:bg-yellow-500/30"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
