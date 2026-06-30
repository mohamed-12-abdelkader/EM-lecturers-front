import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Switch,
  Flex,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

const emptyForm = {
  name: "",
  grade_id: "",
  phone: "",
  parent_phone: "",
  group_id: "",
  password: "",
  use_phone_as_password: true,
  account_status: "active",
};

const StudentFormModal = ({
  isOpen,
  onClose,
  mode = "add",
  student,
  grades,
  groups,
  onSubmit,
  submitting,
  teacherRegistrationMode = false,
}) => {
  const [form, setForm] = useState(emptyForm);
  const border = useColorModeValue("gray.200", "gray.700");
  const infoBg = useColorModeValue("gray.50", "gray.900");
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && student) {
      setForm({
        name: student.name || "",
        grade_id: student.grade?.id ? String(student.grade.id) : "",
        phone: student.phone || "",
        parent_phone: student.parent_phone || "",
        group_id: student.group?.id ? String(student.group.id) : "",
        password: "",
        use_phone_as_password: true,
        account_status: student.account_status || "active",
      });
    } else {
      setForm(emptyForm);
    }
  }, [isOpen, isEdit, student]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      grade_id: form.grade_id ? Number(form.grade_id) : undefined,
      phone: form.phone.trim() || undefined,
      parent_phone: form.parent_phone.trim() || undefined,
      group_id: form.group_id ? Number(form.group_id) : isEdit ? null : undefined,
    };

    if (isEdit) {
      payload.account_status = form.account_status;
      if (form.group_id === "") payload.group_id = null;
    } else if (!teacherRegistrationMode) {
      payload.use_phone_as_password = form.use_phone_as_password;
      if (!form.use_phone_as_password && form.password.trim()) {
        payload.password = form.password.trim();
      }
    }

    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", sm: "lg" }} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius={{ base: "none", sm: "xl" }} dir="rtl" as="form" onSubmit={handleSubmit}>
        <ModalHeader fontSize="md">
          {isEdit ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {!isEdit && teacherRegistrationMode && (
              <Box p={3} bg={infoBg} borderRadius="lg" borderWidth="1px" borderColor={border}>
                <Text fontSize="sm" lineHeight="tall">
                  سيُنشأ رقم طالب تلقائياً. الدخول يتم برقم الطالب فقط دون كلمة مرور — شارك الرقم مع
                  ولي الأمر بعد الإنشاء.
                </Text>
              </Box>
            )}

            <FormControl isRequired>
              <FormLabel fontSize="sm">الاسم الثلاثي</FormLabel>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="أحمد محمد علي"
                borderRadius="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm">الصف الدراسي</FormLabel>
              <Select
                placeholder="اختر الصف"
                value={form.grade_id}
                onChange={(e) => set("grade_id", e.target.value)}
                borderRadius="lg"
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">هاتف الطالب</FormLabel>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="01012345678"
                dir="ltr"
                textAlign="right"
                borderRadius="lg"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">هاتف ولي الأمر</FormLabel>
              <Input
                value={form.parent_phone}
                onChange={(e) => set("parent_phone", e.target.value)}
                placeholder="01198765432"
                dir="ltr"
                textAlign="right"
                borderRadius="lg"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                يُستخدم لإرسال بيانات الدخول عبر واتساب
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">مجموعة السنتر</FormLabel>
              <Select
                placeholder="بدون مجموعة"
                value={form.group_id}
                onChange={(e) => set("group_id", e.target.value)}
                borderRadius="lg"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {isEdit ? (
              <FormControl>
                <FormLabel fontSize="sm">حالة الحساب</FormLabel>
                <Select
                  value={form.account_status}
                  onChange={(e) => set("account_status", e.target.value)}
                  borderRadius="lg"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="suspended">موقوف</option>
                </Select>
              </FormControl>
            ) : (
              !teacherRegistrationMode && (
                <>
                  <Flex
                    justify="space-between"
                    align="center"
                    p={3}
                    borderWidth="1px"
                    borderColor={border}
                    borderRadius="lg"
                  >
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold">
                        استخدام رقم الهاتف ككلمة مرور
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        يتطلب إدخال هاتف الطالب
                      </Text>
                    </Box>
                    <Switch
                      colorScheme="blue"
                      isChecked={form.use_phone_as_password}
                      onChange={(e) => set("use_phone_as_password", e.target.checked)}
                    />
                  </Flex>

                  {!form.use_phone_as_password && (
                    <FormControl>
                      <FormLabel fontSize="sm">كلمة مرور مخصصة</FormLabel>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        borderRadius="lg"
                      />
                    </FormControl>
                  )}
                </>
              )
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button colorScheme="blue" type="submit" isLoading={submitting}>
            {isEdit ? "حفظ التعديلات" : "إضافة الطالب"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StudentFormModal;
