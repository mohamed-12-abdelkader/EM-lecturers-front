import React from "react";
import { Box, HStack, VStack, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaBookOpen, FaRobot, FaClipboardList } from "react-icons/fa";
import { SHELL_DESKTOP_BP } from "../../theme/chakraTheme";

const STUDENT_NAV_ITEMS = [
  { label: "الرئيسية", href: "/home", icon: FaHome },
  { label: "كورساتي", href: "/my-courses", icon: FaBookOpen },
  { label: "المساعد العلمي", href: "/scientific-chat", icon: FaRobot },
  { label: "امتحاناتي", href: "/exam_grades", icon: FaClipboardList },
];

const BottomNavItems = () => {
  const location = useLocation();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const activeColor = "blue.500";
  const inactiveColor = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const shadow = useColorModeValue("0 -4px 20px rgba(0,0,0,0.06)", "0 -4px 20px rgba(0,0,0,0.35)");
  const activeTextColor = useColorModeValue("blue.600", "blue.300");

  const isActivePath = (href) => {
    if (href === "/home") {
      return location.pathname === "/home" || location.pathname === "/";
    }
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  return (
    <Box
      as="nav"
      aria-label="التنقل السفلي"
      data-tour-id="student-bottom-nav"
      display={{ base: "block", [SHELL_DESKTOP_BP]: "none" }}
      position="fixed"
      bottom={0}
      left={0}
      width="100%"
      bg={bg}
      borderTop="1px solid"
      borderColor={borderColor}
      zIndex={1000}
      pb="env(safe-area-inset-bottom)"
      boxShadow={shadow}
    >
      <HStack justify="space-around" align="stretch" py={1.5} px={1} spacing={0}>
        {STUDENT_NAV_ITEMS.map((item) => {
          const IconComp = item.icon;
          const active = isActivePath(item.href);
          return (
            <VStack
              key={item.href}
              as={Link}
              to={item.href}
              spacing={0.5}
              flex={1}
              minW={0}
              py={1.5}
              px={1}
              borderRadius="xl"
              transition="all 0.15s"
              _hover={{ textDecoration: "none", bg: hoverBg }}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                as={IconComp}
                boxSize={5}
                color={active ? activeColor : inactiveColor}
              />
              <Text
                fontSize="xs"
                color={active ? activeTextColor : inactiveColor}
                fontWeight={active ? "bold" : "medium"}
                textAlign="center"
                lineHeight="1.2"
                noOfLines={2}
              >
                {item.label}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    </Box>
  );
};

export default BottomNavItems;
