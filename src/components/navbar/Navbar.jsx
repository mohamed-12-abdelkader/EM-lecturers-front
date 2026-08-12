import {
  Box,
  Flex,
  Button,
  useColorMode,
  useColorModeValue,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Icon,
  Portal,
  Image,
  Avatar,
  VStack,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FaMoon, FaSun, FaGlobe } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import NotificationDropdown from "../notifications/NotificationDropdown";
import Links from "../links/Links";
import logoImg from "../../img/2 (5).png";
import { getTenantSubdomain } from "../../utils/tenantHost";
import { fetchTenantPublic } from "../../api/tenantPublicApi";
import {
  readCachedTenantBrandLogo,
  resolveTenantBrandLogo,
} from "../../utils/tenantBrandLogo";
import { SHELL_DESKTOP_BP } from "../../theme/chakraTheme";
import {
  TOUR_CLOSE_MOBILE_NAV,
  TOUR_OPEN_MOBILE_NAV,
} from "../../utils/studentHomeTour";

const MARKETING_LINKS = [
  { label: "الرئيسية", href: "/", match: "home" },
  { label: "المميزات", href: "/#teacher-features" },
  { label: "الأسعار", href: "/#pricing" },
  { label: "من نحن", href: "/#about-service" },
  { label: "تواصل معنا", href: "/#contact" },
];

function BrandMark({ homeTo, tenantSubdomain, teacherLogo, brandName, logoRing }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showTenantLogo = Boolean(tenantSubdomain && teacherLogo && !logoFailed);

  useEffect(() => {
    setLogoFailed(false);
  }, [teacherLogo]);

  return (
    <Link to={homeTo}>
      <Flex align="center" gap={2} _hover={{ opacity: 0.92 }}>
        {showTenantLogo ? (
          <Image
            src={teacherLogo}
            alt={brandName}
            h="40px"
            w="40px"
            objectFit="contain"
            borderRadius="xl"
            border="1.5px solid"
            borderColor={logoRing}
            p={0.5}
            onError={() => setLogoFailed(true)}
            fallback={<Avatar name={brandName} size="sm" bg="blue.500" color="white" />}
          />
        ) : tenantSubdomain ? (
          <Avatar name={brandName} size="sm" bg="blue.500" color="white" />
        ) : (
          <img
            src={logoImg}
            alt="منصة"
            style={{ height: "40px", width: "auto", objectFit: "contain" }}
          />
        )}
      </Flex>
    </Link>
  );
}

function NavLinkItem({ item, active, onClick }) {
  const inactive = useColorModeValue("gray.700", "gray.200");
  const hover = useColorModeValue("blue.600", "blue.300");
  const isHash = item.href.includes("#");

  const shared = {
    position: "relative",
    px: 1,
    py: 1,
    fontSize: "sm",
    fontWeight: "700",
    color: active ? "blue.500" : inactive,
    _hover: { color: hover },
    onClick,
  };

  const underline = active ? (
    <Box
      position="absolute"
      left="18%"
      right="18%"
      bottom="-3px"
      h="2.5px"
      borderRadius="full"
      bg="blue.500"
    />
  ) : null;

  if (isHash) {
    return (
      <Box as="a" href={item.href} {...shared}>
        {item.label}
        {underline}
      </Box>
    );
  }

  return (
    <Box as={Link} to={item.href} {...shared}>
      {item.label}
      {underline}
    </Box>
  );
}

