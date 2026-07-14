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
import { FaSchool } from "react-icons/fa";
import { ACCENT, CENTER_NAV } from "../centerMgmtUtils";

export default function CenterLayout() {
  const location = useLocation();
  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const navInactive = useColorModeValue("gray.600", "gray.400");
  const navHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const stickyShadow = useColorModeValue(
    "0 8px 24px rgba(15,23,42,0.06)",
    "0 8px 24px rgba(0,0,0,0.35)",
  );

  const activePath = location.pathname.replace(/\/$/, "") || "/center-mgmt";

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      dir="rtl"
      className="mt-[80px]"
      pb={{ base: "88px", md: 0 }}
      fontFamily="'Noto Sans Arabic', system-ui, sans-serif"
    >
      {/* Top header — desktop + mobile title */}
      <Box
        bg={cardBg}
        borderBottomWidth="1px"
        borderColor={border}
        position="sticky"
        top={0}
        zIndex={20}
        boxShadow={stickyShadow}
      >
        <Box
          h="3px"
          bg={`linear-gradient(90deg, ${ACCENT}, #DD6B20)`}
        />
        <Container maxW="7xl" py={{ base: 3, md: 4 }} px={{ base: 3, md: 6 }}>
          <Flex justify="space-between" align="center" gap={3} mb={{ base: 0, md: 3 }}>
            <HStack spacing={3} align="center" minW={0}>
              <Flex
                w={{ base: 10, md: 11 }}
                h={{ base: 10, md: 11 }}
                borderRadius="xl"
                bg="blue.50"
                _dark={{ bg: "whiteAlpha.100" }}
                align="center"
                justify="center"
                flexShrink={0}
                boxShadow="sm"
              >
                <Icon as={FaSchool} color={ACCENT} boxSize={{ base: 4, md: 5 }} />
              </Flex>
              <Box minW={0}>
                <Text fontWeight="black" fontSize={{ base: "md", md: "lg" }} lineHeight="1.2" noOfLines={1}>
                  إدارة السنتر
                </Text>
                <Text fontSize="xs" color={muted} mt={0.5} display={{ base: "none", sm: "block" }} noOfLines={1}>
                  مجموعات · طلاب · حضور · اشتراكات · مدفوعات
                </Text>
              </Box>
            </HStack>
          </Flex>

          {/* Desktop / tablet horizontal nav */}
          <Flex
            display={{ base: "none", md: "flex" }}
            gap={1.5}
            overflowX="auto"
            pb={0.5}
            sx={{
              "&::-webkit-scrollbar": { height: "4px" },
              "&::-webkit-scrollbar-thumb": { bg: "gray.300", borderRadius: "full" },
            }}
          >
            {CENTER_NAV.map((item) => {
              const path = item.to ? `/center-mgmt/${item.to}` : "/center-mgmt";
              return (
                <NavLink
                  key={item.to || "home"}
                  to={path}
                  end={item.end}
                  style={{ textDecoration: "none" }}
                >
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
                      _dark={{
                        bg: isActive ? "whiteAlpha.100" : "transparent",
                        borderColor: isActive ? "blue.700" : "transparent",
                      }}
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

      <Container
        maxW="7xl"
        py={{ base: 4, md: 7 }}
        px={{ base: 3, md: 6 }}
      >
        <Outlet />
      </Container>

      {/* Mobile bottom nav */}
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
        boxShadow="0 -8px 28px rgba(15,23,42,0.08)"
        pb="env(safe-area-inset-bottom)"
      >
        <Flex justify="space-around" align="stretch" px={1} pt={1.5} pb={1.5}>
          {CENTER_NAV.map((item) => {
            const path = item.to ? `/center-mgmt/${item.to}` : "/center-mgmt";
            const isActive = item.end
              ? activePath === "/center-mgmt"
              : activePath === path || activePath.startsWith(`${path}/`);

            return (
              <NavLink
                key={item.to || "home"}
                to={path}
                end={item.end}
                style={{ textDecoration: "none", flex: 1, minWidth: 0 }}
              >
                <VStack
                  spacing={0.5}
                  py={1.5}
                  px={0.5}
                  borderRadius="xl"
                  bg={isActive ? "blue.50" : "transparent"}
                  _dark={{ bg: isActive ? "whiteAlpha.100" : "transparent" }}
                  color={isActive ? ACCENT : navInactive}
                  transition="all 0.15s"
                >
                  <Icon as={item.icon} boxSize={4} />
                  <Text
                    fontSize="9px"
                    fontWeight={isActive ? "black" : "medium"}
                    noOfLines={1}
                    textAlign="center"
                    lineHeight="1.2"
                  >
                    {item.label}
                  </Text>
                </VStack>
              </NavLink>
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
}
