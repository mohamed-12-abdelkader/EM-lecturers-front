import React from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Button,
  VStack,
  HStack,
  IconButton,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  Center,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { FaSync, FaChevronLeft } from "react-icons/fa";

/** ألوان البراند — blue.500 + orange.500 */
export const LIBRARY_BRAND = {
  blue: "blue.500",
  orange: "orange.500",
  cardAccents: ["blue.500", "orange.500"],
};

export function libraryCardAccent(index = 0) {
  return LIBRARY_BRAND.cardAccents[index % LIBRARY_BRAND.cardAccents.length];
}

export function LibraryPageShell({ children }) {
  const pageBg = useColorModeValue("#F0F4FA", "gray.950");
  const mesh = useColorModeValue(
    "radial-gradient(ellipse 80% 50% at 100% -10%, rgba(49,130,206,0.14), transparent 55%), radial-gradient(ellipse 60% 40% at 0% 100%, rgba(221,107,32,0.1), transparent 50%)",
    "radial-gradient(ellipse 80% 50% at 100% -10%, rgba(49,130,206,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 0% 100%, rgba(221,107,32,0.12), transparent 50%)",
  );

  return (
    <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={12} dir="rtl" position="relative">
      <Box position="absolute" inset={0} bg={mesh} pointerEvents="none" />
      <Container maxW="container.xl" position="relative">
        <VStack spacing={6} align="stretch">
          {children}
        </VStack>
      </Container>
    </Box>
  );
}

