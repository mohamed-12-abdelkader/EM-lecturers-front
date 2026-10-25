import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
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
  Skeleton,
  Text,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaTrash, FaUserPlus } from "react-icons/fa";
import {
  fetchExamLateAccess,
  grantExamLateAccess,
  revokeExamLateAccess,
} from "../../../api/courseExamsApi";
import {
  fetchPublicExamLateAccess,
  grantPublicExamLateAccess,
  publicExamsApiError,
  revokePublicExamLateAccess,
} from "../../../api/publicExamsApi";
import { normalizeStudentCodeInput } from "../../../utils/courseLevelExamUtils";

/**
 * منح محاولة إضافية لطالب واحد على امتحان شامل / عام.
 * scope: "course" → /api/exams | "public" → /api/public-exams
 */
export default function LateAccessGrantModal({
  isOpen,
  onClose,
  examId,
  examTitle,
  scope = "course",
  students = [],
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [grants, setGrants] = useState([]);
  const [studentCode, setStudentCode] = useState("");
  const [extraAttempts, setExtraAttempts] = useState(1);
  const [note, setNote] = useState("");
  const codeInputRef = useRef(null);
  const loadRef = useRef(null);

  const api = useMemo(() => {
    if (scope === "public") {
      return {
        list: fetchPublicExamLateAccess,
        grant: grantPublicExamLateAccess,
        revoke: revokePublicExamLateAccess,
      };
    }
    return {
      list: fetchExamLateAccess,
      grant: grantExamLateAccess,
      revoke: revokeExamLateAccess,
    };
  }, [scope]);

  const load = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const list = await api.list(examId, token);
      setGrants(list);
    } catch (err) {
      setGrants([]);
      toast({
        title: publicExamsApiError(err, "فشل تحميل السماح"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [api, examId, toast]);

  loadRef.current = load;

  useEffect(() => {
    if (!isOpen) return;
    setStudentCode("");
    setExtraAttempts(1);
    setNote("");
    loadRef.current?.();
  }, [isOpen, examId, scope]);

  const uniqueStudents = useMemo(() => {
    const map = new Map();
    (students || []).forEach((row) => {
      const code = normalizeStudentCodeInput(
        row.studentCode ?? row.student_code ?? row.phone ?? row.studentPhone ?? "",
      );
      const idCode = normalizeStudentCodeInput(row.studentId ?? row.student_id ?? "");
      const value = code || idCode;
      if (!value) return;
      if (!map.has(value)) {
        map.set(value, {
          code: value,
          name: row.studentName || row.student_name || row.name || `طالب ${value}`,
        });
      }
    });
    return Array.from(map.values());
  }, [students]);

  const applyStudentCode = (value) => {
    setStudentCode(normalizeStudentCodeInput(value));
  };

  const submit = async () => {
    const code = normalizeStudentCodeInput(codeInputRef.current?.value ?? studentCode);
    if (!code) {
      toast({ title: "اكتب كود الطالب", status: "warning", isClosable: true });
      return;
    }
    if (code !== studentCode) setStudentCode(code);
    const extra = Number(extraAttempts);
    if (!Number.isInteger(extra) || extra < 1 || extra > 10) {
      toast({
        title: "عدد المحاولات بين 1 و 10",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const result = await api.grant(
        examId,
        { studentCode: code, extraAttempts: extra, note },
        token,
      );
      toast({ title: result.message, status: "success", isClosable: true });
      setStudentCode("");
      setNote("");
      await load();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل منح المحاولة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (code) => {
    const studentCodeValue = normalizeStudentCodeInput(code);
    if (!studentCodeValue) {
      toast({ title: "كود الطالب غير متاح للإلغاء", status: "warning", isClosable: true });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await api.revoke(examId, studentCodeValue, token);
      toast({ title: "تم إلغاء السماح", status: "success", isClosable: true });
      await load();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل إلغاء السماح"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" mx={3} dir="rtl">
        <ModalHeader>محاولة إضافية لطالب</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status="info" borderRadius="xl">
              <AlertIcon />
              <Text fontSize="sm" lineHeight="1.8">
                السماح يخص هذا الطالب فقط
                {examTitle ? ` في «${examTitle}»` : ""}. يُخصم عند بدء المحاولة
                الجديدة، ومدتها هي مدة الامتحان كاملة من لحظة البدء — حتى لو انتهى
                وقت الامتحان أو كان امتحنه قبل كده.
              </Text>
            </Alert>

            {uniqueStudents.length > 0 ? (
              <FormControl>
                <FormLabel>اختر طالبًا</FormLabel>
                <Select
                  borderRadius="xl"
                  placeholder="من القائمة"
                  value={
                    uniqueStudents.some((s) => s.code === studentCode) ? studentCode : ""
                  }
                  onChange={(e) => applyStudentCode(e.target.value)}
                >
                  {uniqueStudents.map((student) => (
                    <option key={student.code} value={student.code}>
                      {student.name} — {student.code}
                    </option>
                  ))}
                </Select>
              </FormControl>
            ) : null}

            <FormControl isRequired>
              <FormLabel>كود الطالب</FormLabel>
              <Input
                ref={codeInputRef}
                value={studentCode}
                onChange={(e) => applyStudentCode(e.target.value)}
                borderRadius="xl"
                dir="ltr"
                placeholder="كود الطالب أو رقم الموبايل"
                inputMode="numeric"
              />
            </FormControl>

            <FormControl>
              <FormLabel>عدد المحاولات الإضافية (1–10)</FormLabel>
              <Input
                type="number"
                min={1}
                max={10}
                value={extraAttempts}
                onChange={(e) => setExtraAttempts(e.target.value)}
                borderRadius="xl"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                لو منحته قبل كده، العدد ده يتضاف على المتبقي.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>ملاحظة (اختياري)</FormLabel>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                borderRadius="xl"
                rows={2}
                maxLength={500}
                placeholder="غاب عن الامتحان"
              />
            </FormControl>

            <Box>
              <Text fontWeight="800" mb={2}>
                السماح الحالي
              </Text>
              {loading ? (
                <Skeleton h="64px" borderRadius="xl" />
              ) : grants.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  لا يوجد سماح مفتوح الآن.
                </Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  {grants.map((grant) => (
                    <HStack
                      key={`${grant.studentCode || grant.studentId}-${grant.id}`}
                      justify="space-between"
                      p={3}
                      borderWidth="1px"
                      borderRadius="xl"
                    >
                      <Box minW={0}>
                        <Text fontWeight="700" noOfLines={1}>
                          {grant.studentName}{" "}
                          <Text as="span" fontSize="xs" color="gray.500" dir="ltr">
                            {grant.studentCode || "بدون كود"}
                          </Text>
                        </Text>
                        <HStack spacing={2} mt={1}>
                          <Badge colorScheme="orange" borderRadius="md">
                            متبقي {grant.remainingAttempts}
                          </Badge>
                          {grant.note ? (
                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                              {grant.note}
                            </Text>
                          ) : null}
                        </HStack>
                      </Box>
                      <IconButton
                        aria-label="إلغاء السماح"
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        isDisabled={saving || !grant.studentCode}
                        onClick={() => revoke(grant.studentCode)}
                      />
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={2} onClick={onClose} isDisabled={saving}>
            إغلاق
          </Button>
          <Button
            colorScheme="orange"
            borderRadius="xl"
            leftIcon={<FaUserPlus />}
            onClick={submit}
            isLoading={saving}
          >
            منح المحاولة
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