export default function Nav() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const showCompactChrome = useBreakpointValue({ base: true, lg: false });
  const showLoggedInMenu = useBreakpointValue({
    base: true,
    [SHELL_DESKTOP_BP]: false,
  });
  const location = useLocation();
  const tenantSubdomain = getTenantSubdomain();

  const [teacherLogo, setTeacherLogo] = useState(() =>
    tenantSubdomain ? readCachedTenantBrandLogo(tenantSubdomain) : null,
  );
  const [brandName, setBrandName] = useState(tenantSubdomain || "المنصة");
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    if (!tenantSubdomain) {
      setTeacherLogo(null);
      setBrandName("المنصة");
      return undefined;
    }

    const cached = readCachedTenantBrandLogo(tenantSubdomain);
    if (cached) setTeacherLogo(cached);

    let cancelled = false;
    fetchTenantPublic(tenantSubdomain)
      .then((res) => {
        if (cancelled) return;
        const tenant = res?.data?.tenant;
        const teacher = res?.data?.teacher;
        setTeacherLogo(resolveTenantBrandLogo(tenant, teacher));
        setBrandName(
          teacher?.name || tenant?.display_name || tenantSubdomain || "المنصة",
        );
      })
      .catch(() => {
        if (!cancelled) setBrandName(tenantSubdomain || "المنصة");
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSubdomain]);

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash || "");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [location.pathname]);

  useEffect(() => {
    const openForTour = () => onOpen();
    const closeForTour = () => onClose();
    window.addEventListener(TOUR_OPEN_MOBILE_NAV, openForTour);
    window.addEventListener(TOUR_CLOSE_MOBILE_NAV, closeForTour);
    return () => {
      window.removeEventListener(TOUR_OPEN_MOBILE_NAV, openForTour);
      window.removeEventListener(TOUR_CLOSE_MOBILE_NAV, closeForTour);
    };
  }, [onOpen, onClose]);

  const logoRing = useColorModeValue("blue.100", "blue.700");
  const pillBg = useColorModeValue(
    "rgba(248, 250, 252, 0.9)",
    "rgba(15, 23, 42, 0.85)",
  );
  const pillBorder = useColorModeValue(
    "rgba(148, 163, 184, 0.35)",
    "rgba(148, 163, 184, 0.22)",
  );
  const muted = useColorModeValue("gray.500", "gray.400");

  const activeKey = useMemo(() => {
    if (location.pathname === "/" && !activeHash) return "home";
    if (activeHash.includes("teacher-features")) return "المميزات";
    if (activeHash.includes("pricing")) return "الأسعار";
    if (activeHash.includes("about-service")) return "من نحن";
    if (activeHash.includes("contact")) return "تواصل معنا";
    return "";
  }, [location.pathname, activeHash]);

  const homeTo = user ? "/home" : "/";
  const showMarketingLinks = !user && !tenantSubdomain && !showCompactChrome;

  return (
    <Portal>
      <Box
        as="header"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1400}
        pt={{ base: 3, md: 4 }}
        px={{ base: 3, md: 5 }}
        pointerEvents="none"
        dir="rtl"
      >
        <Flex
          pointerEvents="auto"
          align="center"
          justify="space-between"
          gap={{ base: 2, md: 4 }}
          maxW="1200px"
          mx="auto"
          minH={{ base: "56px", md: "64px" }}
          px={{ base: 3, md: 5 }}
          py={{ base: 2, md: 2.5 }}
          borderRadius="full"
          border="1px solid"
          borderColor={pillBorder}
          bg={pillBg}
          boxShadow={
            colorMode === "light"
              ? "0 10px 40px -12px rgba(15, 23, 42, 0.18)"
              : "0 12px 40px -10px rgba(0, 0, 0, 0.55)"
          }
          style={{
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <BrandMark
            homeTo={homeTo}
            tenantSubdomain={tenantSubdomain}
            teacherLogo={teacherLogo}
            brandName={brandName}
            logoRing={logoRing}
          />

          {showMarketingLinks ? (
            <HStack as="nav" spacing={{ md: 4, lg: 6 }} flex="1" justify="center">
              {MARKETING_LINKS.map((item) => {
                const active =
                  item.match === "home"
                    ? activeKey === "home"
                    : activeKey === item.label;
                return (
                  <NavLinkItem key={item.label} item={item} active={active} />
                );
              })}
            </HStack>
          ) : (
            <Box flex="1" />
          )}

          <HStack spacing={{ base: 1.5, md: 2.5 }} flexShrink={0}>
            <IconButton
              aria-label={colorMode === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
              icon={<Icon as={colorMode === "light" ? FaMoon : FaSun} />}
              onClick={toggleColorMode}
              variant="ghost"
              color={muted}
              borderRadius="full"
              size="sm"
            />

            {!user && !showCompactChrome ? (
              <Button
                variant="ghost"
                size="sm"
                borderRadius="full"
                color={muted}
                fontWeight="600"
                leftIcon={<Icon as={FaGlobe} boxSize={3.5} />}
                display={{ base: "none", xl: "inline-flex" }}
                cursor="default"
                _hover={{ bg: "transparent", color: muted }}
              >
                English
              </Button>
            ) : null}

            {user ? (
              <>
                <NotificationDropdown />
                {showLoggedInMenu ? (
                  <Button
                    data-tour-id="student-mobile-nav-trigger"
                    onClick={onOpen}
                    variant="outline"
                    colorScheme="blue"
                    size="sm"
                    borderRadius="full"
                    px={3}
                  >
                    ☰
                  </Button>
                ) : null}
              </>
            ) : showCompactChrome ? (
              <Button
                onClick={onOpen}
                variant="outline"
                colorScheme="blue"
                size="sm"
                borderRadius="full"
                px={3}
              >
                ☰
              </Button>
            ) : (
              <Button
                as={Link}
                to="/create-platform"
                colorScheme="blue"
                size="sm"
                borderRadius="full"
                fontWeight="800"
                px={5}
                boxShadow="0 8px 22px -8px rgba(37, 99, 235, 0.65)"
              >
                ابدأ مجاناً
              </Button>
            )}
          </HStack>
        </Flex>

        <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent dir="rtl" data-tour-id="student-mobile-nav-drawer">
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" pt={10}>
              {user
                ? `مرحباً: ${user.name || `${user.fname || ""} ${user.lname || ""}`}`
                : "القائمة"}
            </DrawerHeader>
            <DrawerBody>
              {user ? (
                <Links isSidebarOpen={true} onClose={onClose} />
              ) : (
                <VStack align="stretch" spacing={4} mt={2}>
                  {MARKETING_LINKS.map((item) => (
                    <NavLinkItem
                      key={item.label}
                      item={item}
                      active={false}
                      onClick={onClose}
                    />
                  ))}
                  <Button
                    as={Link}
                    to="/login"
                    variant="outline"
                    colorScheme="blue"
                    borderRadius="full"
                    onClick={onClose}
                  >
                    تسجيل الدخول
                  </Button>
                  <Button
                    as={Link}
                    to="/create-platform"
                    colorScheme="blue"
                    borderRadius="full"
                    fontWeight="800"
                    onClick={onClose}
                  >
                    ابدأ مجاناً
                  </Button>
                </VStack>
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    </Portal>
  );
}
