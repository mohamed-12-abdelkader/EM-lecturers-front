import { Outlet, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdAdminPanelSettings } from "react-icons/md";
import AdminLinks from "../../components/admin/AdminLinks";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

/**
 * لوحة تحكم الأدمن — هيكل حديث RTL بدون شريط ribbon القديم.
 */
const Admin = () => {
  const pageBg = useColorModeValue("#F4F7FB", "gray.900");
  const shellBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const muted = useColorModeValue("gray.500", "gray.400");
  const brand = "#0B3A6E";

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      pt={{ base: "96px", md: "110px" }}
      pb={{ base: "100px", md: "48px" }}
      dir="rtl"
    >
      <Box
        maxW="1400px"
        mx="auto"
        px={{ base: 3, md: 5 }}
      >
        <Flex
          align="center"
          justify="space-between"
          mb={5}
          px={{ base: 1, md: 2 }}
        >
          <HStack spacing={3}>
            <Flex
              w="44px"
              h="44px"
              align="center"
              justify="center"
              borderRadius="14px"
              bg={brand}
              color="white"
              shadow="md"
            >
              <Icon as={MdAdminPanelSettings} boxSize={6} />
            </Flex>
            <Box>
              <Heading size="md" color={brand} letterSpacing="-0.02em">
                لوحة تحكم الأدمن
              </Heading>
              <Text fontSize="sm" color={muted}>
                إدارة المنصة والمدرسين والطلاب من مكان واحد
              </Text>
            </Box>
          </HStack>
          <Text
            as={RouterLink}
            to="/home"
            fontSize="sm"
            fontWeight="700"
            color="blue.500"
            _hover={{ textDecoration: "underline" }}
          >
            الرئيسية
          </Text>
        </Flex>

        <Flex
          direction={{ base: "column", lg: "row" }}
          gap={5}
          align="stretch"
        >
          <Box
            w={{ base: "100%", lg: "280px" }}
            flexShrink={0}
            bg={shellBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="2xl"
            shadow="sm"
            overflow="hidden"
            position={{ lg: "sticky" }}
            top={{ lg: "120px" }}
            alignSelf="flex-start"
            maxH={{ lg: "calc(100vh - 140px)" }}
          >
            <AdminLinks />
          </Box>

          <Box
            flex="1"
            minW={0}
            bg={shellBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="2xl"
            shadow="sm"
            overflow="hidden"
          >
            <Outlet />
          </Box>
        </Flex>
      </Box>
      <ScrollToTop />
    </Box>
  );
};

export default Admin;
