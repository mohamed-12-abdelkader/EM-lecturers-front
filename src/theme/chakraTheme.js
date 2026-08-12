import { extendTheme } from "@chakra-ui/react";

/**
 * Shell layout (sidebar + desktop nav) starts at 2xl (1536px).
 * 10.4" tablets (~1000–1366 CSS px) stay in mobile mode: no sidebar, navbar drawer + bottom nav.
 */
export const SHELL_DESKTOP_BP = "2xl";
/** CSS min-width matching SHELL_DESKTOP_BP (Chakra 2xl = 1536px) */
export const SHELL_DESKTOP_MIN_PX = "1536px";

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
