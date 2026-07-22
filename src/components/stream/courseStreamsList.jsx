import {
  Box,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
  Badge,
  IconButton,
  useColorModeValue,
  HStack,
  Input,
  Button,
  VStack,
  Icon,
  Tooltip,
  Center,
  SimpleGrid,
  FormControl,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  FaPlay,
  FaExternalLinkAlt,
  FaTimesCircle,
  FaEdit,
  FaTrash,
  FaVideo,
  FaCalendarAlt,
  FaDownload,
  FaBroadcastTower,
  FaHourglassHalf,
  FaCheckCircle,
  FaPlus,
} from "react-icons/fa";
import { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import CourseFormModal, {
  CourseModalFieldCard,
  CourseModalFieldLabel,
  useCourseModalInputProps,
} from "../CourseFormModal";

const STREAM_REDIRECT_URL = import.meta.env.VITE_STREAM_REDIRECT_URL;

const fetchStreams = async (courseId) => {
  const res = await baseUrl.get("/api/meeting/me", {
    params: { courseId },
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
};

const STATUS_META = {
  started: {
    label: "مباشر الآن",
    scheme: "red",
    accent: "red.500",
    icon: FaBroadcastTower,
  },
  idle: {
    label: "قيد الانتظار",
    scheme: "orange",
    accent: "orange.500",
    icon: FaHourglassHalf,
  },
  ended: {
    label: "منتهي",
    scheme: "gray",
    accent: "gray.400",
    icon: FaCheckCircle,
  },
};

function LivePulseDot() {
  return (
    <Box position="relative" w={2.5} h={2.5} flexShrink={0}>
      <Box
        position="absolute"
        inset={0}
        borderRadius="full"
        bg="red.500"
        sx={{
          animation: "streamPing 1.2s cubic-bezier(0,0,0.2,1) infinite",
          "@keyframes streamPing": {
            "75%, 100%": { transform: "scale(2.4)", opacity: 0 },
          },
        }}
      />
      <Box position="absolute" inset={0} borderRadius="full" bg="red.500" />
    </Box>
  );
}

function formatStreamDate(value) {
  return new Date(value || Date.now()).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StreamCard({
  stream,
  downloadingId,
  onJoin,
  onClose,
  onEdit,
  onDelete,
  onDownload,
}) {
  const meta = STATUS_META[stream.status] || STATUS_META.ended;
  const isLive = stream.status === "started";
  const isIdle = stream.status === "idle";
  const isEnded = stream.status === "ended";

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const idChipBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const iconSoftBg = useColorModeValue(
    isLive ? "red.50" : isIdle ? "orange.50" : "gray.100",
    "whiteAlpha.100",
  );
  const actionsBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const barColor = useColorModeValue(
    isLive ? "red.500" : isIdle ? "orange.400" : "gray.200",
    isLive ? "red.500" : isIdle ? "orange.400" : "gray.600",
  );

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={isLive ? "red.200" : border}
      borderRadius="2xl"
      overflow="hidden"
      transition="all 0.2s ease"
      boxShadow={
        isLive
          ? "0 8px 24px rgba(229,62,62,0.14)"
          : "0 1px 2px rgba(15,23,42,0.04)"
      }
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: isLive
          ? "0 12px 28px rgba(229,62,62,0.18)"
          : "0 8px 18px rgba(15,23,42,0.07)",
        borderColor: isLive ? "red.300" : "blue.200",
      }}
      dir="rtl"
    >
      <Box h="3px" bg={barColor} />

      <Flex
        direction={{ base: "column", lg: "row" }}
        align={{ base: "stretch", lg: "center" }}
        gap={{ base: 3.5, lg: 4 }}
        p={{ base: 4, md: 5 }}
      >
        <HStack spacing={3.5} flex={1} minW={0} align="flex-start">
          <Center
            w={{ base: 12, md: 14 }}
            h={{ base: 12, md: 14 }}
            borderRadius="xl"
            bg={isLive ? "red.500" : iconSoftBg}
            color={isLive ? "white" : meta.accent}
            flexShrink={0}
            boxShadow={isLive ? "0 6px 16px rgba(229,62,62,0.35)" : "none"}
          >
            <Icon as={meta.icon} boxSize={{ base: 5, md: 6 }} />
          </Center>

          <Box minW={0} flex={1}>
            <HStack spacing={2} flexWrap="wrap" mb={1}>
              <Text
                fontWeight="800"
                fontSize={{ base: "md", md: "lg" }}
                color={titleColor}
                noOfLines={2}
              >
                {stream.title}
              </Text>
              <HStack
                spacing={1.5}
                bg={isLive ? "red.50" : "transparent"}
                _dark={{ bg: isLive ? "rgba(229,62,62,0.15)" : "transparent" }}
                px={isLive ? 2.5 : 0}
                py={isLive ? 1 : 0}
                borderRadius="full"
              >
                {isLive && <LivePulseDot />}
                <Badge
                  colorScheme={meta.scheme}
                  variant={isLive ? "solid" : "subtle"}
                  borderRadius="full"
                  px={2.5}
                  fontSize="xs"
                  fontWeight="700"
                  textTransform="none"
                >
                  {meta.label}
                </Badge>
              </HStack>
            </HStack>

            <HStack color={muted} fontSize="sm" spacing={3} flexWrap="wrap">
              <HStack spacing={1.5}>
                <Icon as={FaCalendarAlt} boxSize={3} />
                <Text fontSize="xs">{formatStreamDate(stream.created_at)}</Text>
              </HStack>
              <Text
                fontFamily="mono"
                fontSize="11px"
                bg={idChipBg}
                px={2}
                py={0.5}
                borderRadius="md"
                dir="ltr"
              >
                #{stream.id}
              </Text>
            </HStack>
          </Box>
        </HStack>

        <Flex
          align="center"
          gap={2}
          flexWrap="wrap"
          justify={{ base: "stretch", lg: "flex-end" }}
          flexShrink={0}
          bg={{ base: actionsBg, lg: "transparent" }}
          borderRadius={{ base: "xl", lg: "none" }}
          p={{ base: 2.5, lg: 0 }}
        >
          {(isLive || isIdle) && (
            <Button
              as="a"
              href={onJoin(stream)}
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<Icon as={FaPlay} boxSize={3} />}
              colorScheme={isLive ? "red" : "blue"}
              size="sm"
              borderRadius="xl"
              fontWeight="700"
              px={5}
              flex={{ base: 1, lg: "initial" }}
              boxShadow={isLive ? "0 4px 14px rgba(229,62,62,0.3)" : "none"}
            >
              {isLive ? "انضم الآن" : "دخول البث"}
            </Button>
          )}

          {isEnded && stream.egress_url && (
            <Button
              as={Link}
              href={stream.egress_url}
              isExternal
              leftIcon={<Icon as={FaExternalLinkAlt} boxSize={3} />}
              colorScheme="blue"
              variant="outline"
              size="sm"
              borderRadius="xl"
              fontWeight="700"
              flex={{ base: 1, lg: "initial" }}
            >
              مشاهدة التسجيل
            </Button>
          )}

          {isEnded && (
            <Button
              leftIcon={<Icon as={FaDownload} boxSize={3} />}
              colorScheme="orange"
              variant="outline"
              size="sm"
              isLoading={downloadingId === stream.id}
              loadingText="تحميل..."
              borderRadius="xl"
              fontWeight="700"
              flex={{ base: 1, lg: "initial" }}
              onClick={() => onDownload(stream.id, stream.title)}
            >
              تحميل
            </Button>
          )}

          <HStack spacing={1} ms={{ base: "auto", lg: 0 }}>
            {(isLive || isIdle) && (
              <Tooltip label="إغلاق البث" hasArrow>
                <IconButton
                  icon={<FaTimesCircle />}
                  aria-label="إغلاق البث"
                  colorScheme="orange"
                  variant="ghost"
                  size="sm"
                  borderRadius="lg"
                  onClick={() => onClose(stream.id)}
                />
              </Tooltip>
            )}
            <Tooltip label="تعديل العنوان" hasArrow>
              <IconButton
                icon={<FaEdit />}
                aria-label="تعديل"
                colorScheme="blue"
                variant="ghost"
                size="sm"
                borderRadius="lg"
                onClick={() => onEdit(stream)}
              />
            </Tooltip>
            <Tooltip label="حذف الجلسة" hasArrow>
              <IconButton
                icon={<FaTrash />}
                aria-label="حذف"
                colorScheme="red"
                variant="ghost"
                size="sm"
                borderRadius="lg"
                onClick={() => onDelete(stream)}
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Flex>
    </Box>
  );
}

