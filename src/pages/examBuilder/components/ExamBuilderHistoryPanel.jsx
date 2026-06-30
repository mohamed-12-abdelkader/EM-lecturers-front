import React from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Spinner,
  useColorModeValue,
  Icon,
  Center,
} from "@chakra-ui/react";
import { FiClock, FiChevronLeft, FiInbox } from "react-icons/fi";
import { formatMessageTime, SESSION_STATUS_LABELS } from "../examBuilderUtils";
import { ACCENT } from "../examBuilderTheme";

const STATUS_COLORS = {
  proposed: { scheme: "orange", dot: "orange.400" },
  approved: { scheme: "green", dot: "green.400" },
  cancelled: { scheme: "gray", dot: "gray.400" },
};

export default function ExamBuilderHistoryPanel({
  history,
  loading,
  loadingMore,
  hasMore,
  activeSessionId,
  statusFilter,
  onStatusFilterChange,
  onSelect,
  onLoadMore,
  sidebar = false,
  fullHeight = false,
}) {
  const panelBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const activeBg = useColorModeValue("blue.50", "blue.900");
  const filterBg = useColorModeValue("gray.100", "gray.900");
  const iconWrapBg = useColorModeValue("blue.50", "blue.900");

  const filters = [
    { value: "", label: "الكل" },
    { value: "proposed", label: "معلّق" },
    { value: "approved", label: "معتمد" },
  ];

  return (
    <Box
      bg={panelBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius={{ base: "lg", lg: "xl" }}
      overflow="hidden"
      boxShadow="sm"
      display="flex"
      flexDirection="column"
      flex={fullHeight ? 1 : undefined}
      minH={fullHeight ? 0 : undefined}
      h={
        sidebar
          ? fullHeight
            ? "100%"
            : { base: "auto", lg: "calc(100vh - 200px)" }
          : "auto"
      }
      position={sidebar && !fullHeight ? { lg: "sticky" } : "relative"}
      top={sidebar && !fullHeight ? "96px" : undefined}
    >
      <Box h="3px" bg={ACCENT} />

      <Box px={4} py={4} borderBottomWidth="1px" borderColor={border}>
        <Flex align="center" gap={3}>
          <Flex
            w={9}
            h={9}
            borderRadius="lg"
            bg={iconWrapBg}
            align="center"
            justify="center"
          >
            <Icon as={FiClock} color={ACCENT} boxSize={4} />
          </Flex>
          <Box>
            <Text fontSize="sm" fontWeight="bold">
              الطلبات السابقة
            </Text>
            <Text fontSize="xs" color={muted}>
              {history.length > 0 ? `${history.length} طلب` : "سجل توليد الأسئلة"}
            </Text>
          </Box>
        </Flex>
      </Box>

      <Box px={3} py={3} borderBottomWidth="1px" borderColor={border}>
        <Flex
          p={1}
          bg={filterBg}
          borderRadius="lg"
          gap={1}
        >
          {filters.map((f) => {
            const active = statusFilter === f.value;
            return (
              <Button
                key={f.value || "all"}
                flex={1}
                size="xs"
                h={8}
                variant="ghost"
                borderRadius="md"
                fontWeight={active ? "semibold" : "normal"}
                bg={active ? panelBg : "transparent"}
                color={active ? ACCENT : muted}
                boxShadow={active ? "sm" : "none"}
                onClick={() => onStatusFilterChange(f.value)}
                _hover={{ bg: active ? panelBg : "transparent" }}
              >
                {f.label}
              </Button>
            );
          })}
        </Flex>
      </Box>

      <Box flex={1} overflowY="auto" minH={sidebar ? { lg: 0 } : undefined}>
        {loading ? (
          <Flex py={12} justify="center">
            <Spinner size="md" color={ACCENT} thickness="3px" />
          </Flex>
        ) : history.length === 0 ? (
          <Center py={12} px={4} flexDirection="column">
            <Flex
              w={12}
              h={12}
              borderRadius="full"
              bg={useColorModeValue("gray.100", "gray.700")}
              align="center"
              justify="center"
              mb={3}
            >
              <Icon as={FiInbox} color={muted} boxSize={5} />
            </Flex>
            <Text fontSize="sm" fontWeight="medium" color={muted} mb={1}>
              لا توجد طلبات
            </Text>
            <Text fontSize="xs" color={muted} textAlign="center">
              أرسل أول طلب لإنشاء امتحان من بنك أسئلتك
            </Text>
          </Center>
        ) : (
          <VStack spacing={0} align="stretch">
            {history.map((item) => {
              const sid = item.session_id;
              const isActive = activeSessionId === sid;
              const statusMeta = STATUS_COLORS[item.status] || STATUS_COLORS.cancelled;

              return (
                <Box
                  key={sid}
                  as="button"
                  type="button"
                  w="full"
                  textAlign="right"
                  px={4}
                  py={3.5}
                  borderBottomWidth="1px"
                  borderColor={border}
                  bg={isActive ? activeBg : "transparent"}
                  borderRightWidth={isActive ? "3px" : "0"}
                  borderRightColor={ACCENT}
                  _hover={{ bg: isActive ? activeBg : hoverBg }}
                  onClick={() => onSelect(item)}
                  transition="all 0.15s ease"
                >
                  <Flex justify="space-between" align="start" gap={2} mb={2}>
                    <Text
                      fontSize="sm"
                      fontWeight={isActive ? "semibold" : "medium"}
                      noOfLines={2}
                      flex={1}
                      lineHeight="1.5"
                    >
                      {item.user_message}
                    </Text>
                    <Icon as={FiChevronLeft} color={muted} flexShrink={0} mt={1} boxSize={3.5} />
                  </Flex>
                  <HStack spacing={2} flexWrap="wrap">
                    <HStack spacing={1.5}>
                      <Box w={1.5} h={1.5} borderRadius="full" bg={statusMeta.dot} />
                      <Text fontSize="10px" color={muted}>
                        {SESSION_STATUS_LABELS[item.status] || item.status}
                      </Text>
                    </HStack>
                    <Badge variant="subtle" colorScheme="blue" fontSize="10px" borderRadius="md">
                      {item.questions_count ?? item.selected_questions?.length ?? 0} سؤال
                    </Badge>
                    {item.exam_id && (
                      <Badge colorScheme="green" variant="subtle" fontSize="10px" borderRadius="md">
                        #{item.exam_id}
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="10px" color={muted} mt={1.5}>
                    {formatMessageTime(item.created_at)}
                  </Text>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>

      {hasMore && (
        <Box px={3} py={3} borderTopWidth="1px" borderColor={border}>
          <Button
            size="sm"
            variant="ghost"
            w="full"
            color={ACCENT}
            fontWeight="medium"
            onClick={onLoadMore}
            isLoading={loadingMore}
          >
            تحميل المزيد
          </Button>
        </Box>
      )}
    </Box>
  );
}
