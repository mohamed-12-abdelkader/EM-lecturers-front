import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Badge,
  Button,
  Flex,
  FormControl,
  FormLabel,
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
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import {
  useGrades,
  useGradeMutations,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { field } from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function GradesPage() {
  const { centerId } = useOutletContext();
  const toast = useToast();
  const { data: grades = [], isLoading } = useGrades(centerId);
  const { createGrade, updateGrade, deleteGrade } = useGradeMutations(centerId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSortOrder((grades?.length || 0) + 1);
    onOpen();
  };

  const openEdit = (grade) => {
    setEditing(grade);
    setName(field(grade, "name") || "");
    setSortOrder(Number(field(grade, "sort_order", "sortOrder")) || 0);
    onOpen();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "اسم الصف مطلوب", status: "warning", duration: 2000 });
      return;
    }
    try {
      const payload = { name: name.trim(), sortOrder: Number(sortOrder) || 0 };
      if (editing) {
        await updateGrade.mutateAsync({ gradeId: editing.id, payload });
        toast({ title: "تم تحديث الصف", status: "success", duration: 2000 });
      } else {
        await createGrade.mutateAsync(payload);
        toast({ title: "تم إضافة الصف", status: "success", duration: 2000 });
      }
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const handleDelete = async (grade) => {
    if (!window.confirm(`حذف الصف "${field(grade, "name")}"؟`)) return;
    try {
      await deleteGrade.mutateAsync(grade.id);
      toast({ title: "تم حذف الصف", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  if (isLoading) return <LoadingBlock />;

  return (
    <>
      <PageHeader
        title="الصفوف الدراسية"
        description="الصفوف الافتراضية تُنشأ تلقائياً مع السنتر، ويمكنك تعديلها أو إضافة صفوف جديدة."
        actions={
          <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" onClick={openCreate}>
            إضافة صف
          </Button>
        }
      />

      {grades.length === 0 ? (
        <EmptyState
          title="لا توجد صفوف"
          description="أضف صفاً دراسياً مثل أولى إعدادي أو ثالثة ثانوي."
          action={
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={openCreate}>
              إضافة صف
            </Button>
          }
        />
      ) : (
        <Surface p={0} overflow="hidden">
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>الترتيب</Th>
                  <Th>الاسم</Th>
                  <Th>الحالة</Th>
                  <Th>إجراءات</Th>
                </Tr>
              </Thead>
              <Tbody>
                {grades.map((grade) => (
                  <Tr key={grade.id}>
                    <Td>{field(grade, "sort_order", "sortOrder") ?? "—"}</Td>
                    <Td fontWeight="medium">{field(grade, "name")}</Td>
                    <Td>
                      <Badge colorScheme={grade.is_active === false ? "gray" : "green"}>
                        {grade.is_active === false ? "غير نشط" : "نشط"}
                      </Badge>
                    </Td>
                    <Td>
                      <Flex gap={1}>
                        <IconButton
                          aria-label="تعديل"
                          icon={<FaEdit />}
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(grade)}
                        />
                        <IconButton
                          aria-label="حذف"
                          icon={<FaTrash />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(grade)}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Surface>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3}>
          <ModalHeader>{editing ? "تعديل الصف" : "إضافة صف"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>اسم الصف</FormLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} borderRadius="xl" />
              </FormControl>
              <FormControl>
                <FormLabel>الترتيب</FormLabel>
                <NumberInput min={0} value={sortOrder} onChange={(_, n) => setSortOrder(Number.isNaN(n) ? 0 : n)}>
                  <NumberInputField borderRadius="xl" />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={createGrade.isPending || updateGrade.isPending}
              borderRadius="xl"
            >
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
