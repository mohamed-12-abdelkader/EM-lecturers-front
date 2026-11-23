import { Flex, Text, Icon, useColorModeValue } from "@chakra-ui/react";
import { FaWhatsapp } from "react-icons/fa";

export default function WaEmptyState({
  title = "لا توجد بيانات",
  description,
  icon = FaWhatsapp,
  children,
}) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Flex direction="column" align="center" justify="center" py={10} px={4} textAlign="center">
      <Icon as={icon} boxSize={10} color="green.400" mb={3} opacity={0.85} />
      <Text fontWeight="700" color={titleColor} mb={description ? 1 : 0}>
        {title}
      </Text>
      {description && (
        <Text fontSize="sm" color={muted} maxW="360px" mb={children ? 4 : 0}>
          {description}
        </Text>
      )}
      {children}
    </Flex>
  );
}
