import React, { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  Box,
  Flex,
  useColorModeValue,
  Text,
  Button,
  Avatar,
  VStack,
  Badge,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { FaAndroid } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import Links from "../../components/links/Links";
import { getRoleLabel } from "../../utils/authRoles";
import UserType from "../../Hooks/auth/userType";
import { SHELL_DESKTOP_BP } from "../../theme/chakraTheme";

const BRAND_BLUE = "#3182CE";
const BRAND_BLUE_DARK = "#2B6CB0";
const BRAND_ORANGE = "#DD6B20";

function getUserDisplayName(user) {
  if (!user) return "مستخدم";
  if (user.name?.trim()) return user.name.trim();
  const full = [user.fname, user.lname].filter(Boolean).join(" ").trim();
  return full || "مستخدم";
}

function getRoleMeta(user, isAdmin, isTeacher, isAcademy, isAcademyTeacher) {
  if (isAdmin) return { label: "مشرف النظام" };
  if (isAcademy) return { label: "مالك أكاديمية" };
  if (isAcademyTeacher) return { label: "مدرس أكاديمية" };
  if (isTeacher) return { label: "مدرس" };
  return { label: getRoleLabel(user?.role) || "طالب" };
}

function SidebarBrandHeader() {
  return (
    <Box px={4} pt={5} pb={3} flexShrink={0}>
      <HStack spacing={3} align="center">
        <Flex
          w="42px"
          h="42px"
          borderRadius="14px"
          align="center"
          justify="center"
          bgGradient={`linear(135deg, ${BRAND_BLUE}, ${BRAND_BLUE_DARK})`}
          color="white"
          fontWeight="black"
          fontSize="sm"
          boxShadow="0 10px 24px rgba(49,130,206,0.35)"
        >
          EM
        </Flex>
        <Box minW={0}>
          <Text fontSize="md" fontWeight="extrabold" color="gray.900" letterSpacing="-0.02em" _dark={{ color: "white" }}>
            EM Academy
          </Text>
          <Text fontSize="11px" fontWeight="medium" color="gray.500">
            منصة التعلم الذكية
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}

function SidebarUserCard({ user, isAdmin, isTeacher, isAcademy, isAcademyTeacher }) {
  const role = getRoleMeta(user, isAdmin, isTeacher, isAcademy, isAcademyTeacher);
  const displayName = getUserDisplayName(user);

  return (
    <Box mx={3} mb={3} flexShrink={0}>
      <Box
        position="relative"
        overflow="hidden"
        borderRadius="2xl"
        p={3.5}
        bgGradient={`linear(135deg, ${BRAND_BLUE} 0%, ${BRAND_BLUE_DARK} 55%, #1A365D 100%)`}
        color="white"
        boxShadow="0 14px 32px rgba(49,130,206,0.28)"
      >
        <Box
          position="absolute"
          top="-18px"
          left="-12px"
          w="90px"
          h="90px"
          borderRadius="full"
          bg="whiteAlpha.200"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-28px"
          right="-20px"
          w="110px"
          h="110px"
          borderRadius="full"
          bg={`${BRAND_ORANGE}33`}
          pointerEvents="none"
        />

        <HStack spacing={3} align="center" position="relative" zIndex={1}>
          <Avatar
            size="md"
            name={displayName}
            bg={BRAND_ORANGE}
            color="white"
            fontWeight="bold"
            borderWidth="2px"
            borderColor="whiteAlpha.700"
          />
          <VStack align="start" spacing={1} flex={1} minW={0}>
            <Text fontSize="sm" fontWeight="extrabold" noOfLines={1}>
              {displayName}
            </Text>
            {user?.email ? (
              <Text fontSize="11px" color="whiteAlpha.800" noOfLines={1}>
                {user.email}
              </Text>
            ) : null}
            <Badge
              bg="whiteAlpha.200"
              color="white"
              borderRadius="full"
              px={2}
              py={0.5}
              fontSize="10px"
              fontWeight="bold"
              display="inline-flex"
              alignItems="center"
              gap={1}
              border="1px solid"
              borderColor="whiteAlpha.300"
            >
              <Icon as={MdVerified} boxSize={3} color="orange.200" />
              {role.label}
            </Badge>
          </VStack>
        </HStack>
      </Box>
    </Box>
  );
}

const HomeLogin = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);
  const [, isAdmin, isTeacher, student, isAcademy, isAcademyTeacher] = UserType();
  const location = useLocation();

  const sidebarBg = useColorModeValue("#F8FAFC", "gray.900");
  const sidebarBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const mainBg = useColorModeValue("gray.50", "gray.900");
  const scrollbarThumb = useColorModeValue("blackAlpha.200", "whiteAlpha.300");
  const panelBg = useColorModeValue("white", "gray.800");
  const pagePanel = useColorModeValue("gray.100", "gray.800");

  const isHomeLike =
    location.pathname === "/home" ||
    location.pathname === "/" ||
    location.pathname.endsWith("/home");

  const shouldHideSidebar =
    location.pathname.includes("CourseDetailsPage") ||
    location.pathname.includes("CourseStatisticsPage") ||
    location.pathname.includes("CourseStudentsPage") ||
    location.pathname.includes("ComprehensiveExam") ||
    location.pathname.toLowerCase() === "/social" ||
    location.pathname.toLowerCase().includes("question-bank") ||
    location.pathname.toLowerCase().includes("question_bank") ||
    location.pathname.toLowerCase().includes("teacher_subjects");

  const sidebarWidth = "300px";

  return (
    <Flex
      direction={{ base: "column", md: "row-reverse" }}
      minHeight="100vh"
      bg={mainBg}
    >
      {!shouldHideSidebar && (
        <Box
          data-tour-id="student-sidebar"
          display={{ base: "none", [SHELL_DESKTOP_BP]: "flex" }}
          flexDirection="column"
          width={sidebarWidth}
          height="100vh"
          position="fixed"
          top={0}
          right={0}
          zIndex={100}
          bg={sidebarBg}
          borderLeftWidth="1px"
          borderColor={sidebarBorder}
          boxShadow={useColorModeValue(
            "-12px 0 40px rgba(15,23,42,0.06)",
            "-12px 0 40px rgba(0,0,0,0.35)",
          )}
          overflow="hidden"
          className="sidebar-container"
        >
          <Box
            position="absolute"
            inset={0}
            pointerEvents="none"
            opacity={0.55}
            backgroundImage={`radial-gradient(circle at 12% 18%, ${BRAND_BLUE}18 0, transparent 42%), radial-gradient(circle at 88% 82%, ${BRAND_ORANGE}14 0, transparent 40%)`}
          />

          <Box position="relative" zIndex={1} display="flex" flexDirection="column" h="full">
            <SidebarBrandHeader />

            <SidebarUserCard
              user={user}
              isAdmin={isAdmin}
              isTeacher={isTeacher}
              isAcademy={isAcademy}
              isAcademyTeacher={isAcademyTeacher}
            />

            <Box
              flex={1}
              overflowY="auto"
              overflowX="hidden"
              px={2.5}
              py={1}
              sx={{
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-track": { bg: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  bg: scrollbarThumb,
                  borderRadius: "full",
                },
              }}
            >
              <Links isSidebarOpen />
            </Box>

            <Box px={3} py={3} flexShrink={0}>
              <Box
                borderRadius="2xl"
                overflow="hidden"
                bgGradient={`linear(135deg, ${BRAND_ORANGE}, #C05621)`}
                boxShadow="0 12px 28px rgba(221,107,32,0.28)"
              >
                <Button
                  as="a"
                  href="https://www.mediafire.com/file/f3afz741f5hohts/E-M+Online.apk/file"
                  target="_blank"
                  rel="noopener noreferrer"
                  w="full"
                  h="52px"
                  variant="unstyled"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  color="white"
                  fontWeight="extrabold"
                  fontSize="sm"
                  rightIcon={<FaAndroid />}
                  _hover={{ opacity: 0.94 }}
                >
                  تحميل تطبيق أندرويد
                </Button>
              </Box>
              <Text fontSize="10px" color="gray.500" textAlign="center" mt={2.5} fontWeight="medium">
                EM Online · تعلم في أي وقت
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      <Box
        flex={1}
        mr={{ base: 0, [SHELL_DESKTOP_BP]: shouldHideSidebar ? 0 : sidebarWidth }}
        mt="72px"
        w="full"
        maxW="100%"
        overflowX="hidden"
        bg={mainBg}
        color={useColorModeValue("gray.800", "white")}
        minH="calc(100vh - 72px)"
      >
        <Box
          px={{ base: 3, sm: 4, md: 6 }}
          py={{ base: 2.5, sm: 3, md: 4 }}
          maxW="100%"
          w="full"
        >
          {isHomeLike ? (
            <VStack spacing={4} align="stretch">
              <Box
                bg={student ? "transparent" : pagePanel}
                borderRadius={{ base: "lg", md: "xl" }}
                borderWidth={student ? "0" : "1px"}
                borderColor={sidebarBorder}
                p={student ? { base: 0, md: 2 } : { base: 2, md: 3 }}
              >
                <Box
                  bg={student ? "transparent" : panelBg}
                  borderRadius={{ base: "md", md: "lg" }}
                  borderWidth={student ? "0" : "1px"}
                  borderColor={sidebarBorder}
                  overflow="hidden"
                >
                  <Outlet />
                </Box>
              </Box>
            </VStack>
          ) : (
            <Outlet />
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default HomeLogin;
