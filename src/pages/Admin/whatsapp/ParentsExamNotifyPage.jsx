import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { MdRefresh, MdSave } from "react-icons/md";
import {
  cancelParentsExamPending,
  fetchParentsExamExams,
  fetchParentsExamPreview,
  fetchParentsExamSettings,
  pauseParentsExam,
  resumeParentsExam,
  saveParentsExamSettings,
  sendParentsExamCohorts,
  setParentsExamEnabled,
  testParentsExamSend,
} from "../../../api/whatsappAdminApi";

const COHORT_LABEL = {
  passed: "ناجح",
  failed: "راسب",
  absent: "لم يدخل",
};

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ar-EG", { hour12: false });
}

export default function ParentsExamNotifyPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [testStudentId, setTestStudentId] = useState("");
  const [testCohort, setTestCohort] = useState("passed");
  const [busyExam, setBusyExam] = useState(false);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSettings, nextExams] = await Promise.all([
        fetchParentsExamSettings(),
        fetchParentsExamExams(),
      ]);
      setSettings(nextSettings);
      setDraft(nextSettings?.config || null);
      setExams(Array.isArray(nextExams) ? nextExams : []);
    } catch (err) {
      toast({
        title: "تعذّر تحميل الإعدادات",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadPreview = useCallback(
    async (examId) => {
      if (!examId) {
        setPreview(null);
        return;
      }
      try {
        const data = await fetchParentsExamPreview(examId);
        setPreview(data);
        const first =
          data?.samples?.passed?.[0] ||
          data?.samples?.failed?.[0] ||
          data?.samples?.absent?.[0];
        setTestStudentId(first ? String(first.studentId) : "");
        if (data?.samples?.passed?.length) setTestCohort("passed");
        else if (data?.samples?.failed?.length) setTestCohort("failed");
        else setTestCohort("absent");
      } catch (err) {
        toast({
          title: "تعذّر عرض الامتحان",
          description: err?.response?.data?.message || err.message,
          status: "error",
        });
      }
    },
    [toast],
  );

  useEffect(() => {
    if (selectedId) void loadPreview(selectedId);
  }, [selectedId, loadPreview]);

  const patchDraft = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const next = await saveParentsExamSettings({
        auto_send: draft.auto_send,
        notify_passed: draft.notify_passed,
        notify_failed: draft.notify_failed,
        notify_absent: draft.notify_absent,
        pass_percentage: Number(draft.pass_percentage),
        interval_seconds: Number(draft.interval_seconds),
        jitter_seconds: Number(draft.jitter_seconds),
        daily_cap: Number(draft.daily_cap),
        quiet_hours: draft.quiet_hours,
      });
      setSettings(next);
      setDraft(next.config);
      toast({ title: "تم حفظ الإعدادات", status: "success" });
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

  const runExamAction = async (action) => {
    if (!selectedId) return;
    setBusyExam(true);
    try {
      await action();
      await load();
      await loadPreview(selectedId);
    } catch (err) {
      toast({
        title: "تعذّر تنفيذ الأمر",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setBusyExam(false);
    }
  };

  if (loading || !draft) {
    return (
      <Flex minH="60vh" align="center" justify="center" bg={pageBg}>
        <Spinner />
      </Flex>
    );
  }

  const selected = exams.find((exam) => exam.id === selectedId);
  const sampleStudents = preview
    ? [
        ...(preview.samples?.passed || []).map((row) => ({ ...row, cohort: "passed" })),
        ...(preview.samples?.failed || []).map((row) => ({ ...row, cohort: "failed" })),
        ...(preview.samples?.absent || []).map((row) => ({ ...row, cohort: "absent" })),
      ]
    : [];

  return (
    <Box bg={pageBg} minH="100vh" py={6}>
      <Container maxW="6xl">
        <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
          <HStack>
            <FaWhatsapp color="#25D366" size={22} />
            <Heading size="md" color={title}>
              إشعارات أولياء الأمور
            </Heading>
          </HStack>
          <HStack>
            <Button as={RouterLink} to="/admin/whatsapp/services" size="sm" variant="outline">
              ربط الرقم
            </Button>
            <Button leftIcon={<MdRefresh />} size="sm" onClick={() => void load()}>
              تحديث
            </Button>
          </HStack>
        </Flex>

        {!settings?.isEnabled && (
          <Alert status="warning" borderRadius="lg" mb={4}>
            <AlertIcon />
            الخدمة لسه مش مفعّلة. فعّلها واربط رقم واتساب من صفحة الخدمات.
          </Alert>
        )}

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
          <Stat label="اتبعتت النهاردة" value={settings?.sentToday ?? 0} cardBg={cardBg} border={border} muted={muted} />
          <Stat label="المتبقي من الحد" value={settings?.capRemaining ?? 0} cardBg={cardBg} border={border} muted={muted} />
          <Stat label="أرقام جاهزة" value={settings?.readySessions ?? 0} cardBg={cardBg} border={border} muted={muted} />
        </SimpleGrid>

        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={4} mb={4}>
          <Heading size="sm" mb={3}>
            الإرسال التلقائي
          </Heading>
          <VStack align="stretch" spacing={3}>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>الإرسال التلقائي</FormLabel>
              <Switch
                isChecked={Boolean(draft.auto_send)}
                onChange={(e) => patchDraft("auto_send", e.target.checked)}
              />
            </FormControl>
            <Checkbox
              isChecked={Boolean(draft.notify_passed)}
              onChange={(e) => patchDraft("notify_passed", e.target.checked)}
            >
              ناجح — بعد ما الطالب يسلّم
            </Checkbox>
            <Checkbox
              isChecked={Boolean(draft.notify_failed)}
              onChange={(e) => patchDraft("notify_failed", e.target.checked)}
            >
              راسب — بعد ما الطالب يسلّم
            </Checkbox>
            <Checkbox
              isChecked={Boolean(draft.notify_absent)}
              onChange={(e) => patchDraft("notify_absent", e.target.checked)}
            >
              لم يدخل — بعد ما الامتحان يقفل
            </Checkbox>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              <NumberField
                label="نسبة النجاح %"
                value={draft.pass_percentage}
                min={0}
                max={100}
                onChange={(value) => patchDraft("pass_percentage", value)}
              />
              <NumberField
                label="ثواني بين كل رسالة"
                value={draft.interval_seconds}
                min={15}
                max={300}
                onChange={(value) => patchDraft("interval_seconds", value)}
              />
              <NumberField
                label="عشوائية بالثواني"
                value={draft.jitter_seconds}
                min={0}
                max={120}
                onChange={(value) => patchDraft("jitter_seconds", value)}
              />
              <NumberField
                label="حد يومي"
                value={draft.daily_cap}
                min={1}
                max={5000}
                onChange={(value) => patchDraft("daily_cap", value)}
              />
            </SimpleGrid>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>ساعات الهدوء ({draft.quiet_hours?.start}–{draft.quiet_hours?.end} القاهرة)</FormLabel>
              <Switch
                isChecked={Boolean(draft.quiet_hours?.enabled)}
                onChange={(e) =>
                  patchDraft("quiet_hours", { ...draft.quiet_hours, enabled: e.target.checked })
                }
              />
            </FormControl>
            <Button leftIcon={<MdSave />} colorScheme="green" alignSelf="start" isLoading={saving} onClick={() => void save()}>
              حفظ
            </Button>
          </VStack>
        </Box>

        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={4} mb={4}>
          <Heading size="sm" mb={3}>
            الجاية في الطابور
          </Heading>
          {(settings?.upcoming || []).length === 0 ? (
            <Text color={muted}>مفيش رسائل متجدولة دلوقتي.</Text>
          ) : (
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>الامتحان</Th>
                  <Th>الطالب</Th>
                  <Th>الحالة</Th>
                  <Th>موعد الإرسال</Th>
                </Tr>
              </Thead>
              <Tbody>
                {settings.upcoming.map((row) => (
                  <Tr key={row.notificationId}>
                    <Td>{row.examTitle}</Td>
                    <Td>{row.studentName}</Td>
                    <Td>{COHORT_LABEL[row.cohort] || row.cohort}</Td>
                    <Td>{formatWhen(row.scheduledAt)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>

        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={4}>
          <Heading size="sm" mb={3}>
            الامتحانات
          </Heading>
          <Table size="sm" mb={4}>
            <Thead>
              <Tr>
                <Th>الامتحان</Th>
                <Th>الحالة</Th>
                <Th>الإشعارات</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {exams.map((exam) => (
                <Tr key={exam.id} bg={exam.id === selectedId ? "green.50" : undefined}>
                  <Td>{exam.title}</Td>
                  <Td>
                    <Badge colorScheme={exam.isActive ? "green" : "gray"}>
                      {exam.isActive ? "مفتوح" : "مقفول"}
                    </Badge>
                    {exam.paused ? (
                      <Badge colorScheme="orange" mr={1}>
                        متوقف
                      </Badge>
                    ) : null}
                  </Td>
                  <Td>
                    {exam.enabled ? "شغالة" : "مكتومة"}
                    <Text fontSize="xs" color={muted}>
                      طابور {exam.scheduledCount ?? 0} · اتبعت {exam.sentCount ?? 0}
                    </Text>
                  </Td>
                  <Td>
                    <Button size="xs" onClick={() => setSelectedId(exam.id)}>
                      تفاصيل
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {selected && preview && (
            <VStack align="stretch" spacing={3}>
              <Text fontWeight="700">{selected.title}</Text>
              <HStack wrap="wrap" spacing={2}>
                <Badge>ناجح {preview.counts?.passed ?? 0}</Badge>
                <Badge>راسب {preview.counts?.failed ?? 0}</Badge>
                <Badge>لم يدخل {preview.counts?.absent ?? 0}</Badge>
                <Badge colorScheme="orange">لسه بيمتحن {preview.counts?.inProgress ?? 0}</Badge>
                <Badge colorScheme="red">بدون رقم {preview.counts?.missingPhone ?? 0}</Badge>
              </HStack>
              <HStack wrap="wrap">
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={busyExam}
                  onClick={() =>
                    void runExamAction(async () => {
                      await setParentsExamEnabled(selected.id, !selected.enabled);
                      toast({ title: selected.enabled ? "تم كتم الامتحان" : "تم تشغيل الامتحان", status: "success" });
                    })
                  }
                >
                  {selected.enabled ? "كتم" : "تشغيل"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={busyExam}
                  onClick={() =>
                    void runExamAction(async () => {
                      if (selected.paused) {
                        await resumeParentsExam(selected.id);
                        toast({ title: "تم استئناف الطابور", status: "success" });
                      } else {
                        await pauseParentsExam(selected.id);
                        toast({ title: "الطابور متوقف", status: "success" });
                      }
                    })
                  }
                >
                  {selected.paused ? "استئناف" : "إيقاف مؤقت"}
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  isLoading={busyExam}
                  onClick={() =>
                    void runExamAction(async () => {
                      const result = await cancelParentsExamPending(selected.id);
                      toast({
                        title: `اتلغى ${result?.notifications ?? 0} رسالة`,
                        status: "success",
                      });
                    })
                  }
                >
                  إلغاء المعلق
                </Button>
                <Button
                  size="sm"
                  colorScheme="green"
                  variant="outline"
                  isLoading={busyExam}
                  onClick={() =>
                    void runExamAction(async () => {
                      const result = await sendParentsExamCohorts(selected.id, {
                        passed: Boolean(draft.notify_passed),
                        failed: Boolean(draft.notify_failed),
                        absent: Boolean(draft.notify_absent),
                      });
                      toast({
                        title: `اتجدول ${result?.inserted ?? 0}، واتتخطى ${result?.skipped ?? 0}`,
                        status: "success",
                      });
                    })
                  }
                >
                  أرسل الآن بالتباعد
                </Button>
              </HStack>
              <HStack align="end" wrap="wrap">
                <FormControl maxW="280px">
                  <FormLabel fontSize="sm">طالب للتجربة</FormLabel>
                  <Select value={testStudentId} onChange={(e) => setTestStudentId(e.target.value)}>
                    <option value="">اختار</option>
                    {sampleStudents.map((student) => (
                      <option key={`${student.cohort}-${student.studentId}`} value={student.studentId}>
                        {student.studentName} — {COHORT_LABEL[student.cohort]}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl maxW="180px">
                  <FormLabel fontSize="sm">الحالة</FormLabel>
                  <Select value={testCohort} onChange={(e) => setTestCohort(e.target.value)}>
                    <option value="passed">ناجح</option>
                    <option value="failed">راسب</option>
                    <option value="absent">لم يدخل</option>
                  </Select>
                </FormControl>
                <Button
                  colorScheme="green"
                  isLoading={busyExam}
                  onClick={() =>
                    void runExamAction(async () => {
                      if (!testStudentId) throw new Error("اختار طالب");
                      const result = await testParentsExamSend(
                        selected.id,
                        Number(testStudentId),
                        testCohort,
                      );
                      toast({
                        title: "اتجدولة رسالة واحدة لولي الأمر",
                        description: formatWhen(result?.scheduledAt),
                        status: "success",
                      });
                    })
                  }
                >
                  تجربة ولي أمر واحد
                </Button>
              </HStack>
            </VStack>
          )}
        </Box>
      </Container>
    </Box>
  );
}

function Stat({ label, value, cardBg, border, muted }) {
  return (
    <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={4}>
      <Text fontSize="xs" color={muted} mb={1}>
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="800">
        {value}
      </Text>
    </Box>
  );
}

function NumberField({ label, value, min, max, onChange }) {
  return (
    <FormControl>
      <FormLabel fontSize="sm">{label}</FormLabel>
      <NumberInput
        min={min}
        max={max}
        value={value}
        onChange={(_text, num) => onChange(Number.isFinite(num) ? num : min)}
      >
        <NumberInputField />
      </NumberInput>
    </FormControl>
  );
}
