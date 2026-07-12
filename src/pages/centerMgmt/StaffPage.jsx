import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Badge,
  Button,
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
  Select,
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
import { FaPlus, FaTrash } from "react-icons/fa";
import { useStaff, useStaffMutations } from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { ROLE_LABELS, field } from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function StaffPage() {
  const { centerId } = useOutletContext();
  const toast = useToast();
  const { data: staff = [], isLoading } = useStaff(centerId);
  const { invite, remove } = useStaffMutations(centerId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userId, setUserId] = useState("");
  const [roleCode, setRoleCode] = useState("assistant");

  const handleInvite = async () => {
    if (!userId) {
      toast({ title: "معرّف المستخدم مطلوب", status: "warning", duration: 2000 });
      return;
    }
    try {
      await invite.mutateAsync({ userId: Number(userId), roleCode });
      toast({ title: "تمت إضافة الموظف", status: "success", duration: 2000 });
      setUserId("");
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`إزالة ${field(member, "user_name", "userName") || "الموظف"}؟`)) return;
    try {
      await remove.mutateAsync(member.id);
      toast({ title: "تم الحذف", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <>
      <PageHeader
        title="الموظفون"
        description="أضف مساعدين ومحاسبين ومدرسين بصلاحيات محددة داخل السنتر."
        actions={
          <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" onClick={onOpen}>
            إضافة موظف
          </Button>
        }
      />

      {isLoading ? (
        <LoadingBlock />
      ) : staff.length === 0 ? (
        <EmptyState
          title="لا يوجد موظفون"
          description="أنت المالك. أضف موظفاً بمعرّف مستخدم المنصة ودوره."
          action={
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onOpen}>
              إضافة موظف
            </Button>
          }
        />
      ) : (
        <Surface p={0} overflow="hidden">
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>الاسم</Th>
                  <Th>البريد / الهاتف</Th>
                  <Th>الدور</Th>
                  <Th>الحالة</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {staff.map((member) => {
                  const role = field(member, "role_code", "roleCode");
                  return (
                    <Tr key={member.id}>
                      <Td fontWeight="medium">
                        {field(member, "user_name", "userName") || `مستخدم #${field(member, "user_id", "userId")}`}
                      </Td>
                      <Td>
                        <Text fontSize="sm">{field(member, "user_email", "userEmail") || "—"}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {field(member, "user_phone", "userPhone") || ""}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue">
                          {field(member, "role_name_ar") || ROLE_LABELS[role] || role}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={member.is_active === false ? "gray" : "green"}>
                          {member.is_active === false ? "غير نشط" : "نشط"}
                        </Badge>
                      </Td>
                      <Td>
                        {role !== "owner" ? (
                          <IconButton
                            aria-label="حذف"
                            icon={<FaTrash />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleRemove(member)}
                          />
                        ) : null}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </Surface>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3}>
          <ModalHeader>إضافة موظف</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>معرّف المستخدم (userId)</FormLabel>
                <Input
                  type="number"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  borderRadius="xl"
                  placeholder="مثال: 55"
                />
              </FormControl>
              <FormControl>
                <FormLabel>الدور</FormLabel>
                <Select value={roleCode} onChange={(e) => setRoleCode(e.target.value)} borderRadius="xl">
                  {Object.entries(ROLE_LABELS)
                    .filter(([k]) => k !== "owner")
                    .map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                </Select>
              </FormControl>
              <Text fontSize="xs" color="gray.500">
                الأدوار: أدمن · مدرس · محاسب · مساعد — لكل دور صلاحيات مختلفة حسب الـ API.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose}>إلغاء</Button>
            <Button colorScheme="blue" onClick={handleInvite} isLoading={invite.isPending} borderRadius="xl">
              إضافة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
