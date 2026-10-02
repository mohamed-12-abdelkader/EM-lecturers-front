import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Collapse,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { MdClose, MdExpandLess, MdExpandMore, MdSearch, MdTag } from "react-icons/md";

export default function LessonQuestionsToolbar({
  total,
  questions = [],
  isSelectionMode,
  selectedCount,
  canManage,
  onSelectAll,
  allSelected,
  onSelectVisible,
  visibleAllSelected = false,
  onInvertSelection,
  searchQuery = "",
  onSearchChange,
  onJumpToQuestion,
}) {
  const [jumpValue, setJumpValue] = useState("");
  const [toolsOpen, setToolsOpen] = useState(Boolean(searchQuery?.trim()));
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const railBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const chipBg = useColorModeValue("white", "gray.700");
  const chipHover = useColorModeValue("blue.50", "whiteAlpha.200");
  const selectionBg = useColorModeValue("orange.50", "whiteAlpha.100");
  const selectionBorder = useColorModeValue("orange.200", "orange.700");

  useEffect(() => {
    if (searchQuery?.trim()) setToolsOpen(true);
  }, [searchQuery]);

  const jumpChips = useMemo(() => {
    if (searchQuery.trim()) {
      return questions.map((q, i) => ({
        key: q.id ?? `f-${i}`,
        label: (q.originalIndex ?? i) + 1,
        jumpIndex: q.originalIndex ?? i,
        selected: q.isSelected === true,
      }));
    }
    return Array.from({ length: total }, (_, index) => {
      const match = questions.find((q) => q.originalIndex === index);
      return {
        key: `n-${index}`,
        label: index + 1,
        jumpIndex: index,
        selected: match?.isSelected === true,
      };
    });
  }, [questions, searchQuery, total]);

  const handleJump = () => {
    const num = Number(String(jumpValue).trim());
    if (!Number.isFinite(num) || num < 1 || num > total) {
      toast({
        title: "رقم غير صالح",
        description: `أدخل رقم سؤال بين 1 و ${Math.max(total, 1)}`,
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    onJumpToQuestion?.(num - 1);
    setJumpValue("");
  };

  return (
    <Box
      mb={4}
      px={{ base: 3, md: 3.5 }}
      py={2.5}
      bg={isSelectionMode ? selectionBg : cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isSelectionMode ? selectionBorder : border}
      boxShadow="sm"
      position="sticky"
      top={{ base: "72px", md: "80px" }}
      zIndex={5}
    >
      <Flex align="center" justify="space-between" gap={2} flexWrap="wrap">
        <HStack spacing={2} flexWrap="wrap" minW={0}>
          <Badge
            colorScheme={isSelectionMode ? "orange" : "blue"}
            variant="subtle"
            px={2.5}
            py={0.5}
            borderRadius="md"
            fontSize="xs"
            fontWeight="800"
          >
            {isSelectionMode
              ? `${selectedCount} محدد`
              : questions.length === total
                ? `${total} سؤال`
                : `${questions.length}/${total}`}
          </Badge>
          <Text fontSize="xs" color={muted} noOfLines={1}>
            {canManage ? "نقرتان للتحديد" : "تصفح الأسئلة"}
          </Text>
        </HStack>

        <HStack spacing={1} flexShrink={0}>
          {isSelectionMode && total > 0 ? (
            <ButtonGroup size="xs" isAttached variant="outline" colorScheme="orange">
              <Button onClick={onSelectVisible || onSelectAll}>
                {visibleAllSelected ? "إلغاء الظاهر" : "الظاهر"}
              </Button>
              <Button onClick={onSelectAll}>{allSelected ? "إلغاء الكل" : "الكل"}</Button>
            </ButtonGroup>
          ) : null}
          <Button
            size="xs"
            variant={toolsOpen || searchQuery ? "solid" : "outline"}
            colorScheme={searchQuery ? "blue" : "gray"}
            borderRadius="lg"
            leftIcon={<MdSearch />}
            rightIcon={toolsOpen ? <MdExpandLess /> : <MdExpandMore />}
            onClick={() => setToolsOpen((v) => !v)}
          >
            بحث / انتقال
          </Button>
        </HStack>
      </Flex>

      <Collapse in={toolsOpen} animateOpacity>
        <Box mt={2.5} pt={2.5} borderTopWidth="1px" borderColor={isSelectionMode ? selectionBorder : border}>
          <Flex gap={2} direction={{ base: "column", sm: "row" }} align="stretch">
            <InputGroup size="sm" flex={1}>
              <InputLeftElement pointerEvents="none" h="32px">
                <Icon as={MdSearch} color="gray.400" boxSize={4} />
              </InputLeftElement>
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="ابحث في نص السؤال..."
                borderRadius="lg"
                bg={railBg}
                h="32px"
              />
              {searchQuery ? (
                <InputRightElement h="32px">
                  <IconButton
                    aria-label="مسح البحث"
                    icon={<MdClose />}
                    size="xs"
                    variant="ghost"
                    onClick={() => onSearchChange?.("")}
                  />
                </InputRightElement>
              ) : null}
            </InputGroup>

            <HStack spacing={1.5} flexShrink={0}>
              <InputGroup size="sm" maxW={{ base: "full", sm: "110px" }}>
                <InputLeftElement pointerEvents="none" h="32px">
                  <Icon as={MdTag} color="gray.400" boxSize={3.5} />
                </InputLeftElement>
                <Input
                  type="number"
                  min={1}
                  max={total || undefined}
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJump();
                  }}
                  placeholder="رقم"
                  borderRadius="lg"
                  bg={railBg}
                  h="32px"
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                />
              </InputGroup>
              <Button
                size="sm"
                h="32px"
                colorScheme="blue"
                borderRadius="lg"
                onClick={handleJump}
                isDisabled={!total}
              >
                انتقال
              </Button>
            </HStack>
          </Flex>

          {jumpChips.length > 0 ? (
            <Box
              mt={2}
              overflowX="auto"
              css={{
                "&::-webkit-scrollbar": { height: "5px" },
                "&::-webkit-scrollbar-thumb": {
                  background: "var(--chakra-colors-gray-300)",
                  borderRadius: "999px",
                },
              }}
            >
              <HStack spacing={1} minW="max-content" pb={0.5}>
                {jumpChips.map((chip) => (
                  <Tooltip key={chip.key} label={`سؤال ${chip.label}`} hasArrow>
                    <Button
                      size="xs"
                      minW="28px"
                      h="28px"
                      px={0}
                      borderRadius="md"
                      variant={chip.selected ? "solid" : "outline"}
                      colorScheme={chip.selected ? "orange" : "gray"}
                      bg={chip.selected ? undefined : chipBg}
                      borderColor={chip.selected ? undefined : border}
                      fontWeight="800"
                      fontSize="xs"
                      sx={{ fontVariantNumeric: "tabular-nums" }}
                      _hover={
                        chip.selected
                          ? undefined
                          : { bg: chipHover, borderColor: "blue.300", color: "blue.600" }
                      }
                      onClick={() => onJumpToQuestion?.(chip.jumpIndex)}
                    >
                      {chip.label}
                    </Button>
                  </Tooltip>
                ))}
              </HStack>
            </Box>
          ) : null}
        </Box>
      </Collapse>
    </Box>
  );
}
