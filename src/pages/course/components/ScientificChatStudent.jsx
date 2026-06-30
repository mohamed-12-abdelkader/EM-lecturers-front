import React from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";
import ScientificChatPanel from "../../../components/scientificChat/ScientificChatPanel";

/**
 * شات المساعد العلمي داخل صفحة الكورس (طالب مشترك).
 * API: POST/GET /api/scientific-chatbot/courses/:courseId/ask|history
 */
const ScientificChatStudent = ({ courseId, token }) => {
  const shellBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      borderRadius="2xl"
      border="1px solid"
      borderColor={borderColor}
      bg={shellBg}
      overflow="hidden"
      boxShadow="lg"
      minH={{ base: "480px", md: "560px" }}
    >
      <ScientificChatPanel
        mode="course"
        courseId={courseId}
        token={token}
        compact={false}
      />
    </Box>
  );
};

export default ScientificChatStudent;
