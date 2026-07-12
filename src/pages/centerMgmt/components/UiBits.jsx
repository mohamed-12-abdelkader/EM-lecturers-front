import {
  Box,
  Flex,
  Text,
  Icon,
  Spinner,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { ACCENT } from "../centerMgmtUtils";

export function KpiCard({ label, value, sub, icon, color = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");

  return (
    <Box
      p={5}
      bg={bg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      transition="all 0.2s"
      _hover={{ borderColor: `${color}.300`, transform: "translateY(-2px)", shadow: "sm" }}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="medium">
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={titleColor} lineHeight="1.2">
            {value}
          </Text>
          {sub ? (
            <Text fontSize="xs" color="gray.400" mt={1}>
              {sub}
            </Text>
          ) : null}
        </Box>
        {icon ? (
          <Flex
            w={10}
            h={10}
            borderRadius="xl"
            bg={`${color}.50`}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={icon} color={`${color}.600`} boxSize={4} />
          </Flex>
        ) : null}
      </Flex>
    </Box>
  );
}

export function EmptyState({ icon, title, description, action }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("gray.50", "gray.800");
  const titleColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={14}
      px={6}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={border}
      borderRadius="2xl"
      bg={bg}
      textAlign="center"
      gap={3}
    >
      {icon ? <Icon as={icon} boxSize={10} color="gray.400" /> : null}
      <Text fontWeight="bold" fontSize="lg" color={titleColor}>
        {title}
      </Text>
      {description ? (
        <Text fontSize="sm" color="gray.500" maxW="md">
          {description}
        </Text>
      ) : null}
      {action}
    </Flex>
  );
}

export function PageHeader({ title, description, actions }) {
  const titleColor = useColorModeValue("gray.800", "white");
  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      justify="space-between"
      align={{ base: "stretch", md: "center" }}
      gap={4}
      mb={6}
    >
      <Box>
        <Text
          as="h1"
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="bold"
          color={titleColor}
          fontFamily="'Noto Naskh Arabic', serif"
        >
          {title}
        </Text>
        {description ? (
          <Text fontSize="sm" color="gray.500" mt={1}>
            {description}
          </Text>
        ) : null}
      </Box>
      {actions ? (
        <Flex gap={2} flexWrap="wrap" justify={{ base: "stretch", md: "flex-end" }}>
          {actions}
        </Flex>
      ) : null}
    </Flex>
  );
}

export function LoadingBlock({ label = "جاري التحميل..." }) {
  return (
    <VStack py={16} spacing={3}>
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
      p={{ base: 4, md: 5 }}
      {...props}
    >
      {children}
    </Box>
  );
}
