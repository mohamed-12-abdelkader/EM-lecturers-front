import {
  Box,
  Flex,
  Link,
  Text,
  Badge,
  IconButton,
  useColorModeValue,
  HStack,
  Input,
  Button,
  VStack,
  Icon,
  Center,
  FormControl,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
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
  FaEllipsisV,
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
    label: "مباشر",
    scheme: "red",
    icon: FaBroadcastTower,
  },
  idle: {
    label: "انتظار",
    scheme: "orange",
    icon: FaHourglassHalf,
  },
  ended: {
    label: "منتهي",
    scheme: "gray",
    icon: FaCheckCircle,
  },
};

function formatStreamDate(value) {
  return new Date(value || Date.now()).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StreamRow({
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

  const rowBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  return (
    <Box
      bg={rowBg}
      borderWidth="1px"
      borderColor={isLive ? "red.200" : border}
      borderRadius="xl"
      px={{ base: 3, md: 4 }}
      py={{ base: 3, md: 3.5 }}
      transition="background 0.15s ease"
      _hover={{ bg: hoverBg }}
      dir="rtl"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        gap={{ base: 3, md: 4 }}
      >
        <HStack spacing={3} flex={1} minW={0} align="center">
          <Center
            w={9}
            h={9}
            borderRadius="lg"
            bg={isLive ? "red.500" : isIdle ? "orange.100" : "gray.100"}
            color={isLive ? "white" : isIdle ? "orange.600" : "gray.500"}
            _dark={{
              bg: isLive ? "red.500" : isIdle ? "orange.900" : "whiteAlpha.200",
              color: isLive ? "white" : isIdle ? "orange.300" : "gray.400",
            }}
            flexShrink={0}
          >
            <Icon as={meta.icon} boxSize={3.5} />
          </Center>

          <Box minW={0} flex={1}>
            <HStack spacing={2} flexWrap="wrap" mb={0.5}>
              <Text
                fontWeight="700"
                fontSize="sm"
                color={titleColor}
                noOfLines={1}
              >
                {stream.title}
              </Text>
              <Badge
                colorScheme={meta.scheme}
                variant={isLive ? "solid" : "subtle"}
                borderRadius="full"
                px={2}
                fontSize="10px"
                fontWeight="700"
                textTransform="none"
              >
                {meta.label}
              </Badge>
            </HStack>
            <HStack color={muted} spacing={2} fontSize="xs">
              <Icon as={FaCalendarAlt} boxSize={2.5} />
              <Text>{formatStreamDate(stream.created_at)}</Text>
            </HStack>
          </Box>
        </HStack>

        <Flex
          align="center"
          gap={2}
          flexWrap="wrap"
          justify={{ base: "stretch", md: "flex-end" }}
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
              borderRadius="lg"
              fontWeight="700"
              flex={{ base: 1, md: "initial" }}
            >
              {isLive ? "انضم" : "دخول"}
            </Button>
          )}

          {isEnded && stream.egress_url && (
            <Button
              as={Link}
              href={stream.egress_url}
              isExternal
              leftIcon={<Icon as={FaExternalLinkAlt} boxSize={3} />}
              variant="outline"
              colorScheme="blue"
              size="sm"
              borderRadius="lg"
              fontWeight="700"
              flex={{ base: 1, md: "initial" }}
            >
              التسجيل
            </Button>
          )}

          {isEnded && (
            <Button
              leftIcon={<Icon as={FaDownload} boxSize={3} />}
              variant="ghost"
              colorScheme="orange"
              size="sm"
              borderRadius="lg"
              fontWeight="700"
              isLoading={downloadingId === stream.id}
              flex={{ base: 1, md: "initial" }}
              onClick={() => onDownload(stream.id, stream.title)}
            >
              تحميل
            </Button>
          )}

          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              icon={<FaEllipsisV />}
              aria-label="المزيد"
              variant="ghost"
              size="sm"
              borderRadius="lg"
            />
            <MenuList minW="160px" fontSize="sm" borderRadius="xl" py={1}>
              {(isLive || isIdle) && (
                <MenuItem
                  icon={<FaTimesCircle />}
                  onClick={() => onClose(stream.id)}
                >
                  إغلاق البث
                </MenuItem>
              )}
              <MenuItem icon={<FaEdit />} onClick={() => onEdit(stream)}>
                تعديل العنوان
              </MenuItem>
              <MenuItem
                icon={<FaTrash />}
                color="red.500"
                onClick={() => onDelete(stream)}
              >
                حذف الجلسة
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
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
  const headingColor = useColorModeValue("gray.800", "white");
  const errorBg = useColorModeValue("red.50", "red.900");
  const errorBorder = useColorModeValue("red.200", "red.700");
  const emptyIconBg = useColorModeValue("blue.50", "blue.900");
  const warnBg = useColorModeValue("red.50", "red.900");
  const warnBorder = useColorModeValue("red.100", "red.700");
  const warnText = useColorModeValue("red.700", "red.200");
  const metaLine = useColorModeValue("gray.600", "gray.400");
  const inputProps = useCourseModalInputProps("blue");

  const streams = data?.meetings || [];
  const liveCount = streams.filter((s) => s.status === "started").length;
  const endedCount = streams.filter((s) => s.status === "ended").length;

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
      <Flex justify="center" py={12} align="center" direction="column">
        <Spinner size="md" color="blue.500" thickness="3px" />
        <Text mt={3} color={subTextColor} fontSize="sm">
          جاري تحميل الجلسات...
        </Text>
      </Flex>
    );
  }

  if (isError) {
    return (
      <Box
        textAlign="center"
        py={8}
        bg={errorBg}
        borderRadius="xl"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor={errorBorder}
      >
        <Text color="red.500" fontWeight="700" fontSize="sm">
          حدث خطأ أثناء تحميل الجلسات
        </Text>
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      {streams.length > 0 ? (
        <>
          <Flex
            justify="space-between"
            align="center"
            mb={3}
            gap={2}
            flexWrap="wrap"
          >
            <Text fontSize="sm" fontWeight="700" color={headingColor}>
              الجلسات
            </Text>
            <Text fontSize="xs" color={metaLine}>
              {streams.length} جلسة
              {liveCount > 0 ? ` · ${liveCount} مباشر` : ""}
              {endedCount > 0 ? ` · ${endedCount} منتهية` : ""}
            </Text>
          </Flex>

          <VStack spacing={2} align="stretch">
            {streams.map((stream) => (
              <StreamRow
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
        </>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={12}
          px={4}
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor={borderColor}
          textAlign="center"
        >
          <Center p={3} bg={emptyIconBg} borderRadius="xl" mb={3}>
            <Icon as={FaVideo} color="blue.500" boxSize={6} />
          </Center>
          <Text color={headingColor} fontWeight="700">
            لا توجد جلسات بعد
          </Text>
          <Text color={subTextColor} fontSize="sm" mt={1} maxW="280px">
            أنشئ أول بث مباشر لهذا الكورس
          </Text>
          {onCreateClick ? (
            <Button
              mt={4}
              leftIcon={<Icon as={FaPlus} />}
              colorScheme="orange"
              borderRadius="xl"
              fontWeight="700"
              size="sm"
              onClick={onCreateClick}
            >
              إنشاء جلسة
            </Button>
          ) : null}
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
