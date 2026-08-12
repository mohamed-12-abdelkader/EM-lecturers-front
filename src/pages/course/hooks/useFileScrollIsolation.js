import { useEffect } from "react";

/**
 * يمنع تمرير الصفحة/الـ body ويسمح بالتمرير فقط داخل منطقة الملف.
 */
export default function useFileScrollIsolation(viewerRef, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const isInsideFileScroller = (target) => {
      if (!target) return false;
      if (target.tagName === "IFRAME") return true;
      return Boolean(target.closest?.('[data-file-scroll="true"]'));
    };

    const blockIfOutside = (event) => {
      if (isInsideFileScroller(event.target)) return;
      event.preventDefault();
    };

    window.addEventListener("wheel", blockIfOutside, { passive: false });
    window.addEventListener("touchmove", blockIfOutside, { passive: false });

    return () => {
      window.removeEventListener("wheel", blockIfOutside);
      window.removeEventListener("touchmove", blockIfOutside);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const node = viewerRef.current;
    if (!node) return undefined;

    const focusIframe = (event) => {
      const iframe = node.querySelector("iframe");
      if (iframe && (event.target === iframe || iframe.contains?.(event.target))) {
        iframe.focus();
      }
    };

    node.addEventListener("pointerdown", focusIframe);
    return () => node.removeEventListener("pointerdown", focusIframe);
  }, [enabled, viewerRef]);
}
