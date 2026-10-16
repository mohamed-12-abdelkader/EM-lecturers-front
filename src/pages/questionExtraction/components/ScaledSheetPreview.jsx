import { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@chakra-ui/react";

const SHEET_W = 1120;
const SHEET_H = 792;

/**
 * يعرض صفحة الإطار كاملة داخل عرض الشاشة عبر scale (خصوصًا الموبايل).
 */
export default function ScaledSheetPreview({ children, bg, borderColor }) {
  const outerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const el = outerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (!width) return;
    const next = Math.min(1, width / SHEET_W);
    setScale(next > 0 ? next : 1);
  }, []);

  useEffect(() => {
    measure();
    const el = outerRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <Box
      ref={outerRef}
      w="100%"
      overflow="hidden"
      borderRadius="2xl"
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      p={{ base: 1.5, md: 3 }}
    >
      <Box
        w="100%"
        h={`${SHEET_H * scale}px`}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left="50%"
          w={`${SHEET_W}px`}
          transform={`translateX(-50%) scale(${scale})`}
          transformOrigin="top center"
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
