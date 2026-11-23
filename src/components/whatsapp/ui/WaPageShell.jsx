import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  HStack,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaWhatsapp } from "react-icons/fa";
import WaServiceNav from "./WaServiceNav";

/**
 * Shared page chrome for WhatsApp service screens.
 * @param {boolean} showAdminNav — admin cross-links strip
 */
export default function WaPageShell({
  title,
  description,
  actions,
  showAdminNav = false,
  maxW = "1200px",
  children,
  alert,
}) {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const titleColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("green.50", "whiteAlpha.100");

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={10} pt={{ base: 3, md: 4 }}>
      <Container maxW={maxW} px={{ base: 3, md: 6 }}>
        <VStack spacing={4} align="stretch">
          <Flex
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={3}
          >
            <HStack spacing={3} align="start" minW={0}>
              <Flex
                align="center"
                justify="center"
                w={11}
                h={11}
                borderRadius="xl"
                bg={iconBg}
                flexShrink={0}
              >
                <Box as={FaWhatsapp} color="green.500" boxSize={6} />
              </Flex>
              <Box minW={0}>
                <Heading size={{ base: "md", md: "lg" }} color={titleColor} lineHeight="1.3">
                  {title}
                </Heading>
                {description && (
                  <Text fontSize="sm" color={muted} mt={1} maxW="640px">
                    {description}
                  </Text>
                )}
              </Box>
            </HStack>

            {actions && (
              <HStack
                spacing={2}
                flexWrap="wrap"
                justify={{ base: "flex-start", md: "flex-end" }}
                w={{ base: "100%", md: "auto" }}
                sx={{
                  "& > *": {
                    flexShrink: 0,
                  },
                }}
              >
                {actions}
              </HStack>
            )}
          </Flex>

          {showAdminNav && <WaServiceNav />}
          {alert}
          {children}
        </VStack>
      </Container>
    </Box>
  );
}
