import { SimpleGrid, Box, Text, useColorModeValue } from "@chakra-ui/react";

export function WaStat({ label, value, hint, accent }) {
  const bg = useColorModeValue("gray.50", "whiteAlpha.50");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");

  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={border}
      borderRadius="lg"
      p={3.5}
      minW={0}
    >
      <Text fontSize="xs" fontWeight="700" color={muted} mb={1} noOfLines={1}>
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="800" color={accent || title} noOfLines={1}>
        {value}
      </Text>
      {hint && (
        <Text fontSize="xs" color={muted} mt={1} noOfLines={1}>
          {hint}
        </Text>
      )}
    </Box>
  );
}

export default function WaStatRow({ items = [], columns = { base: 2, md: 4 } }) {
  if (!items.length) return null;
  return (
    <SimpleGrid columns={columns} spacing={3}>
      {items.map((item) => (
        <WaStat key={item.label} {...item} />
      ))}
    </SimpleGrid>
  );
}
