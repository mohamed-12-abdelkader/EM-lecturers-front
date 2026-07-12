import { NavLink, Outlet } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  HStack,
  Text,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { FaSchool } from "react-icons/fa";
import { ACCENT, CENTER_NAV } from "../centerMgmtUtils";

export default function CenterLayout() {
  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const navInactive = useColorModeValue("gray.600", "gray.300");
  const navHoverBg = useColorModeValue("gray.50", "gray.700");

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" className="mt-[40px]">
      <Box
        bg={cardBg}
        borderBottomWidth="1px"
        borderColor={border}
        position="sticky"
        top={0}
        zIndex={20}
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
                <Icon as={FaSchool} color={ACCENT} />
              </Flex>
              <Box>
                <Text fontWeight="bold" fontSize="lg" lineHeight="1.2">
                  إدارة السنتر
                </Text>
                <Text fontSize="xs" color={muted} mt={1}>
                  مجموعات · طلاب · حضور · اشتراكات · مدفوعات
                </Text>
              </Box>
            </HStack>
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
              const path = item.to ? `/center-mgmt/${item.to}` : "/center-mgmt";
              return (
                <NavLink
                  key={item.to || "home"}
                  to={path}
                  end={item.end}
                  style={{ textDecoration: "none" }}
                >
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
        </Container>
      </Box>

      <Container maxW="7xl" py={{ base: 5, md: 8 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
