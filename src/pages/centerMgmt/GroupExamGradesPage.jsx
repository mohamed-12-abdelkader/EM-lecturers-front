import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaArrowRight, FaSave } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import {
  useGroup,
  useGroupExamMutations,
  useGroupExamSheet,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  field,
  formatDate,
  formatPercent,
  studentCode,
  studentName,
} from "./centerMgmtUtils";
import {
  DesktopOnly,
  EmptyState,
  FilterBar,
  KpiCard,
  ListCard,
  LoadingBlock,
  MobileOnly,
  PageHeader,
  PrimaryButton,
  StatusBadge,
  Surface,
} from "./components/UiBits";

function normalizeSheetRows(sheet) {
  const exam = sheet?.exam ?? sheet;
  const rows =
    sheet?.grades ??
    sheet?.students ??
    sheet?.rows ??
    sheet?.items ??
    [];
  return {
    exam,
    rows: Array.isArray(rows) ? rows : [],
  };
}

function rowToDraft(row) {
  const studentId = field(row, "student_id", "studentId", "id");
  const isAbsent = Boolean(field(row, "is_absent", "isAbsent"));
  const scoreVal = field(row, "score");
  return {
    student_id: studentId,
    student: row.student ?? row,
    score: scoreVal != null && scoreVal !== "" ? String(scoreVal) : "",
    is_absent: isAbsent,
    notes: field(row, "notes") || "",
    recorded: field(row, "recorded") !== false && (scoreVal != null || isAbsent),
  };
}

