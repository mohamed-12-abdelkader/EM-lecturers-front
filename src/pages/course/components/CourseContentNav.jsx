import React from "react";
import {
  Box,
  Flex,
  HStack,
  Text,
  Icon,
  Badge,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";

/**
 * تنقّل محتوى الكورس — تخطيط dashboard:
 * قائمة جانبية (يمين في RTL) بعناصر كبيرة واضحة (أيقونة + اسم + وصف + عداد)،
 * وعلى الموبايل بتتحول لكروت أفقية قابلة للتمرير.
 */

const SECTION_COLORS = {
  red: { accent: "#E53E3E", scheme: "red" },
  blue: { accent: "#3182CE", scheme: "blue" },
  green: { accent: "#38A169", scheme: "green" },
  purple: { accent: "#805AD5", scheme: "purple" },
  orange: { accent: "#DD6B20", scheme: "orange" },
};

function getColors(colorKey) {
  return SECTION_COLORS[colorKey] || SECTION_COLORS.blue;
}

function LiveDot() {
  return (
    <Box position="relative" w={2.5} h={2.5} flexShrink={0}>
      <Box
        position="absolute"
        inset={0}
        borderRadius="full"
        bg="red.500"
        animation="ping 1.2s cubic-bezier(0,0,0.2,1) infinite"
        sx={{
          "@keyframes ping": {
            "75%, 100%": { transform: "scale(2.2)", opacity: 0 },
          },
        }}
      />
      <Box position="absolute" inset={0} borderRadius="full" bg="red.500" />
    </Box>
  );
}

function NavItem({ section, isActive, onClick }) {
  const colors = getColors(section.colorKey);
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const titleColor = useColorModeValue("gray.800", "white");
  const descColor = useColorModeValue("gray.500", "gray.400");
  const idleIconBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const idleIconColor = useColorModeValue("gray.500", "gray.400");
  const hoverBorder = useColorModeValue(`${colors.accent}55`, `${colors.accent}77`);

  return (
    <Flex
      as="button"
      type="button"
      onClick={onClick}
      w="full"
      align="center"
      gap={3}
      px={3.5}
      py={3}
      bg={cardBg}
      border="2px solid"
      borderColor={isActive ? colors.accent : border}
      borderRadius="2xl"
      cursor="pointer"
      textAlign="start"
      position="relative"
      overflow="hidden"
      transition="all 0.18s ease"
      boxShadow={isActive ? `0 8px 20px ${colors.accent}30` : "none"}
      _hover={{
        borderColor: isActive ? colors.accent : hoverBorder,
        transform: "translateY(-1px)",
      }}
    >
      {isActive ? (
        <Box
          position="absolute"
          top={0}
          bottom={0}
          right={0}
          w="5px"
          bg={colors.accent}
        />
      ) : null}

      <Flex
        w="42px"
        h="42px"
        align="center"
        justify="center"
        borderRadius="xl"
        bg={isActive ? colors.accent : idleIconBg}
        color={isActive ? "white" : idleIconColor}
        flexShrink={0}
        transition="all 0.18s ease"
      >
        <Icon as={section.icon} boxSize={5} />
      </Flex>

      <Box flex={1} minW={0}>
        <HStack spacing={2}>
          <Text
            fontWeight="800"
            fontSize="sm"
            color={isActive ? colors.accent : titleColor}
            noOfLines={1}
          >
            {section.label}
          </Text>
          {section.live ? <LiveDot /> : null}
        </HStack>
        <Text fontSize="xs" color={descColor} noOfLines={1} mt={0.5}>
          {section.desc}
        </Text>
      </Box>

      {section.count != null ? (
        <Badge
          colorScheme={isActive ? colors.scheme : "gray"}
          variant={isActive ? "solid" : "subtle"}
          borderRadius="full"
          px={2.5}
          py={0.5}
          fontSize="xs"
          flexShrink={0}
        >
          {section.count}
        </Badge>
      ) : null}
    </Flex>
  );
}

function MobileNavItem({ section, isActive, onClick }) {
  const colors = getColors(section.colorKey);
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const titleColor = useColorModeValue("gray.700", "gray.200");
  const idleIconBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const idleIconColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex
      as="button"
      type="button"
      onClick={onClick}
      direction="column"
      align="center"
      justify="center"
      gap={1.5}
      minW="96px"
      px={3}
      py={2.5}
      bg={cardBg}
      border="2px solid"
      borderColor={isActive ? colors.accent : border}
      borderRadius="xl"
      cursor="pointer"
      flexShrink={0}
      transition="all 0.18s ease"
      boxShadow={isActive ? `0 6px 16px ${colors.accent}30` : "none"}
      position="relative"
    >
      {section.live ? (
        <Box position="absolute" top={2} left={2}>
          <LiveDot />
        </Box>
      ) : null}
      <Flex
        w="34px"
        h="34px"
        align="center"
        justify="center"
        borderRadius="lg"
        bg={isActive ? colors.accent : idleIconBg}
        color={isActive ? "white" : idleIconColor}
        transition="all 0.18s ease"
      >
        <Icon as={section.icon} boxSize={4} />
      </Flex>
      <HStack spacing={1}>
        <Text
          fontSize="11px"
          fontWeight="700"
          color={isActive ? colors.accent : titleColor}
          whiteSpace="nowrap"
        >
          {section.label}
        </Text>
        {section.count != null ? (
          <Text fontSize="10px" fontWeight="800" color={isActive ? colors.accent : "gray.400"}>
            ({section.count})
          </Text>
        ) : null}
      </HStack>
    </Flex>
  );
}

