import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
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
  VStack,
  useToast,
} from "@chakra-ui/react";
import { resolveTenantSubdomain } from "../../utils/tenantHost";
import baseUrl from "../../api/baseUrl";
import { courseGroupsApiError } from "../../api/courseGroupsApi";
import {
  useMyCourseGroupMembership,
  usePublicCourseGroups,
  usePublicRegistrationSettings,
  useSetMyCourseGroupMembership,
} from "../../Hooks/course/useCourseGroups";

/**
 * يطلب من الطالب اختيار مجموعة عند تفعيل النظام وعدم وجود عضوية.
 */
export default function StudentCourseGroupGate({ student }) {
  const toast = useToast();
  const subdomain = resolveTenantSubdomain();
  const [gradeId, setGradeId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    if (!subdomain || !student) return;
    (async () => {
      try {
        const res = await baseUrl.get(
          `/api/tenants/public/${encodeURIComponent(subdomain)}/grades`,
        );
        const list = res?.data?.data?.grades ?? res?.data?.grades ?? [];
        setGrades(Array.isArray(list) ? list : []);
      } catch {
        try {
          const fallback = await baseUrl.get("/api/users/grades");
          setGrades(Array.isArray(fallback?.data?.grades) ? fallback.data.grades : []);
        } catch {
          setGrades([]);
        }
      }
    })();
  }, [subdomain, student]);

  const { data: regSettings } = usePublicRegistrationSettings(subdomain, {
    enabled: Boolean(student) && Boolean(subdomain),
  });

  const needsSelection =
    Boolean(regSettings?.course_group_access_enabled) &&
    Boolean(regSettings?.requires_course_group_selection);

  const {
    data: membership,
    isLoading: membershipLoading,
    isError: membershipError,
  } = useMyCourseGroupMembership({
    enabled: Boolean(student) && needsSelection,
  });

  const { data: publicGroups, isLoading: groupsLoading } = usePublicCourseGroups(
    subdomain,
    gradeId,
    { enabled: Boolean(gradeId) && needsSelection },
  );

  const setMembership = useSetMyCourseGroupMembership();

  const hasMembership = Boolean(
    membership?.course_group_id || membership?.group_id || membership?.id,
  );

  const showModal =
    Boolean(student) &&
    needsSelection &&
    !membershipLoading &&
    (membershipError || !hasMembership);

  useEffect(() => {
    if (!gradeId && grades.length === 1) {
      setGradeId(String(grades[0].id));
    }
  }, [grades, gradeId]);

  useEffect(() => {
    setGroupId("");
  }, [gradeId]);

  const handleSave = async () => {
    if (!groupId || !gradeId) {
      toast({ title: "اختر الصف والمجموعة", status: "warning", duration: 3000 });
      return;
    }
    try {
      await setMembership.mutateAsync({
        course_group_id: Number(groupId),
        grade_id: Number(gradeId),
      });
      toast({ title: "تم اختيار مجموعتك بنجاح", status: "success", duration: 3000 });
    } catch (err) {
      toast({
        title: "تعذّر حفظ المجموعة",
        description: courseGroupsApiError(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  if (!showModal) {
    if (membershipLoading && needsSelection && student) {
      return null;
    }
    return null;
  }

  const groups = publicGroups?.groups ?? [];

  return (
    <Modal isOpen onClose={() => undefined} closeOnOverlayClick={false} isCentered size="md">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent dir="rtl" mx={4}>
        <ModalHeader>اختر مجموعتك الدراسية</ModalHeader>
        <ModalBody>
          <Text fontSize="sm" color="gray.500" mb={4}>
            المدرس فعّل نظام المجموعات — اختر مجموعتك لعرض المحاضرات المخصصة لك
          </Text>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>الصف الدراسي</FormLabel>
              <Select
                placeholder="اختر الصف"
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired isDisabled={!gradeId}>
              <FormLabel>المجموعة</FormLabel>
              {groupsLoading ? (
                <Box py={4} textAlign="center">
                  <Spinner size="sm" color="blue.500" />
                </Box>
              ) : (
                <Select
                  placeholder={groups.length ? "اختر المجموعة" : "لا توجد مجموعات لهذا الصف"}
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            width="full"
            onClick={handleSave}
            isLoading={setMembership.isPending}
            isDisabled={!groupId}
          >
            تأكيد المجموعة
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
