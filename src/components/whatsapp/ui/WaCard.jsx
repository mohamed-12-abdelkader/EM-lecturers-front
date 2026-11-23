import { Box, Heading, Text, Flex, useColorModeValue } from "@chakra-ui/react";

export default function WaCard({
  title,
  description,
  actions,
  children,
  p = { base: 4, md: 5 },
  ...rest
}) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");

  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      p={p}
      shadow="sm"
      {...rest}
    >
      {(title || actions) && (
        <Flex
          justify="space-between"
          align={{ base: "stretch", sm: "center" }}
          direction={{ base: "column", sm: "row" }}
          gap={3}
          mb={title || description ? 4 : 0}
        >
          <Box>
            {title && (
              <Heading size="sm" color={titleColor} mb={description ? 1 : 0}>
                {title}
              </Heading>
            )}
            {description && (
              <Text fontSize="sm" color={muted}>
                {description}
              </Text>
            )}
          </Box>
          {actions}
        </Flex>
      )}
      {children}
    </Box>
  );
}
