import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormHelperText,
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
import { FaCog, FaKey, FaClock, FaUnlock, FaTasks } from "react-icons/fa";
import {
  ASSIGNMENT_MODES,
  courseAccessApiError,
  LECTURE_ACCESS_MODES,
} from "../../../api/courseAccessApi";
import { useUpdateCourseAccessSettings } from "../../../Hooks/course/useCourseAccessSettings";
import {
  ASSIGNMENT_MODE_LABELS,
  LECTURE_ACCESS_MODE_LABELS,
} from "../../../utils/lectureAccessUtils";

const MODE_ICONS = {
  always_open: FaUnlock,
  time_limited: FaClock,
  activation_code: FaKey,
};

function SettingsForm({
  lectureAccessMode,
  setLectureAccessMode,
  assignmentMode,
  setAssignmentMode,
}) {
  return (
    <VStack align="stretch" spacing={5}>
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="semibold">
          <HStack spacing={2}>
            <FaUnlock />
            <span>طريقة فتح المحاضرات</span>
          </HStack>
        </FormLabel>
        <RadioGroup value={lectureAccessMode} onChange={setLectureAccessMode}>
          <Stack spacing={2}>
            {Object.entries(LECTURE_ACCESS_MODE_LABELS).map(([value, label]) => {
              const ModeIcon = MODE_ICONS[value] || FaUnlock;
              return (
                <Box
                  key={value}
                  className={`rounded-xl border px-3 py-2.5 transition-colors ${
                    lectureAccessMode === value
                      ? "border-blue-400 bg-blue-50/80 dark:bg-blue-950/40"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <Radio value={value} colorScheme="blue">
                    <HStack spacing={2} mr={2}>
                      <ModeIcon className="text-blue-500" />
                      <Text fontSize="sm" fontWeight="medium">
                        {label}
                      </Text>
                    </HStack>
                  </Radio>
                  {value === LECTURE_ACCESS_MODES.time_limited ? (
                    <FormHelperText mt={1} mr={6} fontSize="xs">
                      عند إضافة محاضرة يجب تحديد موعد انتهاء الوصول
                    </FormHelperText>
                  ) : null}
                  {value === LECTURE_ACCESS_MODES.activation_code ? (
                    <FormHelperText mt={1} mr={6} fontSize="xs">
                      الطالب يفعّل كل محاضرة بكود — المدة تُحسب من لحظة الاستخدام
                    </FormHelperText>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </RadioGroup>
      </FormControl>

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
}) {
  const toast = useToast();
  const modal = useDisclosure();
  const updateMutation = useUpdateCourseAccessSettings(courseId);
  const [lectureAccessMode, setLectureAccessMode] = useState(LECTURE_ACCESS_MODES.always_open);
  const [assignmentMode, setAssignmentMode] = useState(ASSIGNMENT_MODES.lecture_based);

  useEffect(() => {
    if (settings) {
      setLectureAccessMode(settings.lecture_access_mode || LECTURE_ACCESS_MODES.always_open);
      setAssignmentMode(settings.assignment_mode || ASSIGNMENT_MODES.lecture_based);
    }
  }, [settings]);

  useEffect(() => {
    if (modal.isOpen && settings) {
      setLectureAccessMode(settings.lecture_access_mode || LECTURE_ACCESS_MODES.always_open);
      setAssignmentMode(settings.assignment_mode || ASSIGNMENT_MODES.lecture_based);
    }
  }, [modal.isOpen, settings]);

  if (!canManage) return null;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        lecture_access_mode: lectureAccessMode,
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
    lectureAccessMode !== (settings?.lecture_access_mode || LECTURE_ACCESS_MODES.always_open) ||
    assignmentMode !== (settings?.assignment_mode || ASSIGNMENT_MODES.lecture_based);

  const currentAccessLabel =
    LECTURE_ACCESS_MODE_LABELS[settings?.lecture_access_mode || LECTURE_ACCESS_MODES.always_open];
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
        >
          إعدادات الوصول
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
        <ModalContent borderRadius={{ base: "none", md: "2xl" }} mx={{ base: 0, md: 4 }} dir="rtl">
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Box
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white"
              >
                <FaCog />
              </Box>
              <Box>
                <Text fontSize="lg" fontWeight="bold">
                  إعدادات الوصول والواجبات
                </Text>
                <HStack mt={1} spacing={2} flexWrap="wrap">
                  <Badge colorScheme="blue" borderRadius="full" fontSize="xs">
                    {currentAccessLabel}
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
              اختر كيف يفتح الطلاب المحاضرات وأين تُعرض الواجبات في هذا الكورس
            </Text>
            <SettingsForm
              lectureAccessMode={lectureAccessMode}
              setLectureAccessMode={setLectureAccessMode}
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
