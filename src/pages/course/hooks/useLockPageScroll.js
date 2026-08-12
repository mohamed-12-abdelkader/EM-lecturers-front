import { useEffect } from "react";

/** يمنع تمرير الصفحة الرئيسية — التمرير يكون داخل عارض الملف فقط */
export default function useLockPageScroll(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return undefined;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      rootOverflow: root?.style.overflow ?? "",
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.position = "fixed";
    body.style.width = "100%";
    if (root) root.style.overflow = "hidden";

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.height = previous.bodyHeight;
      body.style.position = previous.bodyPosition;
      body.style.width = previous.bodyWidth;
      if (root) root.style.overflow = previous.rootOverflow;
    };
  }, [enabled]);
}