export function LibraryBreadcrumb({ items = [] }) {
  const linkColor = useColorModeValue("whiteAlpha.800", "whiteAlpha.800");

  if (!items.length) return null;

  return (
    <Breadcrumb
      spacing={1}
      separator={<Icon as={FaChevronLeft} color="whiteAlpha.600" boxSize={3} />}
      fontSize="xs"
      mb={2}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <BreadcrumbItem key={item.label} isCurrentPage={isLast}>
            {isLast || !item.onClick ? (
              <Text color="white" fontWeight={isLast ? "semibold" : "medium"} noOfLines={1}>
                {item.label}
              </Text>
            ) : (
              <BreadcrumbLink
                color={linkColor}
                onClick={item.onClick}
                _hover={{ color: "white", textDecoration: "none" }}
                cursor="pointer"
              >
                {item.label}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}

export function LibraryHero({
  title,
  subtitle,
  icon: HeroIcon,
  breadcrumbs = [],
  onBack,
  onRefresh,
  isRefreshing,
  actions,
  accent = "blue",
}) {
  const brandBlue = useColorModeValue(
    "linear(135deg, #2B6CB0 0%, #3182CE 55%, #4299E1 100%)",
    "linear(135deg, #2C5282 0%, #2B6CB0 50%, #3182CE 100%)",
  );
  const brandBlueOrange = useColorModeValue(
    "linear(135deg, #2B6CB0 0%, #3182CE 45%, #DD6B20 100%)",
    "linear(135deg, #2C5282 0%, #3182CE 40%, #C05621 100%)",
  );
  const brandOrange = useColorModeValue(
    "linear(135deg, #C05621 0%, #DD6B20 45%, #3182CE 100%)",
    "linear(135deg, #9C4221 0%, #DD6B20 50%, #2B6CB0 100%)",
  );

  const gradients = {
    blue: brandBlue,
    orange: brandOrange,
    blend: brandBlueOrange,
  };
  const bg = gradients[accent] || gradients.blue;
  const heroShadow = useColorModeValue(
    "0 20px 40px -12px rgba(49, 130, 206, 0.35)",
    "0 20px 40px -12px rgba(49, 130, 206, 0.25)",
  );

  return (
    <Box
      borderRadius="2xl"
      overflow="hidden"
      bgGradient={bg}
      color="white"
      boxShadow={heroShadow}
      position="relative"
    >
      <Box
        position="absolute"
        top="-40%"
        left="-10%"
        w="320px"
        h="320px"
        borderRadius="full"
        bg="whiteAlpha.100"
        filter="blur(60px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-30%"
        right="-5%"
        w="240px"
        h="240px"
        borderRadius="full"
        bg="orange.400"
        opacity={0.25}
        filter="blur(50px)"
        pointerEvents="none"
      />

      <Flex
        p={{ base: 5, md: 7 }}
        align={{ base: "start", md: "center" }}
        justify="space-between"
        gap={4}
        flexWrap="wrap"
        position="relative"
      >
        <HStack spacing={4} align="start" flex={1} minW={0}>
          {onBack ? (
            <IconButton
              aria-label="رجوع"
              icon={<FaChevronLeft />}
              size="sm"
              variant="outline"
              color="white"
              borderColor="whiteAlpha.400"
              borderRadius="xl"
              onClick={onBack}
              _hover={{ bg: "whiteAlpha.200" }}
              flexShrink={0}
              mt={0.5}
            />
          ) : null}
          {HeroIcon ? (
            <Flex
              boxSize={{ base: 12, md: 14 }}
              borderRadius="2xl"
              bg="whiteAlpha.200"
              backdropFilter="blur(8px)"
              align="center"
              justify="center"
              flexShrink={0}
              borderWidth="1px"
              borderColor="whiteAlpha.300"
            >
              <Icon as={HeroIcon} boxSize={{ base: 5, md: 6 }} />
            </Flex>
          ) : null}
          <Box minW={0}>
            <LibraryBreadcrumb items={breadcrumbs} />
            <Heading size={{ base: "md", md: "lg" }} fontWeight="bold" lineHeight="1.25" letterSpacing="-0.02em">
              {title}
            </Heading>
            {subtitle ? (
              <Text color="whiteAlpha.900" fontSize="sm" mt={1.5} lineHeight="1.65" maxW="xl">
                {subtitle}
              </Text>
            ) : null}
          </Box>
        </HStack>

        <HStack spacing={2} flexShrink={0}>
          {actions}
          {onRefresh ? (
            <Button
              leftIcon={<FaSync />}
              size="sm"
              bg="whiteAlpha.200"
              backdropFilter="blur(8px)"
              color="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="whiteAlpha.300"
              _hover={{ bg: "whiteAlpha.300" }}
              onClick={onRefresh}
              isLoading={isRefreshing}
            >
              تحديث
            </Button>
          ) : null}
        </HStack>
      </Flex>
    </Box>
  );
}

const STAT_ACCENTS = {
  blue: { ring: "blue.100", iconBg: "blue.50", iconColor: "blue.500", darkRing: "blue.900", darkIconBg: "blue.900" },
  orange: { ring: "orange.100", iconBg: "orange.50", iconColor: "orange.500", darkRing: "orange.900", darkIconBg: "orange.900" },
};

export function LibraryStatCard({ label, value, sub, icon, accent = "blue" }) {
  const bg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.100", "gray.800");
  const valueColor = useColorModeValue("gray.900", "white");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const a = STAT_ACCENTS[accent] || STAT_ACCENTS.blue;
  const iconBg = useColorModeValue(a.iconBg, a.darkIconBg);
  const ring = useColorModeValue(a.ring, a.darkRing);

  return (
    <Box
      p={{ base: 4, md: 5 }}
      bg={bg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      boxShadow="0 1px 3px rgba(0,0,0,0.04)"
      transition="all 0.2s ease"
      _hover={{ boxShadow: "0 8px 24px rgba(0,0,0,0.06)", transform: "translateY(-2px)" }}
    >
      <Flex justify="space-between" align="center" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" fontWeight="medium" color={labelColor} mb={1.5} letterSpacing="0.02em">
            {label}
          </Text>
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color={valueColor} lineHeight="1">
            {typeof value === "number" ? value.toLocaleString("ar-EG") : value}
          </Text>
          {sub ? (
            <Text fontSize="xs" color={labelColor} mt={1.5} noOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </Box>
        <Flex w={12} h={12} borderRadius="xl" bg={iconBg} align="center" justify="center" flexShrink={0} ring="4px" ringColor={ring}>
          <Icon as={icon} color={a.iconColor} boxSize={5} />
        </Flex>
      </Flex>
    </Box>
  );
}

export function LibraryStatGrid({ children, columns = { base: 2, md: 3 } }) {
  return (
    <SimpleGrid columns={columns} spacing={{ base: 3, md: 4 }}>
      {children}
    </SimpleGrid>
  );
}

export function LibrarySectionHeader({ title, description, action, actionLabel, onAction, actionIcon: ActionIcon }) {
  const textColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex justify="space-between" align={{ base: "start", sm: "center" }} gap={3} flexWrap="wrap">
      <Box>
        <Heading size="sm" color={textColor} fontWeight="bold" letterSpacing="-0.01em">
          {title}
        </Heading>
        {description ? (
          <Text fontSize="sm" color={muted} mt={0.5}>
            {description}
          </Text>
        ) : null}
      </Box>
      {action || (onAction && actionLabel ? (
        <Button
          leftIcon={ActionIcon ? <Icon as={ActionIcon} /> : undefined}
          size="sm"
          colorScheme="blue"
          borderRadius="xl"
          px={5}
          shadow="sm"
          _hover={{ shadow: "md", transform: "translateY(-1px)" }}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null)}
    </Flex>
  );
}

export function LibraryEntityCard({
  title,
  subtitle,
  badges = [],
  meta,
  icon: EntityIcon,
  accentColor = "blue.500",
  onOpen,
  openLabel = "فتح",
  onEdit,
  onDelete,
}) {
  const cardBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const textColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const hoverBorder = useColorModeValue("blue.200", "blue.700");
  const hoverShadow = useColorModeValue(
    "0 12px 32px rgba(49,130,206,0.12)",
    "0 12px 32px rgba(49,130,206,0.2)",
  );
  const colorKey = accentColor.split(".")[0];
  const iconBg = useColorModeValue(`${colorKey}.50`, `${colorKey}.900`);
  const menuHover = useColorModeValue("gray.50", "whiteAlpha.100");
  const openBtnScheme = colorKey === "orange" ? "orange" : "blue";

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="0 1px 3px rgba(0,0,0,0.04)"
      transition="all 0.22s ease"
      _hover={{
        borderColor: hoverBorder,
        boxShadow: hoverShadow,
        transform: "translateY(-3px)",
      }}
      role="group"
    >
      <Box h="3px" bg={accentColor} opacity={0.85} />
      <Box p={{ base: 4, md: 5 }}>
        <Flex justify="space-between" align="start" gap={3} mb={4}>
          <HStack spacing={3} align="start" flex={1} minW={0}>
            {EntityIcon ? (
              <Flex
                w={11}
                h={11}
                borderRadius="xl"
                bg={iconBg}
                align="center"
                justify="center"
                flexShrink={0}
                transition="transform 0.2s"
                _groupHover={{ transform: "scale(1.05)" }}
              >
                <Icon as={EntityIcon} color={accentColor} boxSize={4} />
              </Flex>
            ) : null}
            <Box minW={0} flex={1}>
              <Text fontWeight="bold" color={textColor} noOfLines={2} fontSize="md" lineHeight="1.4">
                {title}
              </Text>
              {subtitle ? (
                <Text fontSize="xs" color={muted} mt={1} noOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </Box>
          </HStack>

          {(onEdit || onDelete) ? (
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="خيارات"
                icon={<Box as="span" fontSize="lg" lineHeight={1}>⋯</Box>}
                size="sm"
                variant="ghost"
                color={muted}
                borderRadius="lg"
                _hover={{ bg: menuHover }}
              />
              <MenuList borderRadius="xl" shadow="lg" minW="140px">
                {onEdit ? <MenuItem borderRadius="md" onClick={onEdit} fontSize="sm">تعديل</MenuItem> : null}
                {onDelete ? <MenuItem borderRadius="md" onClick={onDelete} fontSize="sm" color="red.500">حذف</MenuItem> : null}
              </MenuList>
            </Menu>
          ) : null}
        </Flex>

        {badges.length > 0 ? (
          <HStack spacing={2} mb={3} flexWrap="wrap">
            {badges.map((b) => (
              <Badge key={b.label} colorScheme={b.scheme || "blue"} borderRadius="full" px={2.5} py={0.5} fontSize="xs" fontWeight="semibold">
                {b.label}
              </Badge>
            ))}
          </HStack>
        ) : null}

        {meta ? <Text fontSize="xs" color={muted} mb={4}>{meta}</Text> : null}

        <Button w="full" size="sm" colorScheme={openBtnScheme} borderRadius="xl" fontWeight="semibold" onClick={onOpen} _hover={{ transform: "translateY(-1px)", shadow: "md" }}>
          {openLabel}
        </Button>
      </Box>
    </Box>
  );
}

export function LibraryEmptyState({ icon: EmptyIcon, title, description, actionLabel, onAction }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.800", "white");
  const iconBg = useColorModeValue("blue.50", "blue.900");

  return (
    <Center py={{ base: 14, md: 20 }} px={6} bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} borderStyle="dashed">
      <VStack spacing={4} maxW="sm" textAlign="center">
        {EmptyIcon ? (
          <Flex w={16} h={16} borderRadius="2xl" bg={iconBg} align="center" justify="center">
            <Icon as={EmptyIcon} boxSize={7} color="blue.500" />
          </Flex>
        ) : null}
        <Text fontWeight="bold" fontSize="lg" color={titleColor}>{title}</Text>
        {description ? <Text fontSize="sm" color={muted} lineHeight="1.7">{description}</Text> : null}
        {onAction && actionLabel ? (
          <Button colorScheme="blue" borderRadius="xl" size="md" onClick={onAction} mt={1}>{actionLabel}</Button>
        ) : null}
      </VStack>
    </Center>
  );
}

export function LibraryLoadingState() {
  return (
    <Center py={20}>
      <VStack spacing={4}>
        <Spinner size="lg" color="blue.500" thickness="3px" speed="0.8s" />
        <Text fontSize="sm" color="gray.500">جاري التحميل...</Text>
      </VStack>
    </Center>
  );
}

export function LibraryToolbar({ children }) {
  const bg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.100", "gray.800");

  return (
    <Box p={{ base: 3, md: 4 }} bg={bg} borderRadius="2xl" borderWidth="1px" borderColor={border} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
      <Flex gap={2} flexWrap="wrap" align="center">{children}</Flex>
    </Box>
  );
}

export function LibraryFilterPanel({ children, hint }) {
  const bg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.100", "gray.800");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box p={{ base: 4, md: 5 }} bg={bg} borderRadius="2xl" borderWidth="1px" borderColor={border} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
      {children}
      {hint ? <Text fontSize="xs" color={muted} mt={3}>{hint}</Text> : null}
    </Box>
  );
}

export function LibraryContentSection({ title, count, children, badgeColorScheme = "blue" }) {
  const textColor = useColorModeValue("gray.900", "white");
  const line = useColorModeValue("gray.200", "gray.700");

  return (
    <Box>
      <Flex align="center" gap={3} mb={4}>
        <Heading size="sm" color={textColor} fontWeight="bold" flexShrink={0}>{title}</Heading>
        {count != null ? <Badge colorScheme={badgeColorScheme} borderRadius="full" px={2.5} fontSize="xs">{count}</Badge> : null}
        <Box flex={1} h="1px" bg={line} />
      </Flex>
      {children}
    </Box>
  );
}

export const libraryModalProps = { motionPreset: "slideInBottom", isCentered: true };

export function libraryModalContentProps() {
  return { borderRadius: "2xl", shadow: "2xl", mx: 4 };
}
