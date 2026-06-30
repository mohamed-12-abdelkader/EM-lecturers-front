import React, { useState, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Flex,
  Avatar,
  Container,
  Badge,
  Button,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import {
  MdDomain,
  MdPeople,
  MdMenuBook,
  MdInventory,
  MdPersonAdd,
} from "react-icons/md";
import { FaCrown, FaChalkboardTeacher } from "react-icons/fa";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import AdminTenantsPanel from "./components/AdminTenantsPanel";

const MotionBox = motion(Box);

function formatNumber(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("ar-EG");
}

const AdminDashboardHome = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const employeeData =
    JSON.parse(localStorage.getItem("employee_data")) || null;

  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    students: 0,
    courses: 0,
    teachers: 0,
    packages: {},
  });

  const handleSummaryChange = useCallback((next) => {
    setSummary(next);
  }, []);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const heroGradient = useColorModeValue(
    "linear(to-br, blue.500, orange.500)",
    "linear(to-br, blue.600, orange.600)",
  );
  const heroTextColor = useColorModeValue("white", "gray.50");
  const heroSubtextColor = useColorModeValue("whiteAlpha.900", "whiteAlpha.800");
  const heroShadow = useColorModeValue(
    "0 20px 50px -12px rgba(49, 130, 206, 0.35)",
    "0 20px 50px -12px rgba(0, 0, 0, 0.45)",
  );
  const heroPattern = useColorModeValue(
    "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
  );
  const iconWrapBg = useColorModeValue("whiteAlpha.300", "whiteAlpha.200");
  const iconWrapBorder = useColorModeValue("whiteAlpha.600", "whiteAlpha.300");
  const badgeBg = useColorModeValue("whiteAlpha.300", "whiteAlpha.200");
  const badgeColor = useColorModeValue("white", "gray.50");
  const badgeBorder = useColorModeValue("whiteAlpha.600", "whiteAlpha.300");
  const chipBg = useColorModeValue("white", "whiteAlpha.120");
  const chipBorder = useColorModeValue("whiteAlpha.700", "whiteAlpha.250");
  const chipTitleColor = useColorModeValue("gray.800", "white");
  const chipMutedColor = useColorModeValue("gray.600", "whiteAlpha.800");
  const chipValueColor = useColorModeValue("gray.900", "white");
  const avatarBorder = useColorModeValue("white", "whiteAlpha.500");
  const outlineBtnBorder = useColorModeValue("whiteAlpha.800", "whiteAlpha.500");
  const outlineBtnColor = useColorModeValue("white", "gray.50");
  const outlineBtnHoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const statIconColors = useColorModeValue(
    ["blue.500", "green.500", "teal.500", "orange.500"],
    ["blue.200", "green.200", "teal.200", "orange.200"],
  );
  const chipShadow = useColorModeValue("sm", "none");
  const crownColor = useColorModeValue("orange.200", "yellow.300");
  const patternOpacity = useColorModeValue(0.14, 0.1);
  const orbBlue = useColorModeValue("blue.300", "blue.400");
  const orbOrange = useColorModeValue("orange.300", "orange.400");
  const adminName = employeeData
    ? employeeData.name
    : `${user.fname || ""} ${user.lname || ""}`.trim() || "مدير النظام";

  const heroStats = [
    {
      label: "إجمالي المنصات",
      value: formatNumber(summary.total),
      icon: MdDomain,
    },
    {
      label: "نشطة (المعروض)",
      value: formatNumber(summary.active),
      icon: FaChalkboardTeacher,
    },
    {
      label: "طلاب",
      value: formatNumber(summary.students),
      icon: MdPeople,
    },
    {
      label: "كورسات",
      value: formatNumber(summary.courses),
      icon: MdMenuBook,
    },
  ];

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={{ base: 8, md: 12 }} pt={{ base: 4, md: 6 }}>
      <Container maxW="1600px" px={{ base: 3, sm: 4, md: 8 }}>
        <VStack spacing={{ base: 5, md: 8 }} align="stretch">
          <MotionBox
            borderRadius={{ base: "2xl", md: "3xl" }}
            shadow={heroShadow}
            position="relative"
            overflow="hidden"
            color={heroTextColor}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="4px"
              bgGradient="linear(to-r, blue.500, orange.500)"
              zIndex={2}
            />
            <Box position="absolute" inset={0} bgGradient={heroGradient} />
            <Box
              position="absolute"
              inset={0}
              opacity={patternOpacity}
              bgImage={heroPattern}
              bgSize="22px 22px"
            />
            <MotionBox
              position="absolute"
              top={{ base: "-30%", md: "-20%" }}
              right={{ base: "-25%", md: "-10%" }}
              w={{ base: "220px", md: "380px" }}
              h={{ base: "220px", md: "380px" }}
              borderRadius="full"
              bg={orbBlue}
              filter="blur(80px)"
              opacity={0.35}
              animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.4, 0.25] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
            <MotionBox
              position="absolute"
              bottom={{ base: "-35%", md: "-25%" }}
              left={{ base: "-20%", md: "-8%" }}
              w={{ base: "200px", md: "320px" }}
              h={{ base: "200px", md: "320px" }}
              borderRadius="full"
              bg={orbOrange}
              filter="blur(70px)"
              opacity={0.3}
              animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            />

            <Box position="relative" zIndex={1} p={{ base: 5, sm: 6, md: 10 }}>
              <Flex
                direction={{ base: "column", lg: "row" }}
                align={{ base: "stretch", lg: "center" }}
                justify="space-between"
                gap={{ base: 6, lg: 8 }}
              >
                <VStack
                  align={{ base: "center", lg: "flex-start" }}
                  spacing={4}
                  flex={1}
                  textAlign={{ base: "center", lg: "right" }}
                >
                  <HStack spacing={3}>
                    <Flex
                      w={{ base: 11, md: 12 }}
                      h={{ base: 11, md: 12 }}
                      borderRadius="xl"
                      bg={iconWrapBg}
                      border="1px solid"
                      borderColor={iconWrapBorder}
                      align="center"
                      justify="center"
                      backdropFilter="blur(12px)"
                    >
                      <Icon as={FaCrown} boxSize={{ base: 5, md: 6 }} color={crownColor} />
                    </Flex>
                    <Badge
                      bg={badgeBg}
                      color={badgeColor}
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="xs"
                      border="1px solid"
                      borderColor={badgeBorder}
                    >
                      لوحة المدير
                    </Badge>
                  </HStack>

                  <Box>
                    <Heading
                      as="h1"
                      fontSize={{ base: "2xl", sm: "3xl", md: "4xl" }}
                      fontWeight="extrabold"
                      lineHeight="1.2"
                      textShadow="0 4px 24px rgba(0,0,0,0.25)"
                    >
                      لوحة تحكم المدير
                    </Heading>
                    <Text
                      mt={3}
                      fontSize={{ base: "sm", md: "md" }}
                      color={heroSubtextColor}
                      maxW={{ base: "full", lg: "540px" }}
                      lineHeight="1.9"
                    >
                      إدارة منصات المدرسين، متابعة الباقات والإحصائيات، والوصول السريع لأهم
                      أدوات النظام.
                    </Text>
                  </Box>

                  <HStack
                    spacing={3}
                    flexWrap="wrap"
                    justify={{ base: "center", lg: "flex-start" }}
                  >
                    <Button
                      as={RouterLink}
                      to="/admin/addteacher"
                      size={{ base: "sm", md: "md" }}
                      bg="orange.500"
                      color="white"
                      _hover={{ bg: "orange.600" }}
                      borderRadius="xl"
                      leftIcon={<MdPersonAdd />}
                      shadow="lg"
                    >
                      إضافة منصة
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/packages-management"
                      size={{ base: "sm", md: "md" }}
                      variant="outline"
                      borderRadius="xl"
                      borderColor={outlineBtnBorder}
                      color={outlineBtnColor}
                      _hover={{ bg: outlineBtnHoverBg }}
                      leftIcon={<MdInventory />}
                    >
                      إدارة الباقات
                    </Button>
                  </HStack>
                </VStack>

                <VStack
                  spacing={4}
                  align={{ base: "center", lg: "flex-end" }}
                  w={{ base: "full", lg: "auto" }}
                >
                  <HStack
                    spacing={4}
                    bg={chipBg}
                    border="1px solid"
                    borderColor={chipBorder}
                    borderRadius="2xl"
                    p={{ base: 3, md: 4 }}
                    backdropFilter="blur(14px)"
                    w={{ base: "full", sm: "auto" }}
                    justify={{ base: "center", sm: "flex-start" }}
                  >
                    <Box position="relative">
                      <Avatar
                        name={adminName}
                        src={employeeData?.avatar}
                        size={{ base: "lg", md: "xl" }}
                        border="3px solid"
                        borderColor={avatarBorder}
                        shadow="xl"
                      />
                      <Box
                        position="absolute"
                        bottom={0}
                        right={0}
                        w={3.5}
                        h={3.5}
                        bg="green.400"
                        borderRadius="full"
                        border="2px solid white"
                      />
                    </Box>
                    <VStack align="flex-start" spacing={0.5} display={{ base: "none", sm: "flex" }}>
                      <Text fontWeight="bold" fontSize="md" color={chipTitleColor}>
                        {adminName}
                      </Text>
                      <Text fontSize="sm" color={chipMutedColor}>
                        {employeeData?.email || "مدير النظام"}
                      </Text>
                      {employeeData ? (
                        <Badge
                          colorScheme={employeeData.is_active ? "green" : "red"}
                          borderRadius="full"
                          fontSize="xs"
                        >
                          {employeeData.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      ) : null}
                    </VStack>
                  </HStack>

                  <SimpleGrid
                    columns={{ base: 2, sm: 4, lg: 2, xl: 4 }}
                    spacing={3}
                    w="full"
                    maxW={{ base: "full", lg: "520px", xl: "640px" }}
                  >
                    {heroStats.map((item, index) => (
                      <Box
                        key={item.label}
                        bg={chipBg}
                        border="1px solid"
                        borderColor={chipBorder}
                        borderRadius="xl"
                        p={{ base: 3, md: 3.5 }}
                        backdropFilter="blur(12px)"
                        minW={0}
                        shadow={chipShadow}
                      >
                        <HStack justify="space-between" mb={1}>
                          <Icon
                            as={item.icon}
                            boxSize={4}
                            color={statIconColors[index % statIconColors.length]}
                          />
                        </HStack>
                        <Text
                          fontWeight="extrabold"
                          fontSize={{ base: "lg", md: "xl" }}
                          color={chipValueColor}
                        >
                          {item.value}
                        </Text>
                        <Text fontSize="xs" color={chipMutedColor} noOfLines={1}>
                          {item.label}
                        </Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </VStack>
              </Flex>
            </Box>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <AdminTenantsPanel onSummaryChange={handleSummaryChange} />
          </MotionBox>
        </VStack>
      </Container>
      <ScrollToTop />
    </Box>
  );
};

export default AdminDashboardHome;
