import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  RadioGroup,
  Radio,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { fetchTeacherCourses, fetchCourseLectures } from "../../../api/teacherLectureExamsApi";
import ExamStudentSettingsFields, {
  inferAnswersReleaseMode,
} from "../../../components/exam/ExamStudentSettingsFields";
import QuestionDisplayModeFields from "../../../components/exam/QuestionDisplayModeFields";
import { QUESTION_DISPLAY_MODES } from "../../../utils/examFlowUtils";

export default function ApproveExamModal({
  isOpen,
  onClose,
  onConfirm,
  submitting,
  defaultTitle = "",
  questionCount = 0,
}) {
  const [mode, setMode] = useState("only");
  const [title, setTitle] = useState(defaultTitle);
  const [courseId, setCourseId] = useState("");
  const [lectureId, setLectureId] = useState("");
  const [duration, setDuration] = useState("60");
  const [totalGrade, setTotalGrade] = useState("100");
  const [questionsCount, setQuestionsCount] = useState(String(questionCount || ""));
  const [settings, setSettings] = useState({
    show_at: "",
    hide_at: "",
    available_from: "",
    visibility_end_date: "",
    answers_release_mode: "immediate",
    show_answers_immediately: true,
    show_answers_after_hours: 24,
    answers_visible_at: "",
    question_display_mode: QUESTION_DISPLAY_MODES.ORDERED,
  });
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  const noteBg = useColorModeValue("blue.50", "blue.900");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isOpen) return;
    setTitle(defaultTitle || "امتحان من بنك الأسئلة");
    setMode("only");
    setCourseId("");
    setLectureId("");
    setQuestionsCount(String(questionCount || ""));
    setSettings({
      show_at: "",
      hide_at: "",
      available_from: "",
      visibility_end_date: "",
      answers_release_mode: "immediate",
      show_answers_immediately: true,
      show_answers_after_hours: 24,
      answers_visible_at: "",
      question_display_mode: QUESTION_DISPLAY_MODES.ORDERED,
    });
  }, [isOpen, defaultTitle, questionCount]);

  useEffect(() => {
    if (!isOpen || !token) return;
    fetchTeacherCourses(token)
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [isOpen, token]);

  useEffect(() => {
    if (!courseId || !token) {
      setLectures([]);
      setLectureId("");
      return;
    }
    setLoadingLectures(true);
    fetchCourseLectures(courseId, token)
      .then((list) => setLectures(list))
      .catch(() => setLectures([]))
      .finally(() => setLoadingLectures(false));
  }, [courseId, token]);

  const buildPayload = () => {
    if (mode === "only") {
      return { create_exam: false };
    }
    const shared = {
      title: title.trim() || undefined,
      questions_count: Number(questionsCount) || questionCount || undefined,
      question_display_mode: settings.question_display_mode,
      answers_release_mode: settings.answers_release_mode || inferAnswersReleaseMode(settings),
      show_answers_after_hours: Number(settings.show_answers_after_hours) || undefined,
      answers_visible_at: settings.answers_visible_at
        ? new Date(settings.answers_visible_at).toISOString()
        : undefined,
    };
    if (mode === "course") {
      return {
        ...shared,
        course_id: Number(courseId),
        duration_minutes: Number(duration) || 60,
        available_from: settings.available_from
          ? new Date(settings.available_from).toISOString()
          : undefined,
        visibility_end_date: settings.visibility_end_date
          ? new Date(settings.visibility_end_date).toISOString()
          : undefined,
      };
    }
    return {
      ...shared,
      lecture_id: Number(lectureId),
      type: "exam",
      duration: Number(duration) || 60,
      total_grade: Number(totalGrade) || 100,
      show_at: settings.show_at ? new Date(settings.show_at).toISOString() : undefined,
      hide_at: settings.hide_at ? new Date(settings.hide_at).toISOString() : undefined,
    };
  };

  const canSubmit =
    mode === "only" ||
    (mode === "course" && courseId) ||
    (mode === "lecture" && lectureId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="xl" dir="rtl">
        <ModalHeader fontSize="md">اعتماد {questionCount} سؤال</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <BoxNote bg={noteBg}>
              اختر اعتماد الأسئلة فقط، أو إنشاء امتحان جديد وربط الأسئلة به تلقائياً.
            </BoxNote>

            <RadioGroup value={mode} onChange={setMode}>
              <Stack spacing={2}>
                <Radio value="only" colorScheme="blue">
                  اعتماد فقط (بدون إنشاء امتحان)
                </Radio>
                <Radio value="course" colorScheme="blue">
                  اعتماد + إنشاء امتحان كورس
                </Radio>
                <Radio value="lecture" colorScheme="blue">
                  اعتماد + إنشاء امتحان محاضرة
                </Radio>
              </Stack>
            </RadioGroup>

            {mode !== "only" && (
              <FormControl>
                <FormLabel fontSize="sm">عنوان الامتحان</FormLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} borderRadius="lg" />
              </FormControl>
            )}

            {mode === "course" && (
              <>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">الكورس</FormLabel>
                  <Select
                    placeholder="اختر الكورس"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    borderRadius="lg"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">المدة (دقيقة)</FormLabel>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    borderRadius="lg"
                  />
                </FormControl>
              </>
            )}

            {mode === "lecture" && (
              <>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">الكورس</FormLabel>
                  <Select
                    placeholder="اختر الكورس"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    borderRadius="lg"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">المحاضرة</FormLabel>
                  <Select
                    placeholder={loadingLectures ? "جاري التحميل..." : "اختر المحاضرة"}
                    value={lectureId}
                    onChange={(e) => setLectureId(e.target.value)}
                    borderRadius="lg"
                    isDisabled={!courseId || loadingLectures}
                  >
                    {lectures.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title || l.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">المدة (دقيقة)</FormLabel>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    borderRadius="lg"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">الدرجة الكلية</FormLabel>
                  <Input
                    type="number"
                    value={totalGrade}
                    onChange={(e) => setTotalGrade(e.target.value)}
                    borderRadius="lg"
                  />
                </FormControl>
              </>
            )}
            {mode !== "only" && (
              <>
                <FormControl>
                  <FormLabel fontSize="sm">عدد الأسئلة المعروضة للطالب</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(e.target.value)}
                    borderRadius="lg"
                  />
                </FormControl>
                <QuestionDisplayModeFields
                  value={settings.question_display_mode}
                  onChange={(value) =>
                    setSettings((prev) => ({ ...prev, question_display_mode: value }))
                  }
                  questionsCount={questionsCount}
                />
                <ExamStudentSettingsFields
                  formData={settings}
                  showField={mode === "course" ? "available_from" : "show_at"}
                  expireField={mode === "course" ? "visibility_end_date" : "hide_at"}
                  scheduledField="answers_visible_at"
                  onPatch={(partial) => setSettings((prev) => ({ ...prev, ...partial }))}
                />
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            colorScheme="green"
            onClick={() => onConfirm(buildPayload())}
            isLoading={submitting}
            isDisabled={!canSubmit}
          >
            تأكيد الاعتماد
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function BoxNote({ children, bg }) {
  return (
    <Text fontSize="sm" p={3} borderRadius="lg" bg={bg} lineHeight="tall">
      {children}
    </Text>
  );
}
