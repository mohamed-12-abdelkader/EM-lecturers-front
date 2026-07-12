import { NavLink, Outlet, useParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { FaArrowRight, FaBuilding } from "react-icons/fa";
import BrandLoadingScreen from "../../../components/loading/BrandLoadingScreen";
import { useCenter } from "../../../Hooks/centerMgmt/useCenterMgmtQueries";
import { ACCENT, CENTER_NAV, field } from "../centerMgmtUtils";
import { LoadingBlock } from "./UiBits";

export default function CenterLayout() {
  const { centerId } = useParams();
  const { data: center, isLoading, isError, error } = useCenter(centerId);

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const navInactive = useColorModeValue("gray.600", "gray.300");
  const navHoverBg = useColorModeValue("gray.50", "gray.700");

  if (isLoading) return <BrandLoadingScreen />;

  if (isError) {
    return (
      <Box minH="100vh" bg={pageBg} py={10}>
        <Container maxW="6xl">
          <LoadingBlock label={error?.message || "تعذر تحميل السنتر"} />
          <Flex justify="center" mt={4}>
            <Button as={RouterLink} to="/center-mgmt" colorScheme="blue">
              العودة للسناتر
            </Button>
          </Flex>
        </Container>
      </Box>
    );
  }

  const name = field(center, "name") || "السنتر";
  const currency = field(center, "currency") || "EGP";

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl">
      <Box
        bg={cardBg}
        borderBottomWidth="1px"
        borderColor={border}
        position="sticky"
        top={0}
        zIndex={20}
        backdropFilter="blur(8px)"
      >
        <Container maxW="7xl" py={4}>
          <Flex justify="space-between" align="center" gap={3} mb={4} flexWrap="wrap">
            <HStack spacing={3} align="center">
              <Flex
                w={11}
                h={11}
                borderRadius="xl"
                bg="blue.50"
                align="center"
                justify="center"
              >
                <Icon as={FaBuilding} color={ACCENT} />
              </Flex>
              <Box>
                <Text fontWeight="bold" fontSize="lg" lineHeight="1.2">
                  {name}
                </Text>
                <HStack spacing={2} mt={1}>
                  <Badge colorScheme="blue" borderRadius="md">
                    {currency}
                  </Badge>
                  {center?.is_active === false ? (
                    <Badge colorScheme="red">غير نشط</Badge>
                  ) : (
                    <Badge colorScheme="green">نشط</Badge>
                  )}
                </HStack>
              </Box>
            </HStack>
            <Button
              as={RouterLink}
              to="/center-mgmt"
              variant="ghost"
              size="sm"
              leftIcon={<FaArrowRight />}
            >
              كل السناتر
            </Button>
          </Flex>

          <Flex
            gap={1}
            overflowX="auto"
            pb={1}
            sx={{
              "&::-webkit-scrollbar": { height: "4px" },
              "&::-webkit-scrollbar-thumb": { bg: "gray.300", borderRadius: "full" },
            }}
          >
            {CENTER_NAV.map((item) => {
              const path = item.to
                ? `/center-mgmt/${centerId}/${item.to}`
                : `/center-mgmt/${centerId}`;
              return (
                <NavLink key={item.to || "home"} to={path} end={item.end} style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <Box
                      px={3}
                      py={2}
                      borderRadius="lg"
                      fontSize="sm"
                      fontWeight={isActive ? "bold" : "medium"}
                      whiteSpace="nowrap"
                      bg={isActive ? "blue.50" : "transparent"}
                      color={isActive ? ACCENT : navInactive}
                      borderWidth="1px"
                      borderColor={isActive ? "blue.200" : "transparent"}
                      transition="all 0.15s"
                      _hover={{ bg: isActive ? "blue.50" : navHoverBg }}
                    >
                      {item.label}
                    </Box>
                  )}
                </NavLink>
              );
            })}
          </Flex>
          <Text fontSize="xs" color={muted} mt={2} display={{ base: "none", md: "block" }}>
            إدارة بسيطة للطلاب · الحضور · الاشتراكات · الماليات
          </Text>
        </Container>
      </Box>

      <Container maxW="7xl" py={{ base: 5, md: 8 }}>
        <Outlet context={{ center, centerId }} />
      </Container>
    </Box>
  );
}
