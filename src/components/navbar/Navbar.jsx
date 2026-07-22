import {
  Box,
  Flex,
  Button,
  Stack,
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
  HStack,
  Icon,
  Portal,
  Image,
  Avatar,
} from "@chakra-ui/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

import { FaMoon, FaSun } from "react-icons/fa";
import { Link } from "react-router-dom";
import NotificationDropdown from "../notifications/NotificationDropdown";

import Links from "../links/Links";
import logoImg from "../../img/2 (5).png";
import { getTenantSubdomain } from "../../utils/tenantHost";
import { fetchTenantPublic } from "../../api/tenantPublicApi";
import {
  readCachedTenantBrandLogo,
  resolveTenantBrandLogo,
} from "../../utils/tenantBrandLogo";

export default function Nav() {
  const user = JSON.parse(localStorage.getItem("user"));
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const tenantSubdomain = getTenantSubdomain();

  const [teacherLogo, setTeacherLogo] = useState(() =>
    tenantSubdomain ? readCachedTenantBrandLogo(tenantSubdomain) : null,
  );
  const [brandName, setBrandName] = useState(
    tenantSubdomain || "Edu Platform",
  );

  // Navbar is outside QueryClientProvider (main.jsx) — fetch without useQuery
  useEffect(() => {
    if (!tenantSubdomain) {
      setTeacherLogo(null);
      setBrandName("Edu Platform");
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
          teacher?.name || tenant?.display_name || tenantSubdomain || "Edu Platform",
        );
      })
      .catch(() => {
        if (!cancelled) {
          setBrandName(tenantSubdomain || "Edu Platform");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSubdomain]);

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const handleDrawerOpen = () => {
    if (!isOpen) {
      onOpen();
    }
  };

  const navBg = useColorModeValue("white", "gray.800");
  const navBorder = useColorModeValue("blue.100", "gray.700");
  const navShadow = useColorModeValue(
    "0 2px 12px rgba(66, 153, 225, 0.08)",
    "0 2px 12px rgba(0,0,0,0.25)",
  );
  const logoRing = useColorModeValue("blue.100", "blue.800");

  return (
    <Portal>
      <Box
        as="header"
        bg={navBg}
        px={4}
        position="fixed"
        top={0}
        left={0}
        right={0}
        width="100%"
        height="72px"
        zIndex={1400}
        style={{ direction: "ltr" }}
        borderBottomWidth="2px"
        borderBottomColor={navBorder}
        boxShadow={navShadow}
        sx={{
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      >
        <Box h="1" w="full" position="absolute" top={0} left={0} right={0} bgGradient="linear(to-r, blue.500, orange.500)" />
        <Flex
          h="full"
          alignItems="center"
          justifyContent="space-between"
          w="100%"
          maxW={{ base: "100%", lg: "container.xl" }}
          mx={{ base: 0, lg: "auto" }}
          gap={3}
          position="relative"
          zIndex={1}
        >
          <Link to={user ? `/home` : "/"}>
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              _hover={{ opacity: 0.92 }}
            >
              {tenantSubdomain && teacherLogo ? (
                <Image
                  src={teacherLogo}
                  alt={brandName}
                  h="48px"
                  w="48px"
                  objectFit="contain"
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={logoRing}
                  p={0.5}
                  fallback={
                    <Avatar name={brandName} size="md" bg="blue.500" color="white" />
                  }
                />
              ) : tenantSubdomain ? (
                <Avatar name={brandName} size="md" bg="blue.500" color="white" />
              ) : (
                <img
                  src={logoImg}
                  alt="Edu Platform"
                  style={{ height: "48px", width: "auto", objectFit: "contain" }}
                />
              )}
            </Box>
          </Link>

          <Flex alignItems="center" gap={2}>
            <Stack direction="row" spacing={2} align="center">
              <Button
                size="sm"
                onClick={toggleColorMode}
                variant="ghost"
                colorScheme="blue"
                leftIcon={
                  colorMode === "light" ? (
                    <Icon as={FaMoon} boxSize={4} />
                  ) : (
                    <Icon as={FaSun} boxSize={4} />
                  )
                }
                aria-label={colorMode === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
              />

              {user ? (
                <>
                  <NotificationDropdown />

                  {isMobile && (
                    <Button
                      onClick={handleDrawerOpen}
                      variant="outline"
                      colorScheme="blue"
                      size="sm"
                      borderRadius="lg"
                    >
                      ☰
                    </Button>
                  )}

                  <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
                    <DrawerOverlay />
                    <DrawerContent>
                      <DrawerHeader className="flex">
                        <DrawerCloseButton className="" dir="ltr" />
                        <h1 className="mt-5">
                          مرحباً: {user.name || `${user.fname} ${user.lname}`}
                        </h1>
                      </DrawerHeader>
                      <DrawerBody>
                        <Links isSidebarOpen={true} onClose={onClose} />
                        {/* إرسال onClose إلى Links */}
                      </DrawerBody>
                    </DrawerContent>
                  </Drawer>
                </>
              ) : (
                <HStack spacing={3}>
                  <Button as={Link} to="/login" colorScheme="blue" size="sm" fontWeight="bold" borderRadius="xl">
                    تسجيل الدخول
                  </Button>
                  <Button as={Link} to="/welcome" colorScheme="orange" size="sm" fontWeight="bold" borderRadius="xl">
                    إنشاء حساب
                  </Button>
                </HStack>
              )}
            </Stack>
          </Flex>
        </Flex>

        {/* شريط تقدم التمرير — داخل النافبار لتجنب طبقات fixed متعددة */}
        <motion.div
          style={{
            scaleX,
            position: "absolute",
            left: 0,
            bottom: 0,
            height: 3,
            width: "100%",
            background: "linear-gradient(to right, #3182CE, #ED8936)",
            transformOrigin: "left",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      </Box>
    </Portal>
  );
}
