import {
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiMaximize,
  FiMinimize,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";

export default function PdfViewerToolbar({
  page,
  pageInput,
  numPages,
  scale,
  fitScale,
  isFullscreen,
  onPrev,
  onNext,
  onPageInputChange,
  onPageInputCommit,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onToggleFullscreen,
}) {
  const toolbarBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const zoomPercent = Math.round((scale / (fitScale || 1)) * 100);

  return (
    <Flex
      as="nav"
      aria-label="أدوات عرض PDF"
      align="center"
      gap={2}
      px={{ base: 2, md: 4 }}
      py={2}
      bg={toolbarBg}
      borderBottom="1px solid"
      borderColor={border}
      flexShrink={0}
      flexWrap="wrap"
    >
      <IconButton
        aria-label="الصفحة السابقة"
        icon={<Icon as={FiChevronRight} />}
        size="sm"
        onClick={onPrev}
        isDisabled={page <= 1}
        borderRadius="lg"
      />
      <IconButton
        aria-label="الصفحة التالية"
        icon={<Icon as={FiChevronLeft} />}
        size="sm"
        onClick={onNext}
        isDisabled={page >= numPages}
        borderRadius="lg"
      />
      <HStack spacing={1}>
        <Input
          value={pageInput}
          onChange={(e) => onPageInputChange(e.target.value)}
          onBlur={onPageInputCommit}
          onKeyDown={(e) => e.key === "Enter" && onPageInputCommit()}
          size="sm"
          w="16"
          textAlign="center"
          borderRadius="lg"
          aria-label="رقم الصفحة الحالية"
        />
        <Text fontSize="sm" color={muted} whiteSpace="nowrap">
          / {numPages.toLocaleString("ar-EG")}
        </Text>
      </HStack>

      <HStack spacing={1} ms="auto">
        <Text fontSize="xs" color={muted} display={{ base: "none", sm: "block" }} minW="10">
          {zoomPercent}%
        </Text>
        <IconButton
          aria-label="ملائمة العرض"
          icon={
            <Text fontSize="xs" fontWeight="bold">
              Fit
            </Text>
          }
          size="sm"
          variant="ghost"
          onClick={onFitWidth}
          borderRadius="lg"
        />
        <IconButton
          aria-label="تصغير"
          icon={<Icon as={FiZoomOut} />}
          size="sm"
          variant="ghost"
          onClick={onZoomOut}
          borderRadius="lg"
        />
        <IconButton
          aria-label="تكبير"
          icon={<Icon as={FiZoomIn} />}
          size="sm"
          variant="ghost"
          onClick={onZoomIn}
          borderRadius="lg"
        />
        <IconButton
          aria-label={isFullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
          icon={<Icon as={isFullscreen ? FiMinimize : FiMaximize} />}
          size="sm"
          variant="ghost"
          onClick={onToggleFullscreen}
          borderRadius="lg"
        />
      </HStack>
    </Flex>
  );
}
