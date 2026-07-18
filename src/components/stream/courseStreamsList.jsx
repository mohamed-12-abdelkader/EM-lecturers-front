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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Icon,
  Tooltip,
  Center,
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
} from "react-icons/fa";
import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

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
    accent: "#E53E3E",
    icon: FaBroadcastTower,
  },
  idle: {
    label: "قيد الانتظار",
    scheme: "orange",
    accent: "#DD6B20",
    icon: FaHourglassHalf,
  },
  ended: {
    label: "منتهي",
    scheme: "gray",
    accent: "#718096",
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
        animation="streamPing 1.2s cubic-bezier(0,0,0.2,1) infinite"
        sx={{
          "@keyframes streamPing": {
            "75%, 100%": { transform: "scale(2.4)", opacity: 0 },
          },
        }}
      />
      <Box position="absolute" inset={0} borderRadius="full" bg="red.500" />
    </Box>
  );
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

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={isLive ? "red.300" : border}
      borderRadius="2xl"
      overflow="hidden"
      transition="all 0.2s ease"
      boxShadow={isLive ? "0 8px 28px rgba(229,62,62,0.18)" : "0 1px 3px rgba(15,23,42,0.05)"}
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: isLive
          ? "0 12px 32px rgba(229,62,62,0.22)"
          : "0 8px 20px rgba(15,23,42,0.08)",
        borderColor: isLive ? "red.400" : `${meta.accent}66`,
      }}
      dir="rtl"
    >
      <Box h="4px" bg={meta.accent} />

      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        gap={{ base: 3.5, md: 4 }}
        p={{ base: 4, md: 5 }}
      >
        {/* الأيقونة + البيانات */}
        <HStack spacing={3.5} flex={1} minW={0} align="flex-start">
          <Center
            w={{ base: 12, md: 14 }}
            h={{ base: 12, md: 14 }}
            borderRadius="xl"
            bg={isLive ? "red.500" : iconSoftBg}
            color={isLive ? "white" : meta.accent}
            flexShrink={0}
            boxShadow={isLive ? "0 6px 16px rgba(229,62,62,0.4)" : "none"}
          >
            <Icon
              as={meta.icon}
              boxSize={{ base: 5, md: 6 }}
              animation={isLive ? "pulse 1.5s ease-in-out infinite" : undefined}
            />
          </Center>

          <Box minW={0} flex={1}>
            <HStack spacing={2} flexWrap="wrap">
              <Text
                fontWeight="800"
                fontSize={{ base: "md", md: "lg" }}
                color={titleColor}
                noOfLines={1}
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
                >
                  {meta.label}
                </Badge>
              </HStack>
            </HStack>

            <HStack color={muted} fontSize="sm" spacing={3} mt={1.5} flexWrap="wrap">
              <HStack spacing={1.5}>
                <Icon as={FaCalendarAlt} boxSize={3} />
                <Text fontSize="xs">
                  {new Date(stream.created_at || Date.now()).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
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

        {/* الإجراءات */}
        <Flex
          align="center"
          gap={2}
          flexWrap="wrap"
          justify={{ base: "stretch", md: "flex-end" }}
          flexShrink={0}
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
              flex={{ base: 1, md: "initial" }}
              boxShadow={isLive ? "0 4px 14px rgba(229,62,62,0.35)" : "none"}
              cursor="pointer"
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
              colorScheme="purple"
              variant="outline"
              size="sm"
              borderRadius="xl"
              fontWeight="700"
              flex={{ base: 1, md: "initial" }}
              cursor="pointer"
            >
              مشاهدة التسجيل
            </Button>
          )}

          {isEnded && (
            <Button
              leftIcon={<Icon as={FaDownload} boxSize={3} />}
              colorScheme="green"
              variant="outline"
              size="sm"
              isLoading={downloadingId === stream.id}
              loadingText="جاري التحميل..."
              borderRadius="xl"
              fontWeight="700"
              flex={{ base: 1, md: "initial" }}
              cursor="pointer"
              onClick={() => onDownload(stream.id, stream.title)}
            >
              تحميل التسجيل
            </Button>
          )}

          <HStack spacing={1}>
            {(isLive || isIdle) && (
              <Tooltip label="إغلاق البث" hasArrow>
                <IconButton
                  icon={<FaTimesCircle />}
                  aria-label="إغلاق البث"
                  colorScheme="orange"
                  variant="ghost"
                  size="sm"
                  borderRadius="lg"
                  cursor="pointer"
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
                cursor="pointer"
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
                cursor="pointer"
                onClick={() => onDelete(stream)}
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Flex>
    </Box>
  );
}

