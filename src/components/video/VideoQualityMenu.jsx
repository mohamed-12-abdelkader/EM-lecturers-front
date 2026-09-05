import { HStack, Select, Text } from "@chakra-ui/react";

export default function VideoQualityMenu({
  options,
  value,
  onChange,
  variant = "header",
}) {
  if (!Array.isArray(options) || options.length < 2) return null;

  const isOverlay = variant === "overlay";

  return (
    <HStack
      spacing={2}
      bg={isOverlay ? "blackAlpha.700" : "transparent"}
      px={isOverlay ? 2 : 0}
      py={isOverlay ? 1 : 0}
      borderRadius="lg"
      pointerEvents="auto"
    >
      <Text
        fontSize="xs"
        fontWeight="700"
        color={isOverlay ? "white" : "gray.500"}
        whiteSpace="nowrap"
      >
        الجودة
      </Text>
      <Select
        size="sm"
        minW="120px"
        maxW="160px"
        value={String(value ?? 0)}
        onChange={(event) => onChange(Number(event.target.value))}
        bg={isOverlay ? "gray.800" : "white"}
        color={isOverlay ? "white" : "inherit"}
        borderColor={isOverlay ? "whiteAlpha.400" : "gray.200"}
        borderRadius="lg"
        fontWeight="600"
        aria-label="جودة الفيديو"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </HStack>
  );
}
