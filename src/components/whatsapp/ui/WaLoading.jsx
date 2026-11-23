import { Flex, Spinner, Text, useColorModeValue } from "@chakra-ui/react";

export default function WaLoading({ label = "جارٍ التحميل…" }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  return (
    <Flex direction="column" align="center" justify="center" py={16} gap={3}>
      <Spinner color="green.400" thickness="3px" size="lg" />
      <Text fontSize="sm" color={muted}>
        {label}
      </Text>
    </Flex>
  );
}
