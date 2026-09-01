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
      minW={0}
      align="center"
      gap={{ base: 2, md: 3 }}
      px={{ base: 2.5, md: 3.5 }}
      py={{ base: 2.5, md: 3 }}
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
        w={{ base: "36px", md: "42px" }}
        h={{ base: "36px", md: "42px" }}
        align="center"
        justify="center"
        borderRadius="xl"
        bg={isActive ? colors.accent : idleIconBg}
        color={isActive ? "white" : idleIconColor}
        flexShrink={0}
        transition="all 0.18s ease"
      >
        <Icon as={section.icon} boxSize={{ base: 4, md: 5 }} />
      </Flex>

      <Box flex={1} minW={0}>
        <HStack spacing={1.5}>
          <Text
            fontWeight="800"
            fontSize={{ base: "xs", md: "sm" }}
            color={isActive ? colors.accent : titleColor}
            noOfLines={1}
          >
            {section.label}
          </Text>
          {section.live ? <LiveDot /> : null}
        </HStack>
        <Text
          fontSize="xs"
          color={descColor}
          noOfLines={1}
          mt={0.5}
          display={{ base: "none", sm: "block" }}
        >
          {section.desc}
        </Text>
      </Box>

      {section.count != null ? (
        <Badge
          colorScheme={isActive ? colors.scheme : "gray"}
          variant={isActive ? "solid" : "subtle"}
          borderRadius="full"
          px={2}
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

export default function CourseContentNav({ sections, activeId, onChange }) {
  return (
    <SimpleGrid columns={2} spacing={{ base: 2, md: 3 }} w="full">
      {sections.map((section) => (
        <NavItem
          key={section.id}
          section={section}
          isActive={activeId === section.id}
          onClick={() => onChange(section.id)}
        />
      ))}
    </SimpleGrid>
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
