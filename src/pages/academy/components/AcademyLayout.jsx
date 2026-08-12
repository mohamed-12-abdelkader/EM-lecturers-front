import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  HStack,
  Text,
  useColorModeValue,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { FaUniversity } from "react-icons/fa";
import { ACCENT, BRAND_ORANGE } from "../academyUtils";

export default function AcademyLayout({ navItems, title, subtitle, basePath = "/academy" }) {
  const location = useLocation();
  const pageBg = useColorModeValue("#f8fafc", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("slate.200", "gray.700");
  const muted = useColorModeValue("slate.500", "gray.400");
  const navInactive = useColorModeValue("slate.600", "gray.400");
  const navHoverBg = useColorModeValue("slate.50", "whiteAlpha.100");

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      dir="rtl"
      className="mt-[80px]"
      pb={{ base: "88px", md: 0 }}
      fontFamily="'IBM Plex Sans Arabic', 'Noto Sans Arabic', system-ui, sans-serif"
    >
      <Box bg={cardBg} borderBottomWidth="1px" borderColor={border} position="sticky" top={0} zIndex={20} boxShadow="0 1px 3px rgba(15,23,42,0.06)">
        <Box h="3px" bg={`linear-gradient(90deg, ${ACCENT}, ${BRAND_ORANGE})`} />
        <Container maxW="7xl" py={{ base: 3, md: 4 }} px={{ base: 3, md: 6 }}>
          <Flex justify="space-between" align="center" gap={3} mb={{ base: 0, md: 3 }}>
            <HStack spacing={3} align="center" minW={0}>
              <Flex w={11} h={11} borderRadius="xl" bg="blue.50" _dark={{ bg: "whiteAlpha.100" }} align="center" justify="center" flexShrink={0}>
                <Icon as={FaUniversity} color={ACCENT} boxSize={5} />
              </Flex>
              <Box minW={0}>
                <Text fontWeight="black" fontSize={{ base: "md", md: "lg" }} lineHeight="1.2" noOfLines={1}>
                  {title}
                </Text>
                <Text fontSize="xs" color={muted} mt={0.5} display={{ base: "none", sm: "block" }} noOfLines={1}>
                  {subtitle}
                </Text>
              </Box>
            </HStack>
          </Flex>

          <Flex display={{ base: "none", md: "flex" }} gap={1.5} overflowX="auto" pb={0.5}>
            {navItems.map((item) => {
              const path = item.to ? `${basePath}/${item.to}` : basePath;
              return (
                <NavLink key={item.to || "home"} to={path} end={item.end} style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <HStack
                      spacing={2}
                      px={3.5}
                      py={2}
                      borderRadius="xl"
                      fontSize="sm"
                      fontWeight={isActive ? "bold" : "medium"}
                      whiteSpace="nowrap"
                      bg={isActive ? "blue.50" : "transparent"}
                      color={isActive ? ACCENT : navInactive}
                      borderWidth="1px"
                      borderColor={isActive ? "blue.200" : "transparent"}
                      _dark={{ bg: isActive ? "whiteAlpha.100" : "transparent", borderColor: isActive ? "blue.700" : "transparent" }}
                      transition="all 0.15s"
                      _hover={{ bg: isActive ? "blue.50" : navHoverBg }}
                    >
                      <Icon as={item.icon} boxSize={3.5} />
                      <Text>{item.fullLabel || item.label}</Text>
                    </HStack>
                  )}
                </NavLink>
              );
            })}
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" py={{ base: 5, md: 8 }} px={{ base: 3, md: 6 }}>
        <Outlet />
      </Container>

      <Box
        display={{ base: "block", md: "none" }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={30}
        bg={cardBg}
        borderTopWidth="1px"
        borderColor={border}
        boxShadow="0 -4px 20px rgba(15,23,42,0.08)"
        pb="env(safe-area-inset-bottom)"
      >
        <HStack justify="space-around" py={2} px={1}>
          {navItems.map((item) => {
            const path = item.to ? `${basePath}/${item.to}` : basePath;
            const active = item.end
              ? location.pathname.replace(/\/$/, "") === basePath.replace(/\/$/, "")
              : location.pathname.startsWith(path);
            return (
              <NavLink key={item.to || "home"} to={path} end={item.end} style={{ textDecoration: "none", flex: 1 }}>
                <VStack spacing={0.5} py={1} color={active ? ACCENT : muted}>
                  <Icon as={item.icon} boxSize={4} />
                  <Text fontSize="10px" fontWeight={active ? "bold" : "medium"}>
                    {item.label}
                  </Text>
                </VStack>
              </NavLink>
            );
          })}
        </HStack>
      </Box>
    </Box>
  );
}
