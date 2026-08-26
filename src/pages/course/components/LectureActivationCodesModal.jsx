import { useEffect, useState } from "react";
import {
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
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaBan, FaKey, FaPlus } from "react-icons/fa";
import {
  courseAccessApiError,
  createLectureActivationCode,
  deactivateLectureActivationCode,
  fetchLectureActivationCodes,
} from "../../../api/courseAccessApi";

const DURATION_PRESETS = [
  { label: "ساعة", value: 1 },
  { label: "ساعتان", value: 2 },
  { label: "6 ساعات", value: 6 },
  { label: "12 ساعة", value: 12 },
  { label: "24 ساعة", value: 24 },
];

export default function LectureActivationCodesModal({
  isOpen,
  onClose,
  lecture,
}) {
  const toast = useToast();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [customCode, setCustomCode] = useState("");
  const [durationHours, setDurationHours] = useState(2);
  const [maxUses, setMaxUses] = useState(0);

  const loadCodes = async () => {
    if (!lecture?.id) return;
    setLoading(true);
    try {
      const list = await fetchLectureActivationCodes(lecture.id);
      setCodes(list);
    } catch (err) {
      toast({
        title: "تعذّر تحميل الأكواد",
        description: courseAccessApiError(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && lecture?.id) {
      loadCodes();
      setCustomCode("");
      setDurationHours(2);
      setMaxUses(0);
    }
  }, [isOpen, lecture?.id]);

  const handleCreate = async () => {
    if (!lecture?.id) return;
    setSaving(true);
    try {
      const payload = {
        duration_hours: Number(durationHours) || 2,
        max_uses: Number(maxUses) || 0,
      };
      if (customCode.trim()) payload.code = customCode.trim();
      await createLectureActivationCode(lecture.id, payload);
      toast({ title: "تم إنشاء الكود", status: "success", duration: 3000, isClosable: true });
      setCustomCode("");
      await loadCodes();
    } catch (err) {
      toast({
        title: "تعذّر إنشاء الكود",
        description: courseAccessApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (codeId) => {
    if (!lecture?.id) return;
    setDeactivatingId(codeId);
    try {
      await deactivateLectureActivationCode(lecture.id, codeId);
      toast({ title: "تم إلغاء الكود", status: "success", duration: 3000, isClosable: true });
      await loadCodes();
    } catch (err) {
      toast({
        title: "تعذّر إلغاء الكود",
        description: courseAccessApiError(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "xl" }} scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius={{ base: "none", md: "2xl" }} mx={{ base: 0, md: 4 }}>
        <ModalHeader>
          <HStack spacing={2}>
            <FaKey />
            <Text>أكواد تفعيل — {lecture?.title || "المحاضرة"}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
              <Text fontWeight="semibold" mb={3} fontSize="sm">
                إنشاء كود جديد
              </Text>
              <VStack align="stretch" spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">كود مخصص (اختياري)</FormLabel>
                  <Input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="يُولَّد تلقائياً إن تُرك فارغاً"
                    dir="ltr"
                    textAlign="left"
                  />
                </FormControl>
                <HStack spacing={3} align="flex-end" flexWrap="wrap">
                  <FormControl flex={1} minW="140px">
                    <FormLabel fontSize="sm">المدة (ساعات)</FormLabel>
                    <Select
                      value={String(durationHours)}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                    >
                      {DURATION_PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl flex={1} minW="120px">
                    <FormLabel fontSize="sm">حد الاستخدام</FormLabel>
                    <NumberInput min={0} value={maxUses} onChange={(_, v) => setMaxUses(v || 0)}>
                      <NumberInputField />
                    </NumberInput>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      0 = غير محدود
                    </Text>
                  </FormControl>
                </HStack>
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="purple"
                  borderRadius="xl"
                  onClick={handleCreate}
                  isLoading={saving}
                  alignSelf="flex-start"
                >
                  إنشاء كود
                </Button>
              </VStack>
            </Box>

            {loading ? (
              <Spinner alignSelf="center" color="purple.500" />
            ) : codes.length === 0 ? (
              <Text textAlign="center" color="gray.500" py={4} fontSize="sm">
                لا توجد أكواد بعد
              </Text>
            ) : (
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>الكود</Th>
                      <Th>المدة</Th>
                      <Th>الاستخدام</Th>
                      <Th>الحالة</Th>
                      <Th />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {codes.map((code) => (
                      <Tr key={code.id}>
                        <Td fontFamily="mono" fontWeight="bold">
                          {code.code}
                        </Td>
                        <Td>{code.duration_hours} س</Td>
                        <Td>
                          {code.use_count ?? 0}
                          {code.max_uses ? ` / ${code.max_uses}` : " / ∞"}
                        </Td>
                        <Td>
                          <Badge colorScheme={code.is_active !== false ? "green" : "gray"}>
                            {code.is_active !== false ? "نشط" : "ملغى"}
                          </Badge>
                        </Td>
                        <Td>
                          {code.is_active !== false ? (
                            <IconButton
                              aria-label="إلغاء الكود"
                              icon={<FaBan />}
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              isLoading={deactivatingId === code.id}
                              onClick={() => handleDeactivate(code.id)}
                            />
                          ) : null}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
