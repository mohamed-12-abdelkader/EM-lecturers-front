import { HStack, Button, Box, useColorModeValue } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { ADMIN_WA_NAV } from "./waTheme";

export default function WaServiceNav({ items = ADMIN_WA_NAV }) {
  const { pathname } = useLocation();
  const border = useColorModeValue("gray.200", "gray.700");
  const trackBg = useColorModeValue("white", "gray.800");

  return (
    <Box
      bg={trackBg}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      px={2}
      py={2}
      overflowX="auto"
      css={{
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { height: "6px" },
      }}
    >
      <HStack spacing={1.5} minW="max-content">
        {items.map((item) => {
          const active =
            pathname === item.to ||
            pathname.startsWith(`${item.to}/`) ||
            (item.key && pathname.includes(`/whatsapp/${item.key}`));
          return (
            <Button
              key={item.to}
              as={RouterLink}
              to={item.to}
              size="sm"
              variant={active ? "solid" : "ghost"}
              colorScheme={active ? "green" : "gray"}
              borderRadius="full"
              fontWeight={active ? "800" : "600"}
              flexShrink={0}
            >
              {item.label}
            </Button>
          );
        })}
      </HStack>
    </Box>
  );
}
