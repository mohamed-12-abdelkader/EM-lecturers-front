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
} from "@chakra-ui/react";
import { motion, useScroll, useTransform } from "framer-motion";

import { FaMoon, FaSun } from "react-icons/fa";
import { Link } from "react-router-dom";
import NotificationDropdown from "../notifications/NotificationDropdown";

import Links from "../links/Links";

export default function Nav() {
  const user = JSON.parse(localStorage.getItem("user"));
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const handleDrawerOpen = () => {
    if (!isOpen) {
      onOpen();
    }
  };

  const navBg = useColorModeValue("white", "gray.800");
  const navBorder = useColorModeValue("blue.100", "gray.700");

  return (
    <>
      <Box
        bg={navBg}
        px={4}
        position="fixed"
        top={0}
        left={0}
        width="100%"
        height="72px"
        zIndex={1000}
        style={{ direction: "ltr" }}
        borderBottomWidth="2px"
        borderBottomColor={navBorder}
        boxShadow={useColorModeValue("0 2px 12px rgba(66, 153, 225, 0.08)", "0 2px 12px rgba(0,0,0,0.2)")}
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
        >
          <Link to={user ? `/home` : "/"}>
            <Box display="flex" alignItems="center" _hover={{ opacity: 0.9 }}>
              <img src={"2 (5).png"} alt="Next Edu School" style={{ height: "160px", width: "auto" }} />
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
      </Box>
      {/* شريط تقدم التمرير */}
      <motion.div
        style={{
          scaleX,
          position: "fixed",
          left: 0,
          top: 72,
          height: 4,
          width: "100%",
          background: "linear-gradient(to right, #3182CE, #ED8936)",
          transformOrigin: "left",
          zIndex: 999,
        }}
      />
    </>
  );
}
