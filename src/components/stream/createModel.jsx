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
  const [loading, setLoading] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null);
  const inputProps = useCourseModalInputProps("blue");
  const successBg = useColorModeValue("white", "gray.800");
  const muted = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setCreatedMeeting(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("الرجاء إدخال عنوان المحاضرة المباشرة");
      return;
    }

    setLoading(true);
    try {
      const { data } = await baseUrl.post(
        "/api/meeting",
        { title: title.trim(), course_id: courseId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );
      const meeting = resolveCreatedMeeting(data);
      toast.success("تم إنشاء المحاضرة المباشرة بنجاح");
      setTitle("");
      setCreatedMeeting(meeting);
      onSuccess?.(data);
    } catch {
      toast.error("فشل في إنشاء المحاضرة المباشرة");
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
        subtitle="أنشئ محاضرة بث مباشر للطلاب داخل هذا الكورس"
        onSubmit={handleSubmit}
        submitLabel="إنشاء المحاضرة"
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
            <Text fontSize="sm" color={muted} textAlign="center">
              هل تريد الانتقال إلى غرفة البث الآن أم لاحقاً؟
            </Text>
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
              انتقل للمحاضرة الآن
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