export default function GroupExamGradesPage() {
  const { groupId, examId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: group } = useGroup(groupId);
  const { data: sheet, isLoading, refetch } = useGroupExamSheet(groupId, examId);
  const { bulkGrades } = useGroupExamMutations();
  const [drafts, setDrafts] = useState([]);
  const [search, setSearch] = useState("");

  const { exam, rows } = useMemo(() => normalizeSheetRows(sheet), [sheet]);
  const totalGrade = Number(field(exam, "total_grade", "totalGrade") ?? 0);

  useEffect(() => {
    if (rows.length) {
      setDrafts(rows.map(rowToDraft));
    } else if (sheet && !rows.length) {
      setDrafts([]);
    }
  }, [rows, sheet]);

  const stats = useMemo(() => {
    let recorded = 0;
    let absent = 0;
    let pending = 0;
    for (const d of drafts) {
      if (d.is_absent) {
        absent += 1;
        recorded += 1;
      } else if (d.score !== "" && d.score != null) {
        recorded += 1;
      } else {
        pending += 1;
      }
    }
    return { recorded, absent, pending, total: drafts.length };
  }, [drafts]);

  const filteredDrafts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return drafts;
    return drafts.filter((d) => {
      const name = studentName(d.student).toLowerCase();
      const code = studentCode(d.student).toLowerCase();
      const phone = String(field(d.student, "phone") || "").toLowerCase();
      return name.includes(term) || code.includes(term) || phone.includes(term);
    });
  }, [drafts, search]);

  if (isLoading) return <LoadingBlock label="جاري تحميل كشف الدرجات..." />;

  if (!sheet) {
    return (
      <EmptyState
        title="الامتحان غير موجود"
        action={
          <PrimaryButton as={RouterLink} to={`/center-mgmt/groups/${groupId}`}>
            العودة للمجموعة
          </PrimaryButton>
        }
      />
    );
  }

  const examTitle = field(exam, "title") || "امتحان";
  const examDate = field(exam, "exam_date", "examDate");

  const updateDraft = (studentId, patch) => {
    setDrafts((prev) =>
      prev.map((d) => (d.student_id === studentId ? { ...d, ...patch } : d)),
    );
  };

  const buildPayload = () =>
    drafts.map((d) => {
      const entry = { student_id: Number(d.student_id) };
      if (d.is_absent) {
        entry.is_absent = true;
        if (d.notes.trim()) entry.notes = d.notes.trim();
        return entry;
      }
      if (d.score !== "" && d.score != null) {
        entry.score = Number(d.score);
      }
      if (d.notes.trim()) entry.notes = d.notes.trim();
      return entry;
    });

  const handleSave = async () => {
    for (const d of drafts) {
      if (!d.is_absent && d.score !== "" && d.score != null) {
        const score = Number(d.score);
        if (Number.isNaN(score) || score < 0) {
          toast({ title: "درجة غير صالحة", status: "warning", duration: 2500 });
          return;
        }
        if (totalGrade > 0 && score > totalGrade) {
          toast({
            title: "الدرجة أكبر من الدرجة الكلية",
            description: `الحد الأقصى ${totalGrade}`,
            status: "warning",
            duration: 3000,
          });
          return;
        }
      }
    }

    try {
      await bulkGrades.mutateAsync({
        groupId,
        examId,
        payload: { grades: buildPayload() },
      });
      toast({ title: "تم حفظ الدرجات", status: "success", duration: 2500 });
      refetch();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3500 });
    }
  };

  const renderRowMeta = (d) => {
    const name = studentName(d.student);
    const code = studentCode(d.student);
    const hasGrade = d.is_absent || (d.score !== "" && d.score != null);
    const pct =
      !d.is_absent && d.score !== "" && totalGrade > 0
        ? formatPercent(d.score, totalGrade)
        : d.is_absent
          ? "غائب"
          : "—";

    return { name, code, hasGrade, pct };
  };

  return (
    <Box>
      <PageHeader
        title={examTitle}
        description={`${field(group, "name") || "المجموعة"} · ${formatDate(examDate)} · من ${totalGrade || "—"}`}
        actions={
          <>
            <PrimaryButton
              leftIcon={<FaSave />}
              onClick={handleSave}
              isLoading={bulkGrades.isPending}
              size={{ base: "sm", md: "md" }}
            >
              حفظ الدرجات
            </PrimaryButton>
            <Button
              as={RouterLink}
              to={`/center-mgmt/groups/${groupId}`}
              leftIcon={<FaArrowRight />}
              variant="ghost"
              size="sm"
              borderRadius="xl"
            >
              المجموعة
            </Button>
          </>
        }
      />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
        <KpiCard label="إجمالي الطلاب" value={stats.total} color="blue" />
        <KpiCard label="تم الرصد" value={stats.recorded} color="green" />
        <KpiCard label="غائب" value={stats.absent} color="orange" />
        <KpiCard label="لم يُرصد" value={stats.pending} color="red" />
      </SimpleGrid>

      {drafts.length > 0 ? (
        <FilterBar>
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            justify="space-between"
            gap={3}
          >
            <InputGroup maxW={{ base: "full", md: "360px" }}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray" />
              </InputLeftElement>
              <Input
                placeholder="بحث بالاسم أو الكود أو الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                borderRadius="xl"
                bg="white"
                _dark={{ bg: "gray.800" }}
              />
            </InputGroup>
            <Text fontSize="sm" color="gray.500" flexShrink={0}>
              {search.trim()
                ? `${filteredDrafts.length} من ${drafts.length} طالب`
                : `${drafts.length} طالب`}
            </Text>
          </Flex>
        </FilterBar>
      ) : null}

      {drafts.length === 0 ? (
        <EmptyState
          title="لا يوجد طلاب في المجموعة"
          description="أضف طلاباً للمجموعة ثم ارجع لرصد الدرجات."
          action={
            <PrimaryButton onClick={() => navigate(`/center-mgmt/groups/${groupId}`)}>
              العودة للمجموعة
            </PrimaryButton>
          }
        />
      ) : filteredDrafts.length === 0 ? (
        <EmptyState
          title="لا توجد نتائج"
          description="جرّب اسمًا أو كودًا أو رقم هاتف مختلفًا."
          action={
            <Button variant="ghost" borderRadius="xl" onClick={() => setSearch("")}>
              مسح البحث
            </Button>
          }
        />
      ) : (
        <>
          <MobileOnly>
            <VStack spacing={3} align="stretch">
              {filteredDrafts.map((d) => {
                const { name, code, hasGrade, pct } = renderRowMeta(d);
                return (
                  <ListCard key={d.student_id}>
                    <Flex justify="space-between" align="flex-start" gap={2} mb={3}>
                      <Box minW={0}>
                        <Text fontWeight="black" noOfLines={1}>
                          {name}
                        </Text>
                        <Text fontSize="xs" fontFamily="mono" color="gray.500">
                          {code}
                        </Text>
                      </Box>
                      <StatusBadge scheme={hasGrade ? "green" : "gray"}>
                        {d.is_absent ? "غائب" : hasGrade ? pct : "لم يُرصد"}
                      </StatusBadge>
                    </Flex>
                    <VStack spacing={3} align="stretch">
                      <Checkbox
                        isChecked={d.is_absent}
                        onChange={(e) =>
                          updateDraft(d.student_id, {
                            is_absent: e.target.checked,
                            score: e.target.checked ? "" : d.score,
                          })
                        }
                        colorScheme="orange"
                      >
                        غائب عن الامتحان
                      </Checkbox>
                      {!d.is_absent ? (
                        <FormControl>
                          <FormLabel fontSize="xs">الدرجة (من {totalGrade || "—"})</FormLabel>
                          <NumberInput
                            min={0}
                            max={totalGrade || undefined}
                            value={d.score}
                            onChange={(_, n) =>
                              updateDraft(d.student_id, {
                                score: Number.isNaN(n) ? "" : String(n),
                              })
                            }
                          >
                            <NumberInputField borderRadius="xl" />
                          </NumberInput>
                        </FormControl>
                      ) : null}
                      <FormControl>
                        <FormLabel fontSize="xs">ملاحظات</FormLabel>
                        <Textarea
                          value={d.notes}
                          onChange={(e) =>
                            updateDraft(d.student_id, { notes: e.target.value })
                          }
                          rows={2}
                          borderRadius="xl"
                          fontSize="sm"
                        />
                      </FormControl>
                    </VStack>
                  </ListCard>
                );
              })}
            </VStack>
          </MobileOnly>

          <DesktopOnly>
            <Surface p={0} overflow="hidden">
              <TableContainer>
                <Table size="sm">
                  <Thead bg="gray.50" _dark={{ bg: "whiteAlpha.50" }}>
                    <Tr>
                      <Th>الطالب</Th>
                      <Th w="120px">الدرجة</Th>
                      <Th w="90px">النسبة</Th>
                      <Th w="100px">غائب</Th>
                      <Th>ملاحظات</Th>
                      <Th w="100px">الحالة</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredDrafts.map((d) => {
                      const { name, code, hasGrade, pct } = renderRowMeta(d);
                      return (
                        <Tr key={d.student_id}>
                          <Td>
                            <Text fontWeight="semibold">{name}</Text>
                            <Text fontSize="xs" fontFamily="mono" color="gray.500">
                              {code}
                            </Text>
                          </Td>
                          <Td>
                            <NumberInput
                              size="sm"
                              min={0}
                              max={totalGrade || undefined}
                              value={d.is_absent ? "" : d.score}
                              isDisabled={d.is_absent}
                              onChange={(_, n) =>
                                updateDraft(d.student_id, {
                                  score: Number.isNaN(n) ? "" : String(n),
                                })
                              }
                            >
                              <NumberInputField borderRadius="lg" />
                            </NumberInput>
                          </Td>
                          <Td fontWeight="bold" fontSize="sm">
                            {pct}
                          </Td>
                          <Td>
                            <Checkbox
                              isChecked={d.is_absent}
                              onChange={(e) =>
                                updateDraft(d.student_id, {
                                  is_absent: e.target.checked,
                                  score: e.target.checked ? "" : d.score,
                                })
                              }
                              colorScheme="orange"
                            />
                          </Td>
                          <Td>
                            <Input
                              size="sm"
                              value={d.notes}
                              onChange={(e) =>
                                updateDraft(d.student_id, { notes: e.target.value })
                              }
                              borderRadius="lg"
                              placeholder="اختياري"
                            />
                          </Td>
                          <Td>
                            <StatusBadge scheme={hasGrade ? "green" : "gray"}>
                              {d.recorded && !hasGrade
                                ? "مسجّل"
                                : hasGrade
                                  ? "مُرصد"
                                  : "معلق"}
                            </StatusBadge>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Surface>
          </DesktopOnly>
        </>
      )}

      {drafts.length > 0 ? (
        <Flex justify="center" mt={6}>
          <PrimaryButton
            leftIcon={<FaSave />}
            onClick={handleSave}
            isLoading={bulkGrades.isPending}
            size="lg"
            px={10}
          >
            حفظ جميع الدرجات
          </PrimaryButton>
        </Flex>
      ) : null}
    </Box>
  );
}