function StatsStrip({ streams, liveCount }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.900", "white");
  const idleCount = streams.filter((s) => s.status === "idle").length;
  const endedCount = streams.filter((s) => s.status === "ended").length;

  const items = [
    { label: "الإجمالي", value: streams.length, color: "blue.500" },
    { label: "مباشر", value: liveCount, color: "red.500" },
    { label: "انتظار", value: idleCount, color: "orange.500" },
    { label: "منتهية", value: endedCount, color: "gray.500" },
  ];

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
      {items.map((item) => (
        <Box
          key={item.label}
          bg={cardBg}
          borderWidth="1px"
          borderColor={border}
          borderRadius="xl"
          px={4}
          py={3}
        >
          <Text fontSize="xs" color={muted} fontWeight="600" mb={1}>
            {item.label}
          </Text>
          <Text fontSize="xl" fontWeight="800" color={item.color || valueColor}>
            {item.value}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  );
}

const CourseStreamsList = ({ courseId, onCreateClick }) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["myStreams", courseId],
    queryFn: () => fetchStreams(courseId),
  });

  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.900", "white");
  const errorBg = useColorModeValue("red.50", "red.900");
  const errorBorder = useColorModeValue("red.200", "red.700");
  const errorIcon = useColorModeValue("red.500", "red.300");
  const errorText = useColorModeValue("red.600", "red.200");
  const emptyIconBg = useColorModeValue("blue.50", "blue.900");
  const warnBg = useColorModeValue("red.50", "red.900");
  const warnBorder = useColorModeValue("red.100", "red.700");
  const warnText = useColorModeValue("red.700", "red.200");
  const inputProps = useCourseModalInputProps("blue");

  const streams = data?.meetings || [];
  const liveCount = streams.filter((s) => s.status === "started").length;

  const [editingStream, setEditingStream] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [deletingStream, setDeletingStream] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdateTitle = async (e) => {
    e?.preventDefault?.();
    if (!editingStream || !newTitle.trim()) return;
    setSavingEdit(true);
    try {
      await baseUrl.put(
        `/api/meeting/${editingStream.id}`,
        { title: newTitle.trim() },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("تم تحديث العنوان");
      setEditingStream(null);
      setNewTitle("");
      refetch();
    } catch {
      toast.error("فشل في تحديث العنوان");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCloseStream = async (id) => {
    try {
      await baseUrl.post(
        `/api/meeting/${id}/close`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("تم إغلاق البث");
      refetch();
    } catch {
      toast.error("فشل في إغلاق البث");
    }
  };

  const handleDelete = async (e) => {
    e?.preventDefault?.();
    if (!deletingStream) return;
    setDeleting(true);
    try {
      await baseUrl.delete(`/api/meeting/${deletingStream.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("تم حذف البث");
      setDeletingStream(null);
      refetch();
    } catch {
      toast.error("فشل في حذف البث");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (streamId, title) => {
    setDownloadingId(streamId);
    try {
      const response = await baseUrl.get(
        `/api/meeting/${streamId}/recording/download`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `recording-${title || streamId}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("بدأ تحميل التسجيل");
    } catch {
      toast.error("التسجيل غير موجود أو حدث خطأ أثناء التحميل");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" py={16} align="center" direction="column">
        <Spinner size="lg" color="blue.500" thickness="3px" />
        <Text mt={3} color={subTextColor} fontWeight="600" fontSize="sm">
          جاري تحميل الجلسات...
        </Text>
      </Flex>
    );
  }

  if (isError) {
    return (
      <Box
        textAlign="center"
        py={10}
        bg={errorBg}
        borderRadius="2xl"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor={errorBorder}
      >
        <Icon as={FaTimesCircle} color={errorIcon} boxSize={9} mb={3} />
        <Text color={errorText} fontWeight="700">
          حدث خطأ أثناء تحميل الجلسات
        </Text>
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      <Flex
        justify="space-between"
        align={{ base: "stretch", sm: "center" }}
        mb={4}
        gap={3}
        flexDir={{ base: "column", sm: "row" }}
      >
        <Box>
          <Heading as="h3" size="sm" fontWeight="800" color={headingColor}>
            سجل الجلسات
          </Heading>
          <Text fontSize="sm" color={subTextColor} mt={0.5}>
            إدارة البث المباشر والتسجيلات السابقة
          </Text>
        </Box>
        {liveCount > 0 && (
          <HStack
            spacing={1.5}
            bg="red.50"
            _dark={{ bg: "rgba(229,62,62,0.15)" }}
            px={3}
            py={1.5}
            borderRadius="full"
            alignSelf={{ base: "flex-start", sm: "center" }}
          >
            <LivePulseDot />
            <Text fontSize="xs" fontWeight="800" color="red.500">
              {liveCount} بث شغال
            </Text>
          </HStack>
        )}
      </Flex>

      {streams.length > 0 && (
        <StatsStrip streams={streams} liveCount={liveCount} />
      )}

      {streams.length > 0 ? (
        <VStack spacing={3} align="stretch">
          {streams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              downloadingId={downloadingId}
              onJoin={(s) =>
                `${STREAM_REDIRECT_URL}/${s.id}?t=${localStorage.getItem("token")}`
              }
              onClose={handleCloseStream}
              onEdit={(s) => {
                setEditingStream(s);
                setNewTitle(s.title);
              }}
              onDelete={setDeletingStream}
              onDownload={handleDownload}
            />
          ))}
        </VStack>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={14}
          px={4}
          bg={cardBg}
          borderRadius="2xl"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor={borderColor}
          textAlign="center"
        >
          <Center p={4} bg={emptyIconBg} borderRadius="2xl" mb={4}>
            <Icon as={FaVideo} color="blue.500" boxSize={8} />
          </Center>
          <Text color={headingColor} fontSize="lg" fontWeight="800">
            لا توجد جلسات بعد
          </Text>
          <Text color={subTextColor} fontSize="sm" mt={1} maxW="320px">
            أنشئ أول بث مباشر لهذا الكورس ليظهر هنا مع إمكانية الإدارة والتسجيل
          </Text>
          {onCreateClick && (
            <Button
              mt={5}
              leftIcon={<Icon as={FaPlus} />}
              colorScheme="orange"
              borderRadius="xl"
              fontWeight="700"
              onClick={onCreateClick}
            >
              إنشاء جلسة جديدة
            </Button>
          )}
        </Flex>
      )}

      <CourseFormModal
        isOpen={!!editingStream}
        onClose={() => setEditingStream(null)}
        loading={savingEdit}
        size={{ base: "full", md: "md" }}
        icon={FaEdit}
        accent="blue"
        title="تعديل عنوان الجلسة"
        subtitle="حدّث العنوان ليظهر للطلاب بشكل أوضح"
        onSubmit={handleUpdateTitle}
        submitLabel="حفظ التغييرات"
        loadingText="جاري الحفظ..."
      >
        <CourseModalFieldCard>
          <FormControl isRequired>
            <CourseModalFieldLabel icon={FaBroadcastTower}>
              عنوان الجلسة
            </CourseModalFieldLabel>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="عنوان الجلسة"
              {...inputProps}
            />
          </FormControl>
        </CourseModalFieldCard>
      </CourseFormModal>

      <CourseFormModal
        isOpen={!!deletingStream}
        onClose={() => setDeletingStream(null)}
        loading={deleting}
        size="sm"
        icon={FaTrash}
        accent="orange"
        title="حذف الجلسة؟"
        subtitle={`سيتم حذف "${deletingStream?.title || ""}" نهائياً`}
        onSubmit={handleDelete}
        submitLabel="نعم، احذف"
        loadingText="جاري الحذف..."
        submitColorScheme="red"
      >
        <Box
          p={4}
          bg={warnBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={warnBorder}
        >
          <Text fontSize="sm" color={warnText}>
            لا يمكن التراجع عن هذا الإجراء بعد التأكيد.
          </Text>
        </Box>
      </CourseFormModal>
    </Box>
  );
};

export default CourseStreamsList;
