import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { FaBroadcastTower, FaClock, FaExternalLinkAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import CourseFormModal, {
  CourseModalFieldCard,
  CourseModalFieldLabel,
  useCourseModalInputProps,
} from "../CourseFormModal";
import {
  formatMeetingDateTime,
  fromDatetimeLocalValue,
} from "../../utils/meetingSchedule";

const STREAM_REDIRECT_URL = import.meta.env.VITE_STREAM_REDIRECT_URL;

function resolveCreatedMeeting(payload) {
  if (!payload || typeof payload !== "object") return null;
  return (
    payload.meeting ||
    payload.data?.meeting ||
    (payload.id ? payload : null) ||
    payload.data ||
    null
  );
}

const CreateStreamModal = ({ isOpen, onClose, onSuccess, courseId }) => {
  const [title, setTitle] = useState("");
  const [scheduledStartLocal, setScheduledStartLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null);
  const inputProps = useCourseModalInputProps("blue");
  const successBg = useColorModeValue("white", "gray.800");
  const muted = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setScheduledStartLocal("");
      setCreatedMeeting(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("الرجاء إدخال عنوان المحاضرة المباشرة");
      return;
    }

    const scheduled_start_at = fromDatetimeLocalValue(scheduledStartLocal);
    if (scheduledStartLocal && !scheduled_start_at) {
      toast.error("موعد البداية غير صالح");
      return;
    }
    if (scheduled_start_at && new Date(scheduled_start_at).getTime() < Date.now() - 60_000) {
      toast.error("موعد البداية يجب أن يكون في المستقبل");
      return;
    }

    setLoading(true);
    try {
      const { data } = await baseUrl.post(
        "/api/meeting",
        {
          title: title.trim(),
          course_id: courseId,
          ...(scheduled_start_at ? { scheduled_start_at } : {}),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );
      const meeting = resolveCreatedMeeting(data);
      toast.success(
        scheduled_start_at
          ? "تم جدولة المحاضرة المباشرة بنجاح"
          : "تم إنشاء المحاضرة المباشرة بنجاح",
      );
      setTitle("");
      setScheduledStartLocal("");
      setCreatedMeeting(meeting);
      onSuccess?.(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل في إنشاء المحاضرة المباشرة");
    } finally {
      setLoading(false);
    }
  };

  const handleGoNow = () => {
    const id = createdMeeting?.id;
    const token = localStorage.getItem("token");
    if (id && STREAM_REDIRECT_URL) {
      window.open(`${STREAM_REDIRECT_URL}/${id}?t=${token}`, "_blank", "noopener,noreferrer");
    } else {
      toast.error("تعذر فتح المحاضرة — حاول من قائمة البث");
    }
    setCreatedMeeting(null);
    onClose();
  };

  const handleLater = () => {
    setCreatedMeeting(null);
    onClose();
  };

  const showCreateForm = isOpen && !createdMeeting;
  const showSuccess = Boolean(createdMeeting);

  return (
    <>
      <CourseFormModal
        isOpen={showCreateForm}
        onClose={onClose}
        loading={loading}
        size={{ base: "sm", md: "md" }}
        icon={FaBroadcastTower}
        accent="orange"
        tourTargetId="course-create-stream-modal"
        title="إنشاء محاضرة مباشرة"
        subtitle="أنشئ الآن أو جدولها بموعد بداية يظهر لك وللطلاب"
        onSubmit={handleSubmit}
        submitLabel={scheduledStartLocal ? "جدولة المحاضرة" : "إنشاء المحاضرة"}
        loadingText="جاري الإنشاء..."
        submitColorScheme="orange"
      >
        <VStack spacing={3} align="stretch">
          <CourseModalFieldCard>
            <FormControl isRequired>
              <CourseModalFieldLabel icon={FaBroadcastTower}>
                عنوان المحاضرة
              </CourseModalFieldLabel>
              <Input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مراجعة ليلة الامتحان"
                isDisabled={loading}
                autoFocus
                {...inputProps}
              />
              <Text mt={2} fontSize="xs" color="gray.500">
                سيظهر العنوان للطلاب في قائمة المحاضرات المباشرة
              </Text>
            </FormControl>
          </CourseModalFieldCard>

          <CourseModalFieldCard>
            <FormControl>
              <CourseModalFieldLabel icon={FaClock}>
                موعد البداية (اختياري)
              </CourseModalFieldLabel>
              <Input
                type="datetime-local"
                name="scheduled_start_at"
                value={scheduledStartLocal}
                onChange={(e) => setScheduledStartLocal(e.target.value)}
                isDisabled={loading}
                {...inputProps}
              />
              <Text mt={2} fontSize="xs" color="gray.500">
                لو حددته، تظهر المحاضرة للمحاضر والطلاب بهذا الموعد وتُفتح فيه
              </Text>
            </FormControl>
          </CourseModalFieldCard>
        </VStack>
      </CourseFormModal>

      <Modal
        isOpen={showSuccess}
        onClose={handleLater}
        isCentered
        size={{ base: "sm", md: "md" }}
        closeOnOverlayClick={false}
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={successBg} borderRadius="2xl" mx={4} overflow="hidden">
          <Box h="3px" bgGradient="linear(to-l, #3182CE, #DD6B20)" />
          <ModalHeader pt={5} pb={2}>
            <HStack spacing={3}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                w={10}
                h={10}
                borderRadius="xl"
                bg="orange.500"
                color="white"
              >
                <Icon as={FaBroadcastTower} />
              </Box>
              <Box>
                <Text fontWeight="800" fontSize="md">
                  تم إنشاء المحاضرة
                </Text>
                <Text fontSize="sm" color={muted} fontWeight="normal" noOfLines={1}>
                  {createdMeeting?.title || "المحاضرة المباشرة جاهزة"}
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton onClick={handleLater} />
          <ModalBody pb={2}>
            {createdMeeting?.scheduled_start_at ? (
              <VStack spacing={2}>
                <Text fontSize="sm" color={muted} textAlign="center">
                  تم جدولة المحاضرة وستظهر للطلاب بموعد البداية
                </Text>
                <HStack
                  spacing={2}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  bg="orange.50"
                  _dark={{ bg: "whiteAlpha.100" }}
                >
                  <Icon as={FaClock} color="orange.500" />
                  <Text fontSize="sm" fontWeight="700">
                    {formatMeetingDateTime(createdMeeting.scheduled_start_at)}
                  </Text>
                </HStack>
              </VStack>
            ) : (
              <Text fontSize="sm" color={muted} textAlign="center">
                هل تريد الانتقال إلى غرفة البث الآن أم لاحقاً؟
              </Text>
            )}
          </ModalBody>
          <ModalFooter flexDir="column" gap={2} pb={5} pt={3}>
            <Button
              w="full"
              colorScheme="orange"
              borderRadius="xl"
              h="44px"
              fontWeight="700"
              leftIcon={<Icon as={FaExternalLinkAlt} />}
              onClick={handleGoNow}
            >
              {createdMeeting?.scheduled_start_at
                ? "الدخول للتحضير الآن"
                : "انتقل للمحاضرة الآن"}
            </Button>
            <Button
              w="full"
              variant="ghost"
              borderRadius="xl"
              h="42px"
              fontWeight="600"
              leftIcon={<Icon as={FaClock} />}
              onClick={handleLater}
            >
              في وقت لاحق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateStreamModal;