export default function CourseContentNav({ sections, activeId, onChange }) {
  return (
    <>
      {/* موبايل — كروت أفقية مدمجة */}
      <Flex
        display={{ base: "flex", md: "none" }}
        gap={2}
        overflowX="auto"
        pb={2}
        px={0.5}
        sx={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {sections.map((section) => (
          <MobileNavItem
            key={section.id}
            section={section}
            isActive={activeId === section.id}
            onClick={() => onChange(section.id)}
          />
        ))}
      </Flex>

      {/* ديسكتوب — شريط أفقي أعلى المحتوى */}
      <SimpleGrid
        display={{ base: "none", md: "grid" }}
        columns={{ md: 2, xl: 4 }}
        spacing={3}
      >
        {sections.map((section) => (
          <NavItem
            key={section.id}
            section={section}
            isActive={activeId === section.id}
            onClick={() => onChange(section.id)}
          />
        ))}
      </SimpleGrid>
    </>
  );
}

/** هيدر بسيط أعلى محتوى القسم النشط */
export function SectionPanelHeader({ section }) {
  const colors = getColors(section.colorKey);
  const titleColor = useColorModeValue("gray.900", "white");
  const descColor = useColorModeValue("gray.500", "gray.400");
  const border = useColorModeValue("gray.100", "whiteAlpha.100");

  return (
    <Flex
      align="center"
      gap={3}
      pb={4}
      mb={5}
      borderBottom="1px solid"
      borderColor={border}
    >
      <Flex
        w="44px"
        h="44px"
        align="center"
        justify="center"
        borderRadius="xl"
        bg={colors.accent}
        color="white"
        flexShrink={0}
        boxShadow={`0 6px 16px ${colors.accent}40`}
      >
        <Icon as={section.icon} boxSize={5} />
      </Flex>
      <Box minW={0}>
        <HStack spacing={2} flexWrap="wrap">
          <Text
            fontWeight="800"
            fontSize={{ base: "lg", md: "xl" }}
            color={titleColor}
            fontFamily="heading"
          >
            {section.label}
          </Text>
          {section.live ? (
            <Badge
              colorScheme="red"
              variant="solid"
              borderRadius="full"
              px={2.5}
              animation="pulse 1.5s ease-in-out infinite"
            >
              مباشر الآن
            </Badge>
          ) : null}
          {section.count != null ? (
            <Badge
              colorScheme={colors.scheme}
              variant="subtle"
              borderRadius="full"
              px={2.5}
            >
              {section.count}
            </Badge>
          ) : null}
        </HStack>
        <Text fontSize="sm" color={descColor} mt={0.5}>
          {section.desc}
        </Text>
      </Box>
    </Flex>
  );
}