const CourseStreamsList = ({ courseId }) => {
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
  const emptyIconBg = useColorModeValue("gray.50", "gray.700");

  const streams = data?.meetings || [];
  const liveCount = streams.filter((s) => s.status === "started").length;

  // state for edit & delete
  const [editingStream, setEditingStream] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [deletingStream, setDeletingStream] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const { onOpen, onClose } = useDisclosure();

  const handleUpdateTitle = async () => {
    try {
      await baseUrl.put(
        `/api/meeting/${editingStream.id}`,
        { title: newTitle },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast.success("تم تحديث العنوان");
      setEditingStream(null);
      setNewTitle("");
      refetch();
    } catch {
      toast.error("فشل في تحديث العنوان");
    }
  };

  const handleCloseStream = async (id) => {
    try {
      await baseUrl.post(
        `/api/meeting/${id}/close`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast.success("تم إغلاق البث");
      refetch();
    } catch {
      toast.error("فشل في إغلاق البث");
    }
  };

  const handleDelete = async () => {
    if (!deletingStream) return;
    try {
      await baseUrl.delete(`/api/meeting/${deletingStream.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("تم حذف البث");
      setDeletingStream(null);
      onClose();
      refetch();
    } catch {
      toast.error("فشل في حذف البث");
    }
  };

  const handleDownload = async (streamId, title) => {
    setDownloadingId(streamId);
    try {
      const response = await baseUrl.get(`/api/meeting/${streamId}/recording/download`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recording-${title || streamId}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("بدأ تحميل التسجيل");
    } catch (error) {
      toast.error("التسجيل غير موجود أو حدث خطأ أثناء التحميل");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" py={20} align="center" direction="column">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text mt={4} color="gray.500" fontWeight="medium">جاري تحميل الجلسات...</Text>
      </Flex>
    );
  }

  if (isError) {
    return (
      <Box
        textAlign="center"
        py={10}
        bg={errorBg}
        borderRadius="xl"
        border="1px dashed"
        borderColor={errorBorder}
      >
        <Icon as={FaTimesCircle} color={errorIcon} boxSize={10} mb={3} />
        <Text color={errorText} fontWeight="bold">حدث خطأ أثناء تحميل البيانات</Text>
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      {/* الهيدر */}
      <Flex justify="space-between" align="center" mb={5} flexWrap="wrap" gap={2}>
        <Box>
          <Heading as="h2" size="md" fontWeight="800" color={headingColor}>
            جلسات البث المباشر
          </Heading>
          <Text fontSize="sm" color={subTextColor} mt={0.5}>
            إدارة جلساتك المباشرة وتسجيلاتها
          </Text>
        </Box>
        <HStack spacing={2}>
          {liveCount > 0 && (
            <HStack
              spacing={1.5}
              bg="red.50"
              _dark={{ bg: "rgba(229,62,62,0.15)" }}
              px={3}
              py={1.5}
              borderRadius="full"
            >
              <LivePulseDot />
              <Text fontSize="xs" fontWeight="800" color="red.500">
                {liveCount} بث شغال
              </Text>
            </HStack>
          )}
          <Badge colorScheme="blue" borderRadius="full" px={3} py={1.5} fontSize="xs">
            {streams.length} جلسة
          </Badge>
        </HStack>
      </Flex>

      {streams.length > 0 ? (
        <VStack spacing={3.5} align="stretch">
          {streams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              downloadingId={downloadingId}
              onJoin={(s) => `${STREAM_REDIRECT_URL}/${s.id}?t=${localStorage.getItem("token")}`}
              onClose={handleCloseStream}
              onEdit={(s) => {
                setEditingStream(s);
                setNewTitle(s.title);
              }}
              onDelete={(s) => {
                setDeletingStream(s);
                onOpen();
              }}
              onDownload={handleDownload}
            />
          ))}
        </VStack>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={16}
          bg={cardBg}
          borderRadius="2xl"
          border="2px dashed"
          borderColor={borderColor}
        >
          <Center p={4} bg={emptyIconBg} borderRadius="full" mb={4}>
            <Icon as={FaVideo} color={subTextColor} boxSize={10} />
          </Center>
          <Text color={subTextColor} fontSize="lg" fontWeight="bold">لا توجد جلسات مباشرة حالياً</Text>
          <Text color={subTextColor} fontSize="sm" mt={1}>عند بدء بث مباشر جديد سيظهر هنا</Text>
        </Flex>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingStream}
        onClose={() => setEditingStream(null)}
        isCentered
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.300" />
        <ModalContent borderRadius="2xl" dir="rtl">
          <ModalHeader borderBottomWidth="1px">تعديل عنوان الجلسة</ModalHeader>
          <ModalCloseButton left={3} right="auto" />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.500">قم بتحديث عنوان الجلسة ليظهر للطلاب بشكل صحيح.</Text>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="عنوان الجلسة"
                size="lg"
                borderRadius="xl"
                focusBorderColor="blue.500"
              />
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" gap={2}>
            <Button
              variant="ghost"
              onClick={() => setEditingStream(null)}
              borderRadius="xl"
            >
              إلغاء
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateTitle} borderRadius="xl" px={6}>
              حفظ التغييرات
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingStream}
        onClose={() => setDeletingStream(null)}
        isCentered
        size="sm"
      >
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.300" />
        <ModalContent borderRadius="2xl" textAlign="center" pt={6} dir="rtl">
          <ModalBody>
            <Center
              mx="auto"
              mb={4}
              w={14}
              h={14}
              borderRadius="2xl"
              bg="red.50"
              _dark={{ bg: "rgba(229,62,62,0.15)" }}
            >
              <Icon as={FaTrash} color="red.500" boxSize={6} />
            </Center>
            <Heading size="md" mb={2}>حذف الجلسة؟</Heading>
            <Text color="gray.500">
              هل أنت متأكد من حذف <strong>"{deletingStream?.title}"</strong>؟ <br />
              لا يمكن التراجع عن هذا الإجراء.
            </Text>
          </ModalBody>
          <ModalFooter justify="center" pb={6} pt={2}>
            <HStack spacing={3} w="full">
              <Button
                flex={1}
                variant="outline"
                onClick={() => setDeletingStream(null)}
                borderRadius="xl"
              >
                إلغاء
              </Button>
              <Button flex={1} colorScheme="red" onClick={handleDelete} borderRadius="xl">
                نعم، احذف
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CourseStreamsList;
