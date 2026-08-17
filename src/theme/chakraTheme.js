import { extendTheme } from "@chakra-ui/react";

/**
 * Bottom nav: phones only (below md / 768px).
 * Shell sidebar starts at 2xl — tablets use top navbar drawer between md and 2xl.
 */
export const BOTTOM_NAV_MAX_BP = "md";
/** CSS min-width matching SHELL_DESKTOP_BP (Chakra 2xl = 1536px) */
export const SHELL_DESKTOP_MIN_PX = "1536px";

/**
 * Shell layout (sidebar + desktop nav) starts at 2xl (1536px).
 * 10.4" tablets (~1000–1366 CSS px) use top navbar drawer only (no bottom nav).
 */
export const SHELL_DESKTOP_BP = "2xl";

/**
 * ثيم Chakra بالعربية واتجاه RTL ثابت — لا يتبع لغة الجهاز.
 */
const theme = extendTheme({
  direction: "rtl",
  locale: "ar",
  fonts: {
    heading: `'Changa', 'Noto Naskh Arabic', 'Noto Sans Arabic', Tahoma, sans-serif`,
    body: `'Changa', 'Noto Sans Arabic', Tahoma, sans-serif`,
  },
  styles: {
    global: {
      "html, body": {
        direction: "rtl",
        lang: "ar",
      },
      "#root": {
        direction: "rtl",
        minHeight: "100%",
      },
    },
  },
});

export default theme;
