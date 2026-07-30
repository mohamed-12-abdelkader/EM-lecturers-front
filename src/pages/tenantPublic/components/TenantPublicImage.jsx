import { useEffect, useRef, useState } from "react";
import { getBlurPlaceholderUrl } from "../../../utils/highQualityImageUrl";

/**
 * Fast-appearing image: optional tiny blur LQIP, skeleton, shows as soon as decoded.
 * priority → eager + high fetchpriority (LCP / hero).
 */
export default function TenantPublicImage({
  src,
  alt = "",
  className = "",
  aspectClass = "aspect-[16/10]",
  priority = false,
  objectFit = "cover",
  objectPosition = "center",
  sizes,
  srcSet,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const blurSrc = src ? getBlurPlaceholderUrl(src) : null;

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-[#12263F] text-white/30 ${aspectClass} ${className}`}
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
    <div className={`relative overflow-hidden bg-[#12263F] ${aspectClass} ${className}`}>
      {blurSrc ? (
        <img
          src={blurSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110"
          style={{ objectFit, objectPosition, filter: "blur(12px)" }}
          loading="eager"
          decoding="async"
        />
      ) : !loaded ? (
        <div className="absolute inset-0 animate-pulse bg-white/10" aria-hidden />
      ) : null}
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchpriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`relative z-[1] h-full w-full transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ objectFit, objectPosition }}
      />
    </div>
  );
}
