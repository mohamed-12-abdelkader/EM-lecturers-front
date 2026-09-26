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
    <Box position="relative" w={2} h={2} flexShrink={0}>
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

function CountBadge({ section, isActive, colors, ...props }) {
  if (section.count == null) return null;
  return (
    <Badge
      colorScheme={isActive ? colors.scheme : "gray"}
      variant={isActive ? "solid" : "subtle"}
      borderRadius="full"
      px={2}
      py={0.5}
      fontSize={{ base: "10px", md: "xs" }}
      flexShrink={0}
      {...props}
    >
      {section.count}
    </Badge>
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
      direction={{ base: "column", md: "row" }}
      align={{ base: "stretch", md: "center" }}
      gap={{ base: 1.5, md: 3 }}
      px={{ base: 2, md: 3.5 }}
      py={{ base: 2, md: 3 }}
      bg={cardBg}
      border="2px solid"
      borderColor={isActive ? colors.accent : border}
      borderRadius="xl"
      cursor="pointer"
      textAlign="start"
      position="relative"
      overflow="hidden"
      transition="all 0.18s ease"
      boxShadow={isActive ? `0 6px 16px ${colors.accent}28` : "sm"}
      _hover={{
        borderColor: isActive ? colors.accent : hoverBorder,
        transform: { md: "translateY(-1px)" },
      }}
    >
      {isActive ? (
        <Box
          position="absolute"
          top={0}
          bottom={0}
          right={0}
          w="4px"
          bg={colors.accent}
          display={{ base: "none", md: "block" }}
        />
      ) : null}

      {/* Mobile header row: icon + count */}
      <Flex
        display={{ base: "flex", md: "none" }}
        align="center"
        justify="space-between"
        w="full"
      >
        <Flex
          w="30px"
          h="30px"
          align="center"
          justify="center"
          borderRadius="lg"
          bg={isActive ? colors.accent : idleIconBg}
          color={isActive ? "white" : idleIconColor}
          flexShrink={0}
        >
          <Icon as={section.icon} boxSize={3.5} />
        </Flex>
        <HStack spacing={1.5}>
          {section.live ? <LiveDot /> : null}
          <CountBadge section={section} isActive={isActive} colors={colors} />
        </HStack>
      </Flex>

      <Text
        display={{ base: "block", md: "none" }}
        fontWeight="800"
        fontSize="11px"
        color={isActive ? colors.accent : titleColor}
        lineHeight="1.35"
        whiteSpace="normal"
        wordBreak="break-word"
      >
        {section.label}
      </Text>

      {/* Desktop row */}
      <Flex display={{ base: "none", md: "flex" }} align="center" gap={3} w="full" minW={0}>
        <Flex
          w="42px"
          h="42px"
          align="center"
          justify="center"
          borderRadius="xl"
          bg={isActive ? colors.accent : idleIconBg}
          color={isActive ? "white" : idleIconColor}
          flexShrink={0}
        >
          <Icon as={section.icon} boxSize={5} />
        </Flex>

        <Box flex={1} minW={0}>
          <HStack spacing={1.5}>
            <Text
              fontWeight="800"
              fontSize="sm"
              color={isActive ? colors.accent : titleColor}
              noOfLines={2}
              lineHeight="1.35"
            >
              {section.label}
            </Text>
            {section.live ? <LiveDot /> : null}
          </HStack>
          <Text fontSize="xs" color={descColor} noOfLines={1} mt={0.5}>
            {section.desc}
          </Text>
        </Box>

        <CountBadge section={section} isActive={isActive} colors={colors} />
      </Flex>
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

export function SectionPanelHeader({ section }) {
  const colors = getColors(section.colorKey);
  const titleColor = useColorModeValue("gray.900", "white");
  const descColor = useColorModeValue("gray.500", "gray.400");
  const border = useColorModeValue("gray.100", "whiteAlpha.100");

  return (
    <Flex
      align="center"
      gap={3}
      pb={3}
      mb={4}
      borderBottom="1px solid"
      borderColor={border}
    >
      <Flex
        w={{ base: "38px", md: "44px" }}
        h={{ base: "38px", md: "44px" }}
        align="center"
        justify="center"
        borderRadius="xl"
        bg={colors.accent}
        color="white"
        flexShrink={0}
        boxShadow={`0 6px 16px ${colors.accent}40`}
      >
        <Icon as={section.icon} boxSize={{ base: 4, md: 5 }} />
      </Flex>
      <Box minW={0}>
        <HStack spacing={2} flexWrap="wrap">
          <Text
            fontWeight="800"
            fontSize={{ base: "md", md: "xl" }}
            color={titleColor}
            fontFamily="heading"
            lineHeight="1.35"
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
            <Badge colorScheme={colors.scheme} variant="subtle" borderRadius="full" px={2.5}>
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
