import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ChakraProvider, useColorMode, Box } from "@chakra-ui/react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import WhatsButton from "./components/whatsButton/WhatsButton.jsx";
import SidebarWithHeader from "./components/navbar/Navbar.jsx";
import BottomNavItems from "./components/Footer/BottomNavItems.jsx";
import UserType from "./Hooks/auth/userType.js";
import { getTenantSubdomain } from "./utils/tenantHost.js";
import { NotificationProvider } from "./context/NotificationProvider.jsx";
import { forceArabicDocumentLocale } from "./utils/forceArabicLocale.js";
import theme from "./theme/chakraTheme.js";

// فرض العربية قبل أي رندر — مستقل عن لغة الجهاز
forceArabicDocumentLocale();

// Sync Chakra color mode to data-theme + class "dark" for Tailwind dark: classes
const SyncTheme = () => {
  const { colorMode } = useColorMode();
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorMode);
    if (colorMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [colorMode]);
  return null;
};

const ForceArabicLocale = () => {
  useEffect(() => {
    forceArabicDocumentLocale();
  }, []);
  return null;
};

const RootContent = () => {
  const location = useLocation();
  const [userData, isAdmin, isTeacher, student] = UserType();
  const tenantSubdomain = getTenantSubdomain();

  const showSidebarForTenantUser =
    Boolean(tenantSubdomain) && (Boolean(student) || Boolean(isTeacher));
  const showSidebar =
    (!tenantSubdomain || showSidebarForTenantUser) &&
    location.pathname !== "/landing" &&
    !location.pathname.startsWith("/video/");
  const hasUser = Boolean(userData);
  const path = location.pathname.toLowerCase();
  const hideStudentBottomNav =
    path === "/landing" ||
    path === "/login" ||
    path === "/signup" ||
    path === "/teacherchat" ||
    path.startsWith("/video/") ||
    path.startsWith("/exam/") ||
    path.startsWith("/essay-exam/");
  const showStudentBottomNav = Boolean(student) && hasUser && !hideStudentBottomNav;

  return (
    <NotificationProvider>
      <ForceArabicLocale />
      <SyncTheme />
      {showSidebar && <SidebarWithHeader />}
      <Box pb={showStudentBottomNav ? { base: "76px", lg: 0 } : 0} dir="rtl" lang="ar">
        <App />
      </Box>
      {showStudentBottomNav ? <BottomNavItems /> : null}
      {!tenantSubdomain && <WhatsButton />}
    </NotificationProvider>
  );
};

const Root = () => (
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Router>
        <RootContent />
      </Router>
    </ChakraProvider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
