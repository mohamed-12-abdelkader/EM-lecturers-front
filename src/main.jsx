import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ChakraProvider, useBreakpointValue, useColorMode, Box } from "@chakra-ui/react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import Footer from "./components/Footer/Footer.jsx";
import "react-toastify/dist/ReactToastify.css";
import WhatsButton from "./components/whatsButton/WhatsButton.jsx";
import SidebarWithHeader from "./components/navbar/Navbar.jsx";
import BottomNavItems from "./components/Footer/BottomNavItems.jsx";
import UserType from "./Hooks/auth/userType.js";
import { getTenantSubdomain } from "./utils/tenantHost.js";
import { NotificationProvider } from "./context/NotificationProvider.jsx";

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

const RootContent = () => {
  // Get the current location to determine the current path
  const location = useLocation();
  const [userData, isAdmin, isTeacher, student] = UserType();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const tenantSubdomain = getTenantSubdomain();

  useEffect(() => {
    const overlay = document.getElementById("overlay");

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        overlay.style.display = "block";
      } else {
        overlay.style.display = "none";
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Only display the SidebarWithHeader if the current path is not '/landing' or '/video'
  const hideSidebarOnMobileSupportChat = Boolean(isMobile) && location.pathname === "/support-chat";
  // على سابدومين المستأجر: إظهار النافبار للطالب والمدرس في كل الصفحات
  const showSidebarForTenantUser =
    Boolean(tenantSubdomain) && (Boolean(student) || Boolean(isTeacher));
  const showSidebar =
    (!tenantSubdomain || showSidebarForTenantUser) &&
    !hideSidebarOnMobileSupportChat &&
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
      <SyncTheme />
      <div id="overlay" className="overlay"></div>
      {showSidebar && <SidebarWithHeader />}
      <Box pb={showStudentBottomNav ? { base: "76px", lg: 0 } : 0}>
        <App />
      </Box>
      {showStudentBottomNav ? <BottomNavItems /> : null}
      {!tenantSubdomain && <WhatsButton />}
    </NotificationProvider>
  );
};

const Root = () => (
  <React.StrictMode>
    <ChakraProvider>
      <Router>
        <RootContent />
      </Router>
    </ChakraProvider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
