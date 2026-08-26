import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaCog, FaTasks } from "react-icons/fa";
import {
  ASSIGNMENT_MODES,
  courseAccessApiError,
} from "../../../api/courseAccessApi";
import { useUpdateCourseAccessSettings } from "../../../Hooks/course/useCourseAccessSettings";
import { ASSIGNMENT_MODE_LABELS } from "../../../utils/lectureAccessUtils";
import {
  TOUR_CLOSE_ACCESS_SETTINGS,
  TOUR_OPEN_ACCESS_SETTINGS,
} from "../../../utils/teacherCoursePageTour";

function SettingsForm({ assignmentMode, setAssignmentMode }) {
  return (
    <VStack align="stretch" spacing={5}>
      <Box
        className="rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-3 text-sm dark:border-blue-800 dark:bg-blue-950/30"
      >
        <Text fontWeight="semibold" color="blue.700" mb={1} _dark={{ color: "blue.200" }}>
          وصول المحاضرات
        </Text>
        <Text fontSize="xs" color="gray.600" _dark={{ color: "gray.400" }}>
          يُحدد عند إضافة كل محاضرة: مفتوحة للكل، مقفولة بكود للجميع، أو لمجموعات محددة
          (أعضاء المجموعة يدخلون مباشرة وباقي الطلاب بالكود). لم يعد هناك وضع وصول موحّد على مستوى الكورس.
        </Text>
      </Box>

      <FormControl>
        <FormLabel fontSize="sm" fontWeight="semibold">
          <HStack spacing={2}>
            <FaTasks />
            <span>مكان الواجبات</span>
          </HStack>
        </FormLabel>
        <RadioGroup value={assignmentMode} onChange={setAssignmentMode}>
          <Stack spacing={2}>
            {Object.entries(ASSIGNMENT_MODE_LABELS).map(([value, label]) => (
              <Box
                key={value}
                className={`rounded-xl border px-3 py-2.5 ${
                  assignmentMode === value
                    ? "border-orange-400 bg-orange-50/80 dark:bg-orange-950/30"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <Radio value={value} colorScheme="orange">
                  <Text fontSize="sm" fontWeight="medium" mr={2}>
                    {label}
                  </Text>
                </Radio>
              </Box>
            ))}
          </Stack>
        </RadioGroup>
      </FormControl>
    </VStack>
  );
}

export default function CourseAccessSettingsPanel({
  courseId,
  settings,
  loading = false,
  canManage = false,
  variant = "button",
  tourTargetId,
}) {
  const toast = useToast();
  const modal = useDisclosure();
  const updateMutation = useUpdateCourseAccessSettings(courseId);
  const [assignmentMode, setAssignmentMode] = useState(ASSIGNMENT_MODES.lecture_based);

  useEffect(() => {
    if (settings) {
      setAssignmentMode(settings.assignment_mode || ASSIGNMENT_MODES.lecture_based);
    }
  }, [settings]);

  useEffect(() => {
    if (modal.isOpen && settings) {
      setAssignmentMode(settings.assignment_mode || ASSIGNMENT_MODES.lecture_based);
    }
  }, [modal.isOpen, settings]);

  useEffect(() => {
    const openSettings = () => modal.onOpen();
    const closeSettings = () => modal.onClose();
    window.addEventListener(TOUR_OPEN_ACCESS_SETTINGS, openSettings);
    window.addEventListener(TOUR_CLOSE_ACCESS_SETTINGS, closeSettings);
    return () => {
      window.removeEventListener(TOUR_OPEN_ACCESS_SETTINGS, openSettings);
      window.removeEventListener(TOUR_CLOSE_ACCESS_SETTINGS, closeSettings);
    };
  }, [modal.onOpen, modal.onClose]);

  if (!canManage) return null;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        assignment_mode: assignmentMode,
      });
      toast({
        title: "تم حفظ الإعدادات",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      modal.onClose();
    } catch (err) {
      toast({
        title: "تعذّر حفظ الإعدادات",
        description: courseAccessApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const dirty =
    assignmentMode !== (settings?.assignment_mode || ASSIGNMENT_MODES.lecture_based);

  const currentAssignmentLabel =
    ASSIGNMENT_MODE_LABELS[settings?.assignment_mode || ASSIGNMENT_MODES.lecture_based];

  return (
    <>
      {variant === "button" ? (
        <Button
          size="sm"
          variant="outline"
          colorScheme="blue"
          borderRadius="xl"
          leftIcon={<Icon as={FaCog} />}
          onClick={modal.onOpen}
          isLoading={loading}
          loadingText="..."
          data-tour-id={tourTargetId}
        >
          إعدادات الواجبات
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          colorScheme="blue"
          borderRadius="xl"
          leftIcon={<Icon as={FaCog} />}
          onClick={modal.onOpen}
        >
          الإعدادات
        </Button>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={updateMutation.isPending ? undefined : modal.onClose}
        closeOnOverlayClick={!updateMutation.isPending}
        size={{ base: "full", md: "lg" }}
        scrollBehavior="inside"
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent
          borderRadius={{ base: "none", md: "2xl" }}
          mx={{ base: 0, md: 4 }}
          dir="rtl"
          data-tour-id="course-access-settings-modal"
        >
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Box className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white">
                <FaCog />
              </Box>
              <Box>
                <Text fontSize="lg" fontWeight="bold">
                  إعدادات الواجبات
                </Text>
                <HStack mt={1} spacing={2} flexWrap="wrap">
                  <Badge colorScheme="blue" borderRadius="full" fontSize="xs">
                    وصول لكل محاضرة
                  </Badge>
                  <Badge colorScheme="orange" borderRadius="full" fontSize="xs" variant="subtle">
                    {currentAssignmentLabel}
                  </Badge>
                </HStack>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton isDisabled={updateMutation.isPending} />

          <ModalBody pt={2}>
            <Text fontSize="sm" color="gray.500" mb={4}>
              وصول المحاضرات يُختار عند إضافة كل محاضرة. هنا تضبط مكان عرض الواجبات فقط.
            </Text>
            <SettingsForm
              assignmentMode={assignmentMode}
              setAssignmentMode={setAssignmentMode}
            />
          </ModalBody>

          <ModalFooter gap={2} flexWrap="wrap">
            <Button
              variant="ghost"
              onClick={modal.onClose}
              isDisabled={updateMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              borderRadius="xl"
              onClick={handleSave}
              isLoading={updateMutation.isPending}
              isDisabled={!dirty}
              loadingText="جاري الحفظ..."
            >
              حفظ الإعدادات
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
