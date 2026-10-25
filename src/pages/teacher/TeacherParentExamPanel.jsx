import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  NumberInput,
  NumberInputField,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { MdSave } from "react-icons/md";
import {
  fetchTeacherParentExamPreview,
  fetchTeacherParentExamSettings,
  fetchTeacherParentExams,
  saveTeacherParentExamSettings,
  setTeacherParentExamEnabled,
  testTeacherParentExam,
} from "../../../api/whatsappTeacherApi";

function applyTeacherTemplate(template, title, score, total) {
  const text = template || "";
  return text
    .replaceAll("{الاسم}", "أحمد")
    .replaceAll("{name}", "أحمد")
    .replaceAll("{الامتحان}", title || "الامتحان")
    .replaceAll("{exam}", title || "الامتحان")
    .replaceAll("{الدرجة}", String(score))
    .replaceAll("{score}", String(score))
    .replaceAll("{المجموع}", String(total))
    .replaceAll("{total}", String(total));
}

export default function TeacherParentExamPanel({ cardBg, border, muted }) {
  const toast = useToast();
  const [prefs, setPrefs] = useState(null);
  const [exams, setExams] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [nextPrefs, nextExams] = await Promise.all([
      fetchTeacherParentExamSettings(),
      fetchTeacherParentExams(),
    ]);
    setPrefs(nextPrefs);
    setExams(Array.isArray(nextExams) ? nextExams : []);
  }, []);

  useEffect(() => {
    void load().catch((err) => {
      toast({
        title: "تعذّر تحميل إشعارات أولياء الأمور",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    });
  }, [load, toast]);

  const savePrefs = async () => {
    setSaving(true);
    try {
      const next = await saveTeacherParentExamSettings(prefs);
      setPrefs(next);
      toast({ title: "تم حفظ إعدادات الإرسال", status: "success" });
    } catch (err) {
      toast({
        title: "تعذّر الحفظ",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const openExam = async (examId) => {
    if (openId === examId) {
      setOpenId(null);
      setPreview(null);
      return;
    }
    setOpenId(examId);
    setPreview(null);
    try {
      setPreview(await fetchTeacherParentExamPreview(examId));
    } catch (err) {
      toast({
        title: "تعذّر عرض الامتحان",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  if (!prefs) return <Spinner />;

  return (
    <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
      <Heading size="sm" mb={2}>
        إشعارات أولياء الأمور — الامتحانات الشاملة
      </Heading>
      <Text fontSize="sm" color={muted} mb={4}>
        الرسائل تطلع من نفس أرقام إشعارات الطلاب. سرعة الإرسال والحد اليومي من إدارة المنصة.
      </Text>
      <VStack align="stretch" spacing={2} mb={4}>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb={0}>الإرسال التلقائي</FormLabel>
          <Switch
            isChecked={Boolean(prefs.auto_send)}
            onChange={(e) => setPrefs({ ...prefs, auto_send: e.target.checked })}
          />
        </FormControl>
        <Checkbox
          isChecked={Boolean(prefs.notify_passed)}
          onChange={(e) => setPrefs({ ...prefs, notify_passed: e.target.checked })}
        >
          ناجح — بعد ما الطالب يسلّم
        </Checkbox>
        <Checkbox
          isChecked={Boolean(prefs.notify_failed)}
          onChange={(e) => setPrefs({ ...prefs, notify_failed: e.target.checked })}
        >
          راسب — بعد ما الطالب يسلّم
        </Checkbox>
        <Checkbox
          isChecked={Boolean(prefs.notify_absent)}
          onChange={(e) => setPrefs({ ...prefs, notify_absent: e.target.checked })}
        >
          لم يدخل — بعد ما الامتحان يقفل
        </Checkbox>
        <Text fontSize="xs" color={muted}>
          اكتب الرسالة كما تحب. استخدم {"{الاسم}"} و{"{الامتحان}"} و{"{الدرجة}"} و{"{المجموع}"} ليتم استبدالها عند الإرسال.
        </Text>
        <FormControl>
          <FormLabel fontSize="sm">رسالة الناجح</FormLabel>
          <Textarea
            value={prefs.template_passed || ""}
            onChange={(e) => setPrefs({ ...prefs, template_passed: e.target.value })}
            rows={2}
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">رسالة الراسب</FormLabel>
          <Textarea
            value={prefs.template_failed || ""}
            onChange={(e) => setPrefs({ ...prefs, template_failed: e.target.value })}
            rows={2}
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">رسالة اللي ما دخلش</FormLabel>
          <Textarea
            value={prefs.template_absent || ""}
            onChange={(e) => setPrefs({ ...prefs, template_absent: e.target.value })}
            rows={2}
          />
        </FormControl>
        <FormControl maxW="180px">
          <FormLabel fontSize="sm">نسبة النجاح %</FormLabel>
          <NumberInput
            min={0}
            max={100}
            value={prefs.pass_percentage}
            onChange={(_t, n) => setPrefs({ ...prefs, pass_percentage: Number.isFinite(n) ? n : 50 })}
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>
        <Button size="sm" colorScheme="green" leftIcon={<MdSave />} alignSelf="start" isLoading={saving} onClick={() => void savePrefs()}>
          حفظ الإرسال التلقائي
        </Button>
      </VStack>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>الامتحان</Th>
            <Th>الإشعارات</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {exams.map((exam) => (
            <React.Fragment key={exam.id}>
              <Tr>
                <Td>{exam.title}</Td>
                <Td>{exam.enabled ? "شغالة" : "مكتومة"}</Td>
                <Td>
                  <Button size="xs" type="button" onClick={() => void openExam(Number(exam.id))}>
                    {openId === Number(exam.id) ? "إخفاء" : "تفاصيل"}
                  </Button>
                </Td>
              </Tr>
              {openId === Number(exam.id) ? (
                <Tr>
                  <Td colSpan={3}>
                    <VStack align="stretch" spacing={2}>
                      {preview ? (
                        <HStack>
                          <Badge>ناجح {preview.counts?.passed ?? 0}</Badge>
                          <Badge>راسب {preview.counts?.failed ?? 0}</Badge>
                          <Badge>لم يدخل {preview.counts?.absent ?? 0}</Badge>
                        </HStack>
                      ) : (
                        <Spinner size="sm" />
                      )}
                      <Text fontSize="sm">{applyTeacherTemplate(prefs.template_passed, exam.title, 16, 20)}</Text>
                      <Text fontSize="sm">{applyTeacherTemplate(prefs.template_failed, exam.title, 8, 20)}</Text>
                      <Text fontSize="sm">{applyTeacherTemplate(prefs.template_absent, exam.title, 0, 20)}</Text>
                      <HStack>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() =>
                            void setTeacherParentExamEnabled(exam.id, !exam.enabled)
                              .then(() => load())
                              .then(() =>
                                toast({
                                  title: exam.enabled ? "تم كتم الامتحان" : "تم تشغيل الامتحان",
                                  status: "success",
                                }),
                              )
                          }
                        >
                          {exam.enabled ? "كتم" : "تشغيل"}
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="green"
                          type="button"
                          isDisabled={!preview?.samples?.passed?.[0]}
                          onClick={() => {
                            const student = preview?.samples?.passed?.[0];
                            if (!student) return;
                            void testTeacherParentExam(exam.id, student.studentId, "passed").then(() =>
                              toast({ title: "اتجدولة رسالة لولي الأمر", status: "success" }),
                            );
                          }}
                        >
                          تجربة ناجح
                        </Button>
                      </HStack>
                    </VStack>
                  </Td>
                </Tr>
              ) : null}
            </React.Fragment>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
