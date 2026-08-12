import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { ACCENT } from "../academyUtils";

export function KpiCard({ label, value, sub, icon, color = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("slate.200", "gray.700");
  const titleColor = useColorModeValue("slate.900", "white");
  const softMap = {
    blue: { soft: "blue.50", softDark: "whiteAlpha.100", icon: "blue.500", bar: ACCENT },
    teal: { soft: "teal.50", softDark: "whiteAlpha.100", icon: "teal.500", bar: "#319795" },
    green: { soft: "green.50", softDark: "whiteAlpha.100", icon: "green.500", bar: "#38A169" },
    orange: { soft: "orange.50", softDark: "whiteAlpha.100", icon: "orange.500", bar: "#DD6B20" },
    purple: { soft: "purple.50", softDark: "whiteAlpha.100", icon: "purple.500", bar: "#805AD5" },
  };
  const c = softMap[color] || softMap.blue;
  const softBg = useColorModeValue(c.soft, c.softDark);

  return (
    <Box
      p={{ base: 4, md: 5 }}
      bg={bg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      position="relative"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{ borderColor: `${color}.300`, transform: "translateY(-2px)", shadow: "md" }}
    >
      <Box position="absolute" top={0} insetInlineStart={0} w="3px" h="full" bg={c.bar} />
      <Flex justify="space-between" align="flex-start" gap={2}>
        <Box minW={0} flex={1}>
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="semibold">
            {label}
          </Text>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="black" color={titleColor} lineHeight="1.2">
            {value}
          </Text>
          {sub ? (
            <Text fontSize="xs" color="gray.400" mt={1}>
              {sub}
            </Text>
          ) : null}
        </Box>
        {icon ? (
          <Flex w={10} h={10} borderRadius="xl" bg={softBg} align="center" justify="center" flexShrink={0}>
            <Icon as={icon} color={c.icon} boxSize={4} />
          </Flex>
        ) : null}
      </Flex>
    </Box>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <Flex
      justify="space-between"
      align={{ base: "flex-start", md: "center" }}
      gap={4}
      mb={{ base: 5, md: 6 }}
      flexDir={{ base: "column", md: "row" }}
    >
      <Box>
        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="black" letterSpacing="-0.02em">
          {title}
        </Text>
        {description ? (
          <Text fontSize="sm" color="gray.500" mt={1}>
            {description}
          </Text>
        ) : null}
      </Box>
      {action || null}
    </Flex>
  );
}

export function Surface({ children, ...props }) {
  const bg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("slate.200", "gray.700");
  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="2xl"
      overflow="hidden"
      {...props}
    >
      {children}
    </Box>
  );
}

export function LoadingBlock({ label = "جاري التحميل..." }) {
  return (
    <Flex direction="column" align="center" justify="center" py={16} gap={3}>
      <Spinner size="lg" color={ACCENT} thickness="3px" />
      <Text color="gray.500" fontSize="sm">
        {label}
      </Text>
    </Flex>
  );
}

export function EmptyState({ title, description, action }) {
  const border = useColorModeValue("slate.200", "gray.700");
  const bg = useColorModeValue("slate.50", "gray.800");
  return (
    <Flex direction="column" align="center" textAlign="center" py={12} px={6} bg={bg} borderRadius="2xl" borderWidth="1px" borderColor={border}>
      <Text fontWeight="bold" fontSize="lg" mb={2}>
        {title}
      </Text>
      {description ? (
        <Text fontSize="sm" color="gray.500" maxW="420px" mb={4}>
          {description}
        </Text>
      ) : null}
      {action || null}
    </Flex>
  );
}

export function StatusBadge({ active, activeLabel = "نشط", inactiveLabel = "معطّل" }) {
  return (
    <Badge colorScheme={active !== false ? "green" : "gray"} borderRadius="full" px={2.5} py={0.5} fontSize="xs">
      {active !== false ? activeLabel : inactiveLabel}
    </Badge>
  );
}

export function DataRow({ label, value, ltr }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowBorder = useColorModeValue("gray.100", "whiteAlpha.100");
  return (
    <HStack justify="space-between" py={2.5} borderBottomWidth="1px" borderColor={rowBorder} spacing={4}>
      <Text fontSize="sm" color={muted} flexShrink={0}>
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="semibold" textAlign="left" dir={ltr ? "ltr" : "rtl"} noOfLines={2}>
        {value ?? "—"}
      </Text>
    </HStack>
  );
}
