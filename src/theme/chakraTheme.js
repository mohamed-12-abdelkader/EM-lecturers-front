import { extendTheme } from "@chakra-ui/react";

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
