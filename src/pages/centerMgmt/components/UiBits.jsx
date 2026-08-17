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
import { ACCENT, ACCENT_HOVER } from "../centerMgmtUtils";

export function KpiCard({ label, value, sub, icon, color = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "white");
  const softMap = {
    blue: { soft: "blue.50", softDark: "whiteAlpha.100", icon: "blue.500", bar: ACCENT },
    teal: { soft: "teal.50", softDark: "whiteAlpha.100", icon: "teal.500", bar: "#319795" },
    green: { soft: "green.50", softDark: "whiteAlpha.100", icon: "green.500", bar: "#38A169" },
    orange: { soft: "orange.50", softDark: "whiteAlpha.100", icon: "orange.500", bar: "#DD6B20" },
    red: { soft: "red.50", softDark: "whiteAlpha.100", icon: "red.500", bar: "#E53E3E" },
    purple: { soft: "purple.50", softDark: "whiteAlpha.100", icon: "purple.500", bar: "#805AD5" },
    yellow: { soft: "yellow.50", softDark: "whiteAlpha.100", icon: "yellow.600", bar: "#D69E2E" },
  };
  const c = softMap[color] || softMap.blue;
  const softBg = useColorModeValue(c.soft, c.softDark);

  return (
    <Box
      p={{ base: 3.5, md: 5 }}
      bg={bg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      position="relative"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{ borderColor: `${color}.300`, transform: "translateY(-2px)", shadow: "md" }}
    >
      <Box
        position="absolute"
        top={0}
        insetInlineStart={0}
        w="3px"
        h="full"
        bg={c.bar}
        borderTopLeftRadius="2xl"
        borderBottomLeftRadius="2xl"
      />
      <Flex justify="space-between" align="flex-start" gap={2}>
        <Box minW={0} flex={1}>
          <Text fontSize={{ base: "10px", md: "xs" }} color="gray.500" mb={1} fontWeight="semibold" noOfLines={1}>
            {label}
          </Text>
          <Text
            fontSize={{ base: "md", md: "xl" }}
            fontWeight="black"
            color={titleColor}
            lineHeight="1.25"
            noOfLines={2}
            wordBreak="break-word"
          >
            {value}
          </Text>
          {sub ? (
            <Text fontSize="xs" color="gray.400" mt={1} noOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </Box>
        {icon ? (
          <Flex
            w={{ base: 9, md: 10 }}
            h={{ base: 9, md: 10 }}
            borderRadius="xl"
            bg={softBg}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={icon} color={c.icon} boxSize={{ base: 3.5, md: 4 }} />
          </Flex>
        ) : null}
      </Flex>
    </Box>
  );
}

export function EmptyState({ icon, title, description, action }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("gray.50", "gray.800");
  const titleColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={{ base: 10, md: 14 }}
      px={5}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={border}
      borderRadius="2xl"
      bg={bg}
      textAlign="center"
      gap={3}
    >
      {icon ? (
        <Flex
          w={14}
          h={14}
          borderRadius="2xl"
          bg="blue.50"
          _dark={{ bg: "whiteAlpha.100" }}
          align="center"
          justify="center"
        >
          <Icon as={icon} boxSize={7} color="blue.400" />
        </Flex>
      ) : null}
      <Text fontWeight="black" fontSize={{ base: "md", md: "lg" }} color={titleColor}>
        {title}
      </Text>
      {description ? (
        <Text fontSize="sm" color="gray.500" maxW="md" lineHeight="1.7">
          {description}
        </Text>
      ) : null}
      {action}
    </Flex>
  );
}

export function PageHeader({ title, description, actions }) {
  const titleColor = useColorModeValue("gray.900", "white");
  return (
    <Flex
      direction={{ base: "column", sm: "row" }}
      justify="space-between"
      align={{ base: "stretch", sm: "center" }}
      gap={3}
      mb={{ base: 4, md: 6 }}
    >
      <Box minW={0}>
        <Text
          as="h1"
          fontSize={{ base: "lg", md: "2xl" }}
          fontWeight="black"
          color={titleColor}
          letterSpacing="-0.02em"
        >
          {title}
        </Text>
        {description ? (
          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" mt={1} lineHeight="1.6">
            {description}
          </Text>
        ) : null}
      </Box>
      {actions ? (
        <Flex
          gap={2}
          flexWrap="wrap"
          w={{ base: "full", sm: "auto" }}
          sx={{
            "& > *": {
              flex: { base: "1 1 auto", sm: "0 0 auto" },
              minW: { base: "0", sm: "auto" },
            },
          }}
        >
          {actions}
        </Flex>
      ) : null}
    </Flex>
  );
}

export function LoadingBlock({ label = "جاري التحميل..." }) {
  return (
    <VStack py={{ base: 12, md: 16 }} spacing={3}>
      <Spinner color={ACCENT} thickness="3px" size="lg" />
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
    </VStack>
  );
}

export function Surface({ children, ...props }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="2xl"
      p={{ base: 3.5, md: 5 }}
      {...props}
    >
      {children}
    </Box>
  );
}

