import {
  Box,
  Button,
  FormLabel,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";

/**
 * Shared course action modal shell — blue/orange brand, RTL-friendly.
 */
export default function CourseFormModal({
  isOpen,
  onClose,
  loading = false,
  size = { base: "full", md: "lg" },
  icon,
  title,
  subtitle,
  accent = "blue",
  children,
  onSubmit,
  submitLabel = "حفظ",
  cancelLabel = "إلغاء",
  loadingText = "جاري الحفظ...",
  submitColorScheme,
  footerExtra,
  isCentered = true,
  hideSubmit = false,
  onPrimaryClick,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const modalBodyBg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.800", "white");
  const closeHover = useColorModeValue("gray.100", "whiteAlpha.200");

  const isOrange = accent === "orange";
  const scheme = submitColorScheme || (isOrange ? "orange" : "blue");
  const iconBg = useColorModeValue(
    isOrange ? "orange.50" : "blue.50",
    isOrange ? "orange.900" : "blue.900",
  );
  const iconColor = isOrange ? "orange.500" : "blue.500";

  const footer = (
    <ModalFooter
      px={{ base: 4, md: 6 }}
      py={4}
      borderTopWidth="1px"
      borderColor={border}
      bg={cardBg}
      gap={3}
      flexWrap="wrap"
      flexShrink={0}
    >
      {footerExtra}
      <HStack spacing={3} ms="auto" flexWrap="wrap">
        <Button
          variant="ghost"
          onClick={onClose}
          isDisabled={loading}
          borderRadius="xl"
          fontWeight="600"
        >
          {cancelLabel}
        </Button>
        {!hideSubmit && (
          <Button
            colorScheme={scheme}
            type={onSubmit ? "submit" : "button"}
            isLoading={loading}
            loadingText={loadingText}
            borderRadius="xl"
            fontWeight="bold"
            px={6}
            shadow="sm"
            onClick={onSubmit ? undefined : onPrimaryClick}
          >
            {submitLabel}
          </Button>
        )}
      </HStack>
    </ModalFooter>
  );

  const body = (
    <ModalBody
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 5 }}
      bg={modalBodyBg}
      flex="1"
      minH={0}
      overflowY="auto"
    >
      {children}
    </ModalBody>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      closeOnOverlayClick={!loading}
      size={size}
      scrollBehavior="inside"
      isCentered={isCentered}
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
      <ModalContent
        borderRadius={{ base: "none", md: "2xl" }}
        overflow="hidden"
        bg={cardBg}
        borderWidth="1px"
        borderColor={border}
        boxShadow="xl"
        mx={{ base: 0, md: 4 }}
        maxH={{ base: "100vh", md: "90vh" }}
        my={{ base: 0, md: 4 }}
        display="flex"
        flexDirection="column"
      >
        <Box
          h="1"
          w="100%"
          bgGradient="linear(to-r, blue.500, orange.500)"
          flexShrink={0}
        />
        <ModalHeader
          px={{ base: 4, md: 6 }}
          pt={{ base: 4, md: 5 }}
          pb={3}
          borderBottomWidth="1px"
          borderColor={border}
          flexShrink={0}
        >
          <HStack spacing={3} align="flex-start" pe={8}>
            <Box
              p={2.5}
              bg={iconBg}
              borderRadius="xl"
              flexShrink={0}
              lineHeight={0}
            >
              <Icon as={icon} boxSize={5} color={iconColor} />
            </Box>
            <VStack align="start" spacing={0.5} minW={0}>
              <Text
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="bold"
                color={titleColor}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  fontSize="sm"
                  color={muted}
                  fontWeight="normal"
                  lineHeight="short"
                >
                  {subtitle}
                </Text>
              ) : null}
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton
          top={4}
          insetEnd={3}
          isDisabled={loading}
          borderRadius="lg"
          _hover={{ bg: closeHover }}
        />

        {onSubmit ? (
          <form
            onSubmit={onSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {body}
            {footer}
          </form>
        ) : (
          <>
            {body}
            {footer}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

/** Field group card inside course modals */
export function CourseModalFieldCard({ children, ...rest }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.600");
  return (
    <Box
      p={{ base: 3.5, md: 4 }}
      bg={bg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      {...rest}
    >
      {children}
    </Box>
  );
}

/** FormLabel with tinted icon chip */
export function CourseModalFieldLabel({
  icon,
  color = "blue",
  children,
  ...rest
}) {
  const labelColor = useColorModeValue("gray.700", "gray.200");
  const iconBg = useColorModeValue(
    color === "orange" ? "orange.50" : "blue.50",
    color === "orange" ? "orange.900" : "blue.900",
  );
  const iconColor = color === "orange" ? "orange.500" : "blue.500";

  return (
    <FormLabel
      display="flex"
      alignItems="center"
      gap={2}
      fontWeight="600"
      fontSize="sm"
      color={labelColor}
      mb={2}
      {...rest}
    >
      <Box
        p={1.5}
        bg={iconBg}
        borderRadius="md"
        lineHeight={0}
        display="inline-flex"
      >
        <Icon as={icon} boxSize={3.5} color={iconColor} />
      </Box>
      {children}
    </FormLabel>
  );
}

export function useCourseModalInputProps(focusColor = "blue") {
  const border = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.800");
  const isOrange = focusColor === "orange";
  return {
    borderRadius: "lg",
    borderWidth: "1px",
    borderColor: border,
    size: "md",
    bg: inputBg,
    _focus: {
      borderColor: isOrange ? "orange.500" : "blue.500",
      boxShadow: isOrange
        ? "0 0 0 2px rgba(221, 107, 32, 0.25)"
        : "0 0 0 2px rgba(49, 130, 206, 0.25)",
      outline: "none",
    },
  };
}
