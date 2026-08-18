import { purgeLegacyAuthKeys } from "./utils/tenantAuthStorage";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ChakraProvider, useColorMode, Box } from "@chakra-ui/react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import SidebarWithHeader from "./components/navbar/Navbar.jsx";
import BottomNavItems from "./components/Footer/BottomNavItems.jsx";
import UserType from "./Hooks/auth/userType.js";
import { getTenantSubdomain } from "./utils/tenantHost.js";
import { NotificationProvider } from "./context/NotificationProvider.jsx";
import { forceArabicDocumentLocale } from "./utils/forceArabicLocale.js";
import theme, { BOTTOM_NAV_MAX_BP } from "./theme/chakraTheme.js";
import SessionExpiredModal from "./components/auth/SessionExpiredModal.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import AuthProvider from "./providers/AuthProvider.jsx";
import SessionProvider from "./providers/SessionProvider.jsx";
import AxiosProvider from "./providers/AxiosProvider.jsx";
import OfflineScreen from "./components/network/OfflineScreen.jsx";
import InstallAppPrompt from "./components/pwa/InstallAppPrompt.jsx";
import BrandLoadingOverlayHost from "./components/loading/BrandLoadingOverlayHost.jsx";
import { initPWA } from "./pwa/registerPWA.js";
import { registerChunkLoadRecovery } from "./utils/chunkLoadRecovery.js";

// فرض العربية قبل أي رندر — مستقل عن لغة الجهاز
forceArabicDocumentLocale();
purgeLegacyAuthKeys();

// PWA: تسجيل الـ Service Worker + كشف الإصدارات الجديدة (إنتاج فقط)
initPWA();
registerChunkLoadRecovery();

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
      <Box pb={showStudentBottomNav ? { base: "76px", [BOTTOM_NAV_MAX_BP]: 0 } : 0} dir="rtl" lang="ar">
        <App />
      </Box>
      {showStudentBottomNav ? <BottomNavItems /> : null}
      <SessionExpiredModal />
      <OfflineScreen />
      <InstallAppPrompt />
      <BrandLoadingOverlayHost />
    </NotificationProvider>
  );
};

const Root = () => (
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Router>
        <AppErrorBoundary>
          <AuthProvider>
            <SessionProvider>
              <AxiosProvider>
                <RootContent />
              </AxiosProvider>
            </SessionProvider>
          </AuthProvider>
        </AppErrorBoundary>
      </Router>
    </ChakraProvider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
