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
  Container,
  VStack,
  Icon,
  Avatar,
  Tooltip
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
  FaClock,
  FaDownload
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

const statusLabel = {
  started: "مباشر الآن",
  idle: "قيد الانتظار",
  ended: "منتهي",
};

const statusColor = {
  started: "red",
  idle: "orange",
  ended: "gray",
};

const CourseStreamsList = ({ courseId }) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["myStreams", courseId],
    queryFn: () => fetchStreams(courseId),
  });

  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const streams = data?.meetings || [];

  // state for edit & delete
  const [editingStream, setEditingStream] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [deletingStream, setDeletingStream] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

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
      <Box textAlign="center" py={10} bg={useColorModeValue("red.50", "red.900")} borderRadius="xl" border="1px dashed" borderColor={useColorModeValue("red.200", "red.700")}>
        <Icon as={FaTimesCircle} color={useColorModeValue("red.500", "red.300")} boxSize={10} mb={3} />
        <Text color={useColorModeValue("red.600", "red.200")} fontWeight="bold">حدث خطأ أثناء تحميل البيانات</Text>
      </Box>
    );
  }

  return (
    <Box mt={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="lg" color={useColorModeValue("gray.700", "white")}>
          جلسات البث المباشر
        </Heading>
        <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
          {streams.length} جلسة
        </Badge>
      </Flex>

      {streams.length > 0 ? (
        <VStack spacing={4} align="stretch">
          {streams.map((stream) => (
            <Flex
              key={stream.id}
              className="modern-card"
              p={{ base: 4, md: 5 }}
              borderWidth="1px"
              borderColor={stream.status === 'started' ? "red.200" : borderColor}
              borderRadius="2xl"
              boxShadow={stream.status === 'started' ? "0 4px 20px rgba(229, 62, 62, 0.15)" : "sm"}
              bg={cardBg}
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              gap={{ base: 4, md: 6 }}
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
              position="relative"
              overflow="hidden"
            >
              {stream.status === 'started' && (
                <Box
                  position="absolute"
                  top={0}
                  right={0}
                  width="4px"
                  height="100%"
                  bg="red.500"
                />
              )}

              {/* Left side: Icon + Info */}
              <HStack spacing={4} flex={1}>
                <Flex
                  align="center"
                  justify="center"
                  w={{ base: 12, md: 14 }}
                  h={{ base: 12, md: 14 }}
                  borderRadius="2xl"
                  bg={stream.status === 'started' ? useColorModeValue("red.50", "red.900") : useColorModeValue("blue.50", "blue.900")}
                  color={stream.status === 'started' ? useColorModeValue("red.500", "red.300") : useColorModeValue("blue.500", "blue.300")}
                  flexShrink={0}
                >
                  <Icon as={FaVideo} boxSize={{ base: 5, md: 6 }} />
                </Flex>

                <VStack align="start" spacing={1} overflow="hidden">
                  <HStack>
                    <Heading size="md" noOfLines={1} color={useColorModeValue("gray.800", "white")}>
                      {stream.title}
                    </Heading>
                    <Badge
                      colorScheme={statusColor[stream.status]}
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      fontSize="xs"
                      variant="subtle"
                    >
                      {statusLabel[stream.status]}
                    </Badge>
                  </HStack>

                  <HStack color="gray.500" fontSize="sm" spacing={3}>
                    <HStack spacing={1}>
                      <Icon as={FaCalendarAlt} boxSize={3} />
                      <Text>{new Date(stream.created_at || Date.now()).toLocaleDateString('ar-EG')}</Text>
                    </HStack>
                    <Text color="gray.300">•</Text>
                    <Text fontFamily="monospace" fontSize="xs" bg={useColorModeValue("gray.100", "gray.700")} px={2} py={0.5} borderRadius="md">{stream.id}</Text>
                  </HStack>
                </VStack>
              </HStack>

              {/* Right side: Actions */}
              <Flex
                align="center"
                gap={3}
                direction={{ base: "column", sm: "row" }}
                width={{ base: "full", md: "auto" }}
                mt={{ base: 2, md: 0 }}
              >
                {(stream.status === "started" || stream.status === "idle") && (
                  <Button
                    as="a"
                    href={`${STREAM_REDIRECT_URL}/${stream.id
                      }?t=${localStorage.getItem("token")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    leftIcon={<Icon as={FaPlay} />}
                    colorScheme={stream.status === 'started' ? "red" : "blue"}
                    size="md"
                    borderRadius="xl"
                    width={{ base: "full", sm: "auto" }}
                    _hover={{ transform: 'scale(1.02)' }}
                    boxShadow={stream.status === 'started' ? "0 4px 12px rgba(229, 62, 62, 0.4)" : "none"}
                  >
                    {stream.status === 'started' ? "انضم الآن" : "دخول البث"}
                  </Button>
                )}

                {stream.status === "ended" && stream.egress_url && (
                  <Button
                    as={Link}
                    href={stream.egress_url}
                    isExternal
                    leftIcon={<Icon as={FaExternalLinkAlt} />}
                    colorScheme="purple"
                    variant="outline"
                    size="md"
                    borderRadius="xl"
                    width={{ base: "full", sm: "auto" }}
                  >
                    مشاهدة التسجيل
                  </Button>
                )}

                {stream.status === "ended" && (
                  <Button
                    leftIcon={<Icon as={FaDownload} />}
                    colorScheme="green"
                    variant="solid"
                    size="md"
                    isLoading={downloadingId === stream.id}
                    borderRadius="xl"
                    width={{ base: "full", sm: "auto" }}
                    onClick={() => handleDownload(stream.id, stream.title)}
                  >
                    تحميل التسجيل
                  </Button>
                )}

                <HStack width={{ base: "full", sm: "auto" }} justify={{ base: "center", sm: "flex-end" }}>
                  {(stream.status === "started" || stream.status === "idle") && (
                    <Tooltip label="إغلاق البث">
                      <IconButton
                        icon={<FaTimesCircle />}
                        aria-label="إغلاق البث"
                        colorScheme="orange"
                        variant="ghost"
                        size="md"
                        onClick={() => handleCloseStream(stream.id)}
                        borderRadius="lg"
                      />
                    </Tooltip>
                  )}

                  <Tooltip label="تعديل العنوان">
                    <IconButton
                      icon={<FaEdit />}
                      aria-label="تعديل"
                      colorScheme="blue"
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setEditingStream(stream);
                        setNewTitle(stream.title);
                      }}
                      borderRadius="lg"
                    />
                  </Tooltip>

                  <Tooltip label="حذف الجلسة">
                    <IconButton
                      icon={<FaTrash />}
                      aria-label="حذف"
                      colorScheme="red"
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setDeletingStream(stream);
                        onOpen();
                      }}
                      borderRadius="lg"
                    />
                  </Tooltip>
                </HStack>
              </Flex>
            </Flex>
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
          <Box p={4} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="full" mb={4}>
            <Icon as={FaVideo} color={subTextColor} boxSize={10} />
          </Box>
          <Text color={useColorModeValue("gray.500", "gray.400")} fontSize="lg" fontWeight="bold">لا توجد جلسات مباشرة حالياً</Text>
          <Text color={useColorModeValue("gray.400", "gray.500")} fontSize="sm">عند بدء بث مباشر جديد سيظهر هنا</Text>
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
        <ModalContent borderRadius="2xl">
          <ModalHeader borderBottomWidth="1px">تعديل عنوان الجلسة</ModalHeader>
          <ModalCloseButton />
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
          <ModalFooter borderTopWidth="1px">
            <Button
              variant="ghost"
              mr={3}
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
        <ModalContent borderRadius="2xl" textAlign="center" pt={6}>
          <ModalBody>
            <Icon as={FaTrash} color="red.500" boxSize={12} mb={4} />
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
