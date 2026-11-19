import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  MdAdd,
  MdChevronLeft,
  MdChevronRight,
  MdDelete,
  MdEdit,
  MdRefresh,
} from "react-icons/md";
import {
  createScheduleTask,
  deleteScheduleTask,
  fetchScheduleTeachers,
  fetchScheduleTasks,
  updateScheduleTask,
} from "../../../api/teacherScheduleApi";

const TASK_META = {
  lecture: { label: "محاضرة", color: "blue", icon: "📚" },
  live: { label: "حصة مباشرة", color: "purple", icon: "🎥" },
  exam: { label: "امتحان", color: "red", icon: "📝" },
  homework: { label: "واجب", color: "orange", icon: "📌" },
};

const EMPTY_FORM = {
  taskType: "lecture",
  title: "",
  courseName: "",
  taskDate: "",
  startTime: "",
  endTime: "",
  dueAt: "",
  meetingUrl: "",
  notes: "",
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function toYmd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseYmd(ymd) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(ymd, days) {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

function startOfWeek(ymd) {
  const d = parseYmd(ymd);
  const day = d.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  return toYmd(d);
}

function startOfMonth(ymd) {
  const d = parseYmd(ymd);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function daysInMonth(ymd) {
  const d = parseYmd(ymd);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function timeShort(value) {
  if (!value) return "";
  const m = String(value).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

function cairoToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function TeacherScheduleCalendarPage() {
  const { teacherId } = useParams();
  const tid = Number(teacherId);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("week");
  const [cursor, setCursor] = useState(cairoToday());
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const dayHover = useColorModeValue("blue.50", "whiteAlpha.100");
  const today = cairoToday();

  const range = useMemo(() => {
    if (view === "day") return { from: cursor, to: cursor };
    if (view === "week") {
      const from = startOfWeek(cursor);
      return { from, to: addDays(from, 6) };
    }
    const from = startOfMonth(cursor);
    const last = daysInMonth(cursor);
    const [y, m] = from.split("-");
    return { from, to: `${y}-${m}-${pad(last)}` };
  }, [view, cursor]);

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    try {
      const [teachers, rows] = await Promise.all([
        fetchScheduleTeachers(),
        fetchScheduleTasks({ teacherId: tid, from: range.from, to: range.to }),
      ]);
      setTeacher((teachers || []).find((t) => Number(t.id) === tid) || null);
      setTasks(Array.isArray(rows) ? rows : []);
    } catch (err) {
      toast({
        title: "تعذّر تحميل الجدول",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [tid, range.from, range.to, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const byDate = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      const key = String(task.taskDate || task.task_date).slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const days = useMemo(() => {
    if (view === "day") return [cursor];
    if (view === "week") {
      const from = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => addDays(from, i));
    }
    const from = startOfMonth(cursor);
    const count = daysInMonth(cursor);
    const firstDow = parseYmd(from).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const cells = [];
    for (let i = 0; i < offset; i += 1) cells.push(null);
    for (let i = 0; i < count; i += 1) cells.push(addDays(from, i));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view, cursor]);

  const openCreate = (date) => {
    setEditing(null);
    setSelectedTask(null);
    setForm({ ...EMPTY_FORM, taskDate: date || cursor });
    onOpen();
  };

  const openEdit = (task) => {
    setEditing(task);
    setSelectedTask(task);
    setForm({
      taskType: task.taskType || task.task_type,
      title: task.title || "",
      courseName: task.courseName || task.course_name || "",
      taskDate: String(task.taskDate || task.task_date).slice(0, 10),
      startTime: timeShort(task.startTime || task.start_time),
      endTime: timeShort(task.endTime || task.end_time),
      dueAt: task.dueAt || task.due_at
        ? String(task.dueAt || task.due_at).slice(0, 16)
        : "",
      meetingUrl: task.meetingUrl || task.meeting_url || "",
      notes: task.notes || "",
    });
    onOpen();
  };

  const save = async () => {
    if (!form.title.trim() || !form.taskDate) {
      toast({ title: "العنوان والتاريخ مطلوبان", status: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        teacherId: tid,
        taskType: form.taskType,
        title: form.title.trim(),
        courseName: form.courseName || null,
        taskDate: form.taskDate,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        meetingUrl: form.meetingUrl || null,
        notes: form.notes || null,
      };
      if (editing) await updateScheduleTask(editing.id, payload);
      else await createScheduleTask(payload);
      toast({ title: editing ? "تم تحديث المهمة" : "تمت إضافة المهمة", status: "success" });
      onClose();
      await load();
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

  const remove = async (task) => {
    if (!window.confirm(`حذف المهمة: ${task.title}؟`)) return;
    try {
      await deleteScheduleTask(task.id);
      toast({ title: "تم الحذف", status: "success" });
      setSelectedTask(null);
      await load();
    } catch (err) {
      toast({
        title: "تعذّر الحذف",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const shift = (dir) => {
    if (view === "day") setCursor((c) => addDays(c, dir));
    else if (view === "week") setCursor((c) => addDays(c, dir * 7));
    else {
      const d = parseYmd(startOfMonth(cursor));
      d.setMonth(d.getMonth() + dir);
      setCursor(toYmd(d));
    }
  };

  const titleLabel = useMemo(() => {
    if (view === "day") return cursor;
    if (view === "week") return `${range.from} → ${range.to}`;
    const d = parseYmd(cursor);
    return d.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  }, [view, cursor, range]);

  const todayTasks = byDate[today] || [];
  const upcoming = tasks.filter((t) => String(t.taskDate || t.task_date).slice(0, 10) > today);
  const past = tasks.filter((t) => String(t.taskDate || t.task_date).slice(0, 10) < today);

  const renderTaskChip = (task) => {
    const meta = TASK_META[task.taskType || task.task_type] || TASK_META.lecture;
    const time =
      timeShort(task.startTime || task.start_time) ||
      (task.dueAt || task.due_at ? "استحقاق" : "");
    return (
      <Box
        key={task.id}
        bg={`${meta.color}.500`}
        color="white"
        borderRadius="md"
        px={2}
        py={1}
        fontSize="xs"
        cursor="pointer"
        mb={1}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTask(task);
        }}
        title={task.title}
      >
        {meta.icon} {time ? `${time} · ` : ""}
        {task.title}
      </Box>
    );
  };

  return (
    <Box dir="rtl" bg={pageBg} minH="100vh" py={6}>
      <Container maxW="7xl">
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={3} mb={4} wrap="wrap">
          <Box>
            <Button as={RouterLink} to="/admin/teacher-schedules" size="sm" variant="ghost" mb={2}>
              ← كل المدرسين
            </Button>
            <Heading size="lg">{teacher?.name || `مدرس #${tid}`}</Heading>
            <Text color={muted} fontSize="sm">
              {[teacher?.subject, teacher?.whatsapp_number || teacher?.phone]
                .filter(Boolean)
                .join(" • ")}
            </Text>
          </Box>
          <HStack wrap="wrap">
            <Button leftIcon={<MdAdd />} colorScheme="blue" onClick={() => openCreate(cursor)}>
              إضافة مهمة
            </Button>
            <Button leftIcon={<MdRefresh />} onClick={load} isLoading={loading}>
              تحديث
            </Button>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
          <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={4}>
            <Text fontSize="sm" color={muted}>مهام اليوم</Text>
            <Heading size="md">{todayTasks.length}</Heading>
          </Box>
          <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={4}>
            <Text fontSize="sm" color={muted}>قادمة في النطاق</Text>
            <Heading size="md">{upcoming.length}</Heading>
          </Box>
          <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={4}>
            <Text fontSize="sm" color={muted}>منتهية في النطاق</Text>
            <Heading size="md">{past.length}</Heading>
          </Box>
        </SimpleGrid>

        <Flex
          bg={cardBg}
          borderWidth="1px"
          borderColor={border}
          borderRadius="xl"
          p={3}
          mb={4}
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={3}
        >
          <HStack>
            <IconButton aria-label="السابق" icon={<MdChevronRight />} onClick={() => shift(-1)} />
            <IconButton aria-label="التالي" icon={<MdChevronLeft />} onClick={() => shift(1)} />
            <Button size="sm" variant="outline" onClick={() => setCursor(today)}>
              اليوم
            </Button>
            <Text fontWeight="bold">{titleLabel}</Text>
          </HStack>
          <HStack>
            {["day", "week", "month"].map((v) => (
              <Button
                key={v}
                size="sm"
                colorScheme={view === v ? "blue" : "gray"}
                variant={view === v ? "solid" : "outline"}
                onClick={() => setView(v)}
              >
                {v === "day" ? "يومي" : v === "week" ? "أسبوعي" : "شهري"}
              </Button>
            ))}
          </HStack>
        </Flex>

        {loading ? (
          <Flex justify="center" py={16}>
            <Spinner size="lg" />
          </Flex>
        ) : (
          <SimpleGrid
            columns={view === "day" ? 1 : 7}
            spacing={2}
            bg={cardBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="xl"
            p={3}
          >
            {view !== "day" &&
              ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"].map(
                (label) => (
                  <Text key={label} fontSize="xs" color={muted} textAlign="center" fontWeight="bold">
                    {label}
                  </Text>
                ),
              )}
            {days.map((day, idx) => {
              if (!day) return <Box key={`empty-${idx}`} minH="90px" />;
              const list = byDate[day] || [];
              const isToday = day === today;
              return (
                <Box
                  key={day}
                  minH={view === "month" ? "110px" : "180px"}
                  borderWidth="1px"
                  borderColor={isToday ? "blue.400" : border}
                  borderRadius="lg"
                  p={2}
                  bg={isToday ? dayHover : "transparent"}
                  cursor="pointer"
                  onClick={() => openCreate(day)}
                  _hover={{ bg: dayHover }}
                >
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight={isToday ? "bold" : "medium"}>
                      {view === "month" ? day.slice(-2) : day}
                    </Text>
                    <Badge>{list.length}</Badge>
                  </Flex>
                  <Box maxH={view === "month" ? "70px" : "140px"} overflowY="auto">
                    {list.map(renderTaskChip)}
                  </Box>
                </Box>
              );
            })}
          </SimpleGrid>
        )}

        {selectedTask && (
          <Box mt={4} bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={4}>
            <Flex justify="space-between" align="start" gap={3} wrap="wrap">
              <Box>
                <HStack mb={2}>
                  <Badge colorScheme={TASK_META[selectedTask.taskType || selectedTask.task_type]?.color}>
                    {TASK_META[selectedTask.taskType || selectedTask.task_type]?.icon}{" "}
                    {TASK_META[selectedTask.taskType || selectedTask.task_type]?.label}
                  </Badge>
                  <Text fontWeight="bold">{selectedTask.title}</Text>
                </HStack>
                <Text fontSize="sm" color={muted}>
                  التاريخ: {String(selectedTask.taskDate || selectedTask.task_date).slice(0, 10)}
                  {(selectedTask.startTime || selectedTask.start_time) &&
                    ` • ${timeShort(selectedTask.startTime || selectedTask.start_time)}`}
                  {(selectedTask.endTime || selectedTask.end_time) &&
                    ` - ${timeShort(selectedTask.endTime || selectedTask.end_time)}`}
                </Text>
                {(selectedTask.courseName || selectedTask.course_name) && (
                  <Text fontSize="sm">المادة/الكورس: {selectedTask.courseName || selectedTask.course_name}</Text>
                )}
                {(selectedTask.meetingUrl || selectedTask.meeting_url) && (
                  <Text fontSize="sm">الرابط: {selectedTask.meetingUrl || selectedTask.meeting_url}</Text>
                )}
                {selectedTask.notes && <Text fontSize="sm" mt={1}>{selectedTask.notes}</Text>}
              </Box>
              <HStack>
                <Button leftIcon={<MdEdit />} size="sm" onClick={() => openEdit(selectedTask)}>
                  تعديل
                </Button>
                <Button
                  leftIcon={<MdDelete />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => remove(selectedTask)}
                >
                  حذف
                </Button>
              </HStack>
            </Flex>
          </Box>
        )}
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>{editing ? "تعديل مهمة" : "إضافة مهمة"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <FormControl isRequired>
                <FormLabel>نوع المهمة</FormLabel>
                <Select
                  value={form.taskType}
                  onChange={(e) => setForm((f) => ({ ...f, taskType: e.target.value }))}
                >
                  {Object.entries(TASK_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.icon} {meta.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>العنوان</FormLabel>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>المادة / الكورس</FormLabel>
                <Input
                  value={form.courseName}
                  onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>التاريخ</FormLabel>
                <Input
                  type="date"
                  value={form.taskDate}
                  onChange={(e) => setForm((f) => ({ ...f, taskDate: e.target.value }))}
                />
              </FormControl>
              <HStack align="start">
                <FormControl>
                  <FormLabel>من</FormLabel>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>إلى</FormLabel>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </FormControl>
              </HStack>
              {form.taskType === "homework" && (
                <FormControl>
                  <FormLabel>موعد التسليم</FormLabel>
                  <Input
                    type="datetime-local"
                    value={form.dueAt}
                    onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
                  />
                </FormControl>
              )}
              {form.taskType === "live" && (
                <FormControl>
                  <FormLabel>رابط الحصة</FormLabel>
                  <Input
                    value={form.meetingUrl}
                    onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
                  />
                </FormControl>
              )}
              <FormControl>
                <FormLabel>ملاحظات</FormLabel>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" ml={2} onClick={onClose}>
              إلغاء
            </Button>
            <Button colorScheme="blue" onClick={save} isLoading={saving}>
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
