import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import FormattedQuestionText from "./FormattedQuestionText";

/**
 * معاينة نص مستخرج بالـ OCR/AI مع دعم LaTeX والكسور والرموز الرياضية.
 */
export default function ExtractionMathPreview({
  value,
  label = "معاينة",
  fontSize = "sm",
  lineHeight = "1.8",
  whiteSpace,
  dir = "rtl",
}) {
  const previewBg = useColorModeValue("blue.50", "whiteAlpha.50");
  const borderColor = useColorModeValue("blue.100", "blue.800");
  const muted = useColorModeValue("gray.500", "gray.400");

  if (!value?.trim()) return null;

  return (
    <Box
      mt={2}
      p={3}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      bg={previewBg}
    >
      <Text fontSize="xs" fontWeight="semibold" color={muted} mb={1.5}>
        {label}
      </Text>
      <FormattedQuestionText
        value={value}
        fontSize={fontSize}
        lineHeight={lineHeight}
        whiteSpace={whiteSpace}
        dir={dir}
      />
    </Box>
  );
}