/** Compact filter panel wrapper */
export function FilterBar({ children }) {
  return (
    <Surface mb={{ base: 4, md: 5 }} p={{ base: 3, md: 4 }}>
      {children}
    </Surface>
  );
}

/** Mobile-first list row / card — uses div (not button) so nested controls stay valid */
export function ListCard({ children, onClick, ...props }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const hoverBorder = useColorModeValue("blue.200", "blue.700");
  const bg = useColorModeValue("white", "gray.800");
  return (
    <Box
      w="full"
      textAlign="right"
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="2xl"
      p={{ base: 3.5, md: 4 }}
      transition="all 0.18s ease"
      cursor={onClick ? "pointer" : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      _hover={
        onClick
          ? {
              borderColor: hoverBorder,
              shadow: "sm",
              transform: "translateY(-1px)",
            }
          : undefined
      }
      onClick={onClick}
      {...props}
    >
      {children}
    </Box>
  );
}

export function StatusBadge({ scheme = "gray", children, ...props }) {
  return (
    <Badge
      colorScheme={scheme}
      borderRadius="full"
      px={2.5}
      py={0.5}
      fontSize="xs"
      fontWeight="bold"
      {...props}
    >
      {children}
    </Badge>
  );
}

export function PaginationBar({ page, totalPages, onPrev, onNext }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <Flex
      justify="center"
      align="center"
      gap={3}
      mt={5}
      py={2}
    >
      <Button
        size="sm"
        variant="outline"
        borderRadius="xl"
        isDisabled={page <= 1}
        onClick={onPrev}
        minW="72px"
      >
        السابق
      </Button>
      <HStack spacing={1} px={2}>
        <Text fontSize="sm" fontWeight="bold" color="gray.700" _dark={{ color: "gray.200" }}>
          {page}
        </Text>
        <Text fontSize="sm" color="gray.400">
          /
        </Text>
        <Text fontSize="sm" color="gray.500">
          {totalPages}
        </Text>
      </HStack>
      <Button
        size="sm"
        variant="outline"
        borderRadius="xl"
        isDisabled={page >= totalPages}
        onClick={onNext}
        minW="72px"
      >
        التالي
      </Button>
    </Flex>
  );
}

export function PrimaryButton({ children, ...props }) {
  return (
    <Button
      bg={ACCENT}
      color="white"
      borderRadius="xl"
      fontWeight="bold"
      _hover={{ bg: ACCENT_HOVER }}
      _active={{ bg: ACCENT_HOVER }}
      {...props}
    >
      {children}
    </Button>
  );
}

/** Desktop table / mobile cards switcher shell */
export function DesktopOnly({ children }) {
  return (
    <Box display={{ base: "none", md: "block" }}>{children}</Box>
  );
}

export function MobileOnly({ children }) {
  return (
    <Box display={{ base: "block", md: "none" }}>{children}</Box>
  );
}
