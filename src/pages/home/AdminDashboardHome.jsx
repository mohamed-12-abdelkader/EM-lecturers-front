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
  Container,
  Button,
  SimpleGrid,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  MdDomain,
  MdPeople,
  MdMenuBook,
  MdInventory,
  MdPersonAdd,
} from "react-icons/md";
import { FaChalkboardTeacher, FaWhatsapp } from "react-icons/fa";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import AdminTenantsPanel from "./components/AdminTenantsPanel";
import InstallPWAButton from "../../components/pwa/InstallPWAButton";
import { AD_BLUE, AD_ORANGE } from "./adminDashboardTheme";

function formatNumber(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("ar-EG");
}

function StatTile({ label, value, icon, color }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");
  const iconBg = useColorModeValue(`${color}.50`, `${color}.900`);
  const iconColor = useColorModeValue(`${color}.500`, `${color}.200`);

  return (
    <Flex
      bg={bg}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      p={4}
      align="center"
      gap={3}
    >
      <Flex
        w={10}
        h={10}
        borderRadius="lg"
        bg={iconBg}
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={icon} color={iconColor} boxSize={5} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="xs" color={muted} mb={0.5}>
          {label}
        </Text>
        <Text fontSize="xl" fontWeight="800" color={title} lineHeight="1.1">
          {value}
        </Text>
      </Box>
    </Flex>
  );
}

const AdminDashboardHome = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null") || {};
  const employeeData = user?.employee_data ?? null;

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
  const titleColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.600", "gray.400");

  const adminName = employeeData
    ? employeeData.name
    : `${user.fname || ""} ${user.lname || ""}`.trim() || "مدير النظام";

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={10} pt={{ base: 4, md: 6 }}>
      <Container maxW="1400px" px={{ base: 3, sm: 4, md: 6 }}>
        <VStack spacing={5} align="stretch">
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            gap={4}
          >
            <Box>
              <Heading
                as="h1"
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="800"
                color={titleColor}
                fontFamily="'Noto Naskh Arabic', 'Noto Sans Arabic', serif"
              >
                لوحة تحكم المدير
              </Heading>
              <Text mt={1} fontSize="sm" color={muted}>
                مرحباً {adminName} — إدارة منصات المدرسين والباقات من مكان واحد
              </Text>
            </Box>

            <HStack spacing={2} flexWrap="wrap">
              <Button
                as={RouterLink}
                to="/admin/students"
                size="sm"
                variant="outline"
                borderColor={AD_BLUE}
                color={AD_BLUE}
                borderRadius="lg"
                leftIcon={<MdPeople />}
                fontWeight="700"
                cursor="pointer"
                _hover={{ bg: "blue.50" }}
              >
                كل الطلاب
              </Button>
              <Button
                as={RouterLink}
                to="/admin/addteacher"
                size="sm"
                bg={AD_ORANGE}
                color="white"
                borderRadius="lg"
                leftIcon={<MdPersonAdd />}
                fontWeight="700"
                cursor="pointer"
                _hover={{ bg: "#C05621" }}
              >
                إضافة منصة
              </Button>
              <Button
                as={RouterLink}
                to="/packages-management"
                size="sm"
                variant="outline"
                borderColor={AD_BLUE}
                color={AD_BLUE}
                borderRadius="lg"
                leftIcon={<MdInventory />}
                fontWeight="700"
                cursor="pointer"
                _hover={{ bg: "blue.50" }}
              >
                إدارة الباقات
              </Button>
              <Button
                as={RouterLink}
                to="/admin/whatsapp/inbox"
                size="sm"
                variant="outline"
                borderColor="green.500"
                color="green.600"
                borderRadius="lg"
                leftIcon={<FaWhatsapp />}
                fontWeight="700"
                cursor="pointer"
                _hover={{ bg: "green.50" }}
              >
                واتساب
              </Button>
              <InstallPWAButton
                label="تثبيت التطبيق"
                variant="solid"
                className="!w-auto !py-2 !px-4 !text-xs !rounded-lg"
              />
            </HStack>
          </Flex>

          <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
            <StatTile
              label="المنصات"
              value={formatNumber(summary.total)}
              icon={MdDomain}
              color="blue"
            />
            <StatTile
              label="نشطة"
              value={formatNumber(summary.active)}
              icon={FaChalkboardTeacher}
              color="green"
            />
            <StatTile
              label="الطلاب"
              value={formatNumber(summary.students)}
              icon={MdPeople}
              color="teal"
            />
            <StatTile
              label="الكورسات"
              value={formatNumber(summary.courses)}
              icon={MdMenuBook}
              color="orange"
            />
          </SimpleGrid>

          <AdminTenantsPanel onSummaryChange={handleSummaryChange} />
        </VStack>
      </Container>
      <ScrollToTop />
    </Box>
  );
};

export default AdminDashboardHome;
