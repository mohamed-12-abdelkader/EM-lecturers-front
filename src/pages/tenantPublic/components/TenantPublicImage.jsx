import { useEffect, useRef, useState } from "react";

/**
 * Lazy-loaded image with aspect-ratio placeholder to reduce CLS.
 * Uses native loading="lazy" + decoding="async" for LCP optimization on hero via priority prop.
 */
export default function TenantPublicImage({
  src,
  alt = "",
  className = "",
  aspectClass = "aspect-[16/10]",
  priority = false,
  objectFit = "cover",
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority && imgRef.current?.complete) setLoaded(true);
  }, [priority, src]);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 ${aspectClass} ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-3xl" aria-hidden>
          📚
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
      {!loaded ? (
        <div
          className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700"
          aria-hidden
        />
      ) : null}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`h-full w-full transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ objectFit }}
      />
    </div>
  );
}
