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
  Divider,
  Tooltip,
} from "@chakra-ui/react";
import { FaAndroid } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import Links from "../../components/links/Links";
import { getRoleLabel } from "../../utils/authRoles";
import UserType from "../../Hooks/auth/userType";
import { SHELL_DESKTOP_BP } from "../../theme/chakraTheme";

function getUserDisplayName(user) {
  if (!user) return "مستخدم";
  if (user.name?.trim()) return user.name.trim();
  const full = [user.fname, user.lname].filter(Boolean).join(" ").trim();
  return full || "مستخدم";
}

function getRoleMeta(user, isAdmin, isTeacher, isAcademy, isAcademyTeacher) {
  if (isAdmin) return { label: "مشرف النظام", colorScheme: "purple" };
  if (isAcademy) return { label: "مالك أكاديمية", colorScheme: "blue" };
  if (isAcademyTeacher) return { label: "مدرس أكاديمية", colorScheme: "cyan" };
  if (isTeacher) return { label: "مدرس", colorScheme: "blue" };
  return { label: getRoleLabel(user?.role) || "طالب", colorScheme: "green" };
}

function SidebarUserCard({ user, isAdmin, isTeacher, isAcademy, isAcademyTeacher, isExpanded }) {
  const cardBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const cardBorder = useColorModeValue("gray.100", "gray.700");
  const nameColor = useColorModeValue("gray.800", "white");
  const emailColor = useColorModeValue("gray.500", "gray.400");
  const avatarBorder = useColorModeValue("white", "gray.700");
  const role = getRoleMeta(user, isAdmin, isTeacher, isAcademy, isAcademyTeacher);
  const displayName = getUserDisplayName(user);

  if (!isExpanded) {
    return (
      <Flex justify="center" py={3} px={2} flexShrink={0}>
        <Tooltip label={displayName} placement="left" hasArrow openDelay={300}>
          <Avatar
            size="sm"
            name={displayName}
            bg="blue.500"
            color="white"
            fontWeight="bold"
            cursor="default"
          />
        </Tooltip>
      </Flex>
    );
  }

  return (
    <Box
      mx={3}
      mt={4}
      mb={2}
      p={3}
      borderRadius="2xl"
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
    >
      <HStack spacing={3} align="center">
        <Avatar
          size="md"
          name={displayName}
          bg="blue.500"
          color="white"
          fontWeight="bold"
          borderWidth="2px"
          borderColor={avatarBorder}
          boxShadow="sm"
        />
        <VStack align="start" spacing={1} flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="bold" color={nameColor} noOfLines={1}>
            {displayName}
          </Text>
          {user?.email ? (
            <Text fontSize="xs" color={emailColor} noOfLines={1}>
              {user.email}
            </Text>
          ) : null}
          <Badge
            colorScheme={role.colorScheme}
            variant="subtle"
            borderRadius="full"
            px={2}
            py={0.5}
            fontSize="10px"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Icon as={MdVerified} boxSize={3} />
            {role.label}
          </Badge>
        </VStack>
      </HStack>
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

  const sidebarBg = useColorModeValue("white", "gray.900");
  const sidebarBorder = useColorModeValue("gray.200", "gray.700");
  const sidebarGlow = useColorModeValue(
    "0 0 0 1px rgba(15,23,42,0.04), 0 20px 40px rgba(15,23,42,0.08)",
    "0 0 0 1px rgba(255,255,255,0.04), 0 20px 40px rgba(0,0,0,0.35)",
  );
  const mainBg = useColorModeValue("gray.50", "gray.900");
  const scrollbarThumb = useColorModeValue("gray.300", "gray.600");
  const panelBg = useColorModeValue("white", "gray.800");
  const pagePanel = useColorModeValue("gray.100", "gray.800");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const footerMutedColor = useColorModeValue("gray.400", "gray.500");
  const accentGradient = "linear(to-l, blue.600, orange.500)";

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

  const sidebarWidth = "288px";

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
          boxShadow={sidebarGlow}
          overflow="hidden"
          className="sidebar-container mt-[72px]"
        >
          <Box h="3px" bgGradient={accentGradient} flexShrink={0} />

          <SidebarUserCard
            user={user}
            isAdmin={isAdmin}
            isTeacher={isTeacher}
            isAcademy={isAcademy}
            isAcademyTeacher={isAcademyTeacher}
            isExpanded
          />

          <Divider borderColor={sidebarBorder} opacity={0.7} />

          <Box
            flex={1}
            overflowY="auto"
            overflowX="hidden"
            px={2}
            py={3}
            sx={{
              "&::-webkit-scrollbar": { width: "5px" },
              "&::-webkit-scrollbar-track": { bg: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                bg: scrollbarThumb,
                borderRadius: "full",
              },
            }}
          >
            <Links isSidebarOpen />
          </Box>

          <Box
            p={3}
            borderTopWidth="1px"
            borderColor={sidebarBorder}
            bg={footerBg}
            flexShrink={0}
          >
            <Button
              as="a"
              href="https://www.mediafire.com/file/f3afz741f5hohts/E-M+Online.apk/file"
              target="_blank"
              rel="noopener noreferrer"
              w="full"
              size="md"
              variant="outline"
              colorScheme="orange"
              borderRadius="xl"
              borderWidth="2px"
              fontWeight="bold"
              fontSize="sm"
              h="48px"
              rightIcon={<FaAndroid />}
              _hover={{
                bg: "orange.500",
                color: "white",
                borderColor: "orange.500",
                transform: "translateY(-1px)",
                boxShadow: "0 8px 20px rgba(237, 137, 54, 0.28)",
              }}
              transition="all 0.2s ease"
            >
              تحميل تطبيق أندرويد
            </Button>
            <Text fontSize="10px" color={footerMutedColor} textAlign="center" mt={2}>
              EM Online · تعلم في أي وقت
            </Text>
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
