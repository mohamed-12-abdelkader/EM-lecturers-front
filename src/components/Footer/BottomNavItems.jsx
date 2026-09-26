import React from "react";
import { Box, HStack, VStack, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import {
  HiHome,
  HiOutlineHome,
  HiBookOpen,
  HiOutlineBookOpen,
  HiSparkles,
  HiOutlineSparkles,
  HiClipboardDocumentList,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import { BOTTOM_NAV_MAX_BP } from "../../theme/chakraTheme";

const BRAND_BLUE = "#3182CE";
const BRAND_BLUE_SOFT = "rgba(49, 130, 206, 0.12)";

const STUDENT_NAV_ITEMS = [
  {
    label: "الرئيسية",
    href: "/home",
    icon: HiOutlineHome,
    iconActive: HiHome,
  },
  {
    label: "كورساتي",
    href: "/my-courses",
    icon: HiOutlineBookOpen,
    iconActive: HiBookOpen,
  },
  {
    label: "المساعد",
    href: "/scientific-chat",
    icon: HiOutlineSparkles,
    iconActive: HiSparkles,
    fullLabel: "المساعد العلمي",
  },
  {
    label: "امتحاناتي",
    href: "/exam_grades",
    icon: HiOutlineClipboardDocumentList,
    iconActive: HiClipboardDocumentList,
  },
];

const BottomNavItems = () => {
  const location = useLocation();
  const bg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(26,32,44,0.94)");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const inactiveColor = useColorModeValue("gray.500", "gray.400");
  const shadow = useColorModeValue(
    "0 -8px 28px rgba(15, 23, 42, 0.08)",
    "0 -8px 28px rgba(0, 0, 0, 0.45)",
  );

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
      display={{ base: "block", [BOTTOM_NAV_MAX_BP]: "none" }}
      position="fixed"
      bottom={0}
      left={0}
      width="100%"
      zIndex={1000}
      pb="env(safe-area-inset-bottom)"
      sx={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
      bg={bg}
      borderTop="1px solid"
      borderColor={borderColor}
      boxShadow={shadow}
    >
      <Box
        h="2px"
        w="100%"
        bgGradient={`linear(to-l, ${BRAND_BLUE}, #DD6B20)`}
        opacity={0.85}
        aria-hidden
      />

      <HStack justify="space-around" align="stretch" py={1.5} px={1.5} spacing={0}>
        {STUDENT_NAV_ITEMS.map((item) => {
          const active = isActivePath(item.href);
          const IconComp = active ? item.iconActive : item.icon;
          const ariaLabel = item.fullLabel || item.label;

          return (
            <VStack
              key={item.href}
              as={Link}
              to={item.href}
              spacing={0}
              flex={1}
              minW={0}
              py={1}
              px={0.5}
              borderRadius="2xl"
              transition="all 0.18s ease"
              _hover={{ textDecoration: "none" }}
              aria-label={ariaLabel}
              aria-current={active ? "page" : undefined}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="44px"
                h="32px"
                borderRadius="full"
                bg={active ? BRAND_BLUE_SOFT : "transparent"}
                color={active ? BRAND_BLUE : inactiveColor}
                transition="all 0.18s ease"
                position="relative"
              >
                <Icon as={IconComp} boxSize="22px" />
                {active ? (
                  <Box
                    position="absolute"
                    top="-2px"
                    w="4px"
                    h="4px"
                    borderRadius="full"
                    bg={BRAND_BLUE}
                    aria-hidden
                  />
                ) : null}
              </Box>
              <Text
                mt={0.5}
                fontSize="11px"
                letterSpacing="-0.01em"
                color={active ? BRAND_BLUE : inactiveColor}
                fontWeight={active ? "800" : "600"}
                textAlign="center"
                lineHeight="1.15"
                noOfLines={1}
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
