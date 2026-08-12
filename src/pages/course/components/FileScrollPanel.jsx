import { Box, useColorModeValue } from "@chakra-ui/react";

/**
 * حاوية تمرير مستقلة للملف — data-file-scroll للتمييز عن scroll الصفحة.
 */
export default function FileScrollPanel({ children, scrollRef, onScroll, ...rest }) {
  const track = useColorModeValue("gray.200", "gray.700");
  const thumb = useColorModeValue("blue.400", "blue.500");

  return (
    <Box
      ref={scrollRef}
      data-file-scroll="true"
      flex={1}
      minH={0}
      w="full"
      h="100%"
      overflowY="scroll"
      overflowX="hidden"
      overscrollBehavior="contain"
      onScroll={onScroll}
      sx={{
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        scrollbarGutter: "stable",
        "&::-webkit-scrollbar": { width: "12px" },
        "&::-webkit-scrollbar-track": { bg: track, borderRadius: "full" },
        "&::-webkit-scrollbar-thumb": {
          bg: thumb,
          borderRadius: "full",
          border: "2px solid",
          borderColor: track,
        },
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}
