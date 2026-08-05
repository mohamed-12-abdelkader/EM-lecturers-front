import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

/** لوحة ألوان المسابقات اليومية — blue.500 + orange.500 */
export function useDailyQuizTheme() {
  return {
    pageBg: useColorModeValue(
      "linear-gradient(180deg, #F7F8FA 0%, #EEF2F7 48%, #F7F8FA 100%)",
      "linear-gradient(180deg, #0B1220 0%, #111827 55%, #0B1220 100%)",
    ),
    cardBg: useColorModeValue("white", "gray.800"),
    cardBorder: useColorModeValue("blackAlpha.100", "whiteAlpha.150"),
    muted: useColorModeValue("gray.500", "gray.400"),
    heading: useColorModeValue("gray.800", "white"),
    softBg: useColorModeValue("blue.50", "whiteAlpha.100"),
    accent: "orange.500",
    accentSoft: useColorModeValue("orange.50", "whiteAlpha.100"),
    primary: "blue.500",
    navy: useColorModeValue("blue.500", "blue.300"),
    filterBg: useColorModeValue("white", "gray.800"),
    shadow: useColorModeValue(
      "0 10px 30px -18px rgba(59, 130, 246, 0.22)",
      "0 12px 32px -18px rgba(0, 0, 0, 0.65)",
    ),
    hoverShadow: useColorModeValue(
      "0 18px 40px -20px rgba(249, 115, 22, 0.35)",
      "0 18px 40px -18px rgba(0, 0, 0, 0.75)",
    ),
  };
}

export function DailyQuizPageShell({ children, maxW = "6xl" }) {
  const theme = useDailyQuizTheme();
  return (
    <Box
      minH="100vh"
      bg={theme.pageBg}
      py={{ base: 5, md: 8 }}
      dir="rtl"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="-120px"
        insetInlineEnd="-80px"
        w="320px"
        h="320px"
        borderRadius="full"
        bg="orange.500"
        opacity={0.1}
        filter="blur(40px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-140px"
        insetInlineStart="-100px"
        w="360px"
        h="360px"
        borderRadius="full"
        bg="blue.500"
        opacity={0.1}
        filter="blur(50px)"
        pointerEvents="none"
      />
      <Box position="relative" maxW={maxW} mx="auto" px={{ base: 4, md: 6 }}>
        {children}
      </Box>
    </Box>
  );
}

export function DailyQuizHero({
  icon: IconComp,
  eyebrow,
  title,
  subtitle,
  actions,
  badges,
}) {
  const theme = useDailyQuizTheme();
  return (
    <Box
    mt={20}
      mb={6}
      borderRadius="3xl"
      overflow="hidden"
      borderWidth="1px"
      borderColor={theme.cardBorder}
      bg={theme.cardBg}
      boxShadow={theme.shadow}
      position="relative"
    >
      <Box
        position="absolute"
        inset={0}
        bgGradient={useColorModeValue(
          "linear(135deg, blue.600 0%, blue.500 45%, orange.500 120%)",
          "linear(135deg, blue.800 0%, blue.600 45%, orange.600 120%)",
        )}
      />
      <Box
        position="absolute"
        inset={0}
        opacity={0.18}
        backgroundImage="radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)"
        backgroundSize="18px 18px"
        pointerEvents="none"
      />
      <Flex
        position="relative"
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        gap={5}
        px={{ base: 5, md: 7 }}
        py={{ base: 5, md: 6 }}
        color="white"
      >
        <HStack spacing={4} align="start" minW={0}>
          <Flex
            w={{ base: 12, md: 14 }}
            h={{ base: 12, md: 14 }}
            borderRadius="2xl"
            bg="whiteAlpha.200"
            borderWidth="1px"
            borderColor="whiteAlpha.300"
            align="center"
            justify="center"
            flexShrink={0}
            backdropFilter="blur(8px)"
          >
            <Icon as={IconComp} boxSize={{ base: 5, md: 6 }} />
          </Flex>
          <Box minW={0}>
            {eyebrow ? (
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
                opacity={0.75}
                mb={1}
              >
                {eyebrow}
              </Text>
            ) : null}
            <Heading size={{ base: "md", md: "lg" }} letterSpacing="-0.02em" mb={1}>
              {title}
            </Heading>
            {subtitle ? (
              <Text fontSize="sm" opacity={0.88} lineHeight="1.8" maxW="560px">
                {subtitle}
              </Text>
            ) : null}
            {badges ? (
              <HStack mt={3} spacing={2} flexWrap="wrap">
                {badges}
              </HStack>
            ) : null}
          </Box>
        </HStack>
        {actions ? (
          <HStack spacing={2} flexWrap="wrap" flexShrink={0}>
            {actions}
          </HStack>
        ) : null}
      </Flex>
    </Box>
  );
}

export function DailyQuizStatusBadge({ status, label }) {
  const map = {
    draft: { bg: "whiteAlpha.200", color: "white", soft: "gray" },
    published: { bg: "blue.500", color: "white", soft: "blue" },
    archived: { bg: "orange.500", color: "white", soft: "orange" },
  };
  const conf = map[status] || map.draft;
  return (
    <Badge
      bg={conf.bg}
      color={conf.color}
      borderRadius="full"
      px={2.5}
      py={0.5}
      fontSize="10px"
      fontWeight="800"
      textTransform="none"
    >
      {label}
    </Badge>
  );
}

export function DailyQuizMetaChip({ children, colorScheme = "gray" }) {
  return (
    <Badge
      variant="subtle"
      colorScheme={colorScheme}
      borderRadius="full"
      px={2.5}
      py={0.5}
      fontSize="10px"
      fontWeight="700"
      textTransform="none"
    >
      {children}
    </Badge>
  );
}

export function DailyQuizSurface({ children, ...props }) {
  const theme = useDailyQuizTheme();
  return (
    <Box
      bg={theme.cardBg}
      borderWidth="1px"
      borderColor={theme.cardBorder}
      borderRadius="2xl"
      boxShadow={theme.shadow}
      {...props}
    >
      {children}
    </Box>
  );
}
