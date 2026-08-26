import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Code,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  FaCopy,
  FaEdit,
  FaEllipsisV,
  FaKey,
  FaMobileAlt,
  FaShareAlt,
  FaTrash,
} from "react-icons/fa";
import { FiPhone, FiUsers } from "react-icons/fi";
import { formatStudentCode } from "../managedStudentsUtils";

const statusMeta = {
  active: { label: "نشط", color: "green", bg: "green.50", text: "green.700" },
  inactive: { label: "غير نشط", color: "gray", bg: "gray.100", text: "gray.600" },
  suspended: { label: "موقوف", color: "red", bg: "red.50", text: "red.700" },
};

export default function ManagedStudentCard({
  student,
  isCodeOnlyLogin,
  onCopyCode,
  onEdit,
  onShareLogin,
  onResetPassword,
  onResetDevice,
  onStatusChange,
  onDelete,
}) {
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.900", "white");
  const subColor = useColorModeValue("gray.500", "gray.400");
  const codeBg = useColorModeValue("blue.50", "blue.900");
  const hoverBorder = useColorModeValue("blue.200", "blue.700");

  const st = statusMeta[student.account_status] || statusMeta.inactive;
  const code = formatStudentCode(student.student_code);
  const deviceBound = Boolean(
    student.device_bound || student.registered_ip || student.device_ip,
  );

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="2xl"
      p={{ base: 4, md: 5 }}
      transition="border-color 0.2s, box-shadow 0.2s, transform 0.2s"
      _hover={{
        borderColor: hoverBorder,
        boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
        transform: "translateY(-1px)",
      }}
    >
      <Flex gap={4} align="start">
        <Avatar
          size="md"
          name={student.name}
          bg="blue.600"
          color="white"
          flexShrink={0}
        />

        <Box flex="1" minW={0}>
          <Flex justify="space-between" align="start" gap={3} mb={2}>
            <Box minW={0}>
              <HStack spacing={2} flexWrap="wrap" mb={1}>
                <Text fontWeight="800" fontSize="md" color={textColor} noOfLines={1}>
                  {student.name}
                </Text>
                <Badge
                  bg={st.bg}
                  color={st.text}
                  borderRadius="full"
                  px={2.5}
                  py={0.5}
                  fontSize="10px"
                  fontWeight="700"
                  _dark={{ bg: `${st.color}.900`, color: `${st.color}.200` }}
                >
                  {st.label}
                </Badge>
                {!isCodeOnlyLogin && student.must_change_password ? (
                  <Badge colorScheme="orange" variant="subtle" borderRadius="full" fontSize="10px">
                    غيّر كلمة المرور
                  </Badge>
                ) : null}
              </HStack>

              <HStack spacing={2} flexWrap="wrap">
                <HStack
                  spacing={1.5}
                  bg={codeBg}
                  px={2.5}
                  py={1}
                  borderRadius="lg"
                  dir="ltr"
                >
                  <Code bg="transparent" fontSize="sm" fontWeight="800" color="blue.700" _dark={{ color: "blue.200" }}>
                    {code || "—"}
                  </Code>
                  <Tooltip label="نسخ رقم الطالب">
                    <IconButton
                      aria-label="نسخ رقم الطالب"
                      icon={<FaCopy />}
                      size="xs"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={() => onCopyCode(code)}
                    />
                  </Tooltip>
                </HStack>
                <Badge
                  variant="subtle"
                  colorScheme={deviceBound ? "blue" : "gray"}
                  borderRadius="full"
                  fontSize="10px"
                >
                  {deviceBound ? "جهاز مربوط" : "بدون جهاز"}
                </Badge>
              </HStack>
            </Box>

            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaEllipsisV />}
                variant="ghost"
                size="sm"
                aria-label="إجراءات"
                borderRadius="lg"
              />
              <MenuList fontSize="sm" borderRadius="xl">
                <MenuItem icon={<FaEdit />} onClick={() => onEdit(student)}>
                  تعديل
                </MenuItem>
                {isCodeOnlyLogin ? (
                  <MenuItem icon={<FaShareAlt />} onClick={() => onShareLogin(student)}>
                    مشاركة بيانات الدخول
                  </MenuItem>
                ) : null}
                <MenuItem icon={<FaKey />} onClick={() => onResetPassword(student)}>
                  تغيير كلمة المرور
                </MenuItem>
                <MenuItem icon={<FaMobileAlt />} onClick={() => onResetDevice(student)}>
                  إعادة تعيين الجهاز
                </MenuItem>
                {student.account_status !== "active" && (
                  <MenuItem onClick={() => onStatusChange(student, "active")}>تفعيل الحساب</MenuItem>
                )}
                {student.account_status !== "inactive" && (
                  <MenuItem onClick={() => onStatusChange(student, "inactive")}>تعطيل الحساب</MenuItem>
                )}
                {student.account_status !== "suspended" && (
                  <MenuItem onClick={() => onStatusChange(student, "suspended")}>إيقاف الحساب</MenuItem>
                )}
                <MenuItem icon={<FaTrash />} color="red.500" onClick={() => onDelete(student)}>
                  حذف
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>

          <SimpleMeta
            grade={student.grade?.name}
            group={student.group?.name}
            phone={student.phone}
            parentPhone={student.parent_phone}
            textColor={textColor}
            subColor={subColor}
          />

          <HStack mt={4} spacing={2} flexWrap="wrap">
            <Button
              size="sm"
              colorScheme="blue"
              variant="solid"
              leftIcon={<Icon as={FaEdit} />}
              borderRadius="lg"
              onClick={() => onEdit(student)}
            >
              تعديل
            </Button>
            {isCodeOnlyLogin ? (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Icon as={FaShareAlt} />}
                borderRadius="lg"
                onClick={() => onShareLogin(student)}
              >
                مشاركة الدخول
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Icon as={FaKey} />}
              borderRadius="lg"
              onClick={() => onResetPassword(student)}
            >
              كلمة المرور
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Icon as={FaCopy} />}
              borderRadius="lg"
              onClick={() => onCopyCode(code)}
            >
              نسخ الرقم
            </Button>
          </HStack>
        </Box>
      </Flex>
    </Box>
  );
}

function SimpleMeta({ grade, group, phone, parentPhone, textColor, subColor }) {
  return (
    <VStack align="stretch" spacing={1.5} mt={3}>
      <HStack spacing={2} color={subColor} fontSize="xs">
        <Icon as={FiUsers} />
        <Text color={textColor} fontWeight="600" noOfLines={1}>
          {grade || "بدون صف"}
        </Text>
        <Text>·</Text>
        <Text noOfLines={1}>{group || "بدون مجموعة"}</Text>
      </HStack>
      <HStack spacing={2} color={subColor} fontSize="xs" flexWrap="wrap">
        <Icon as={FiPhone} />
        <Text dir="ltr">{phone || "—"}</Text>
        <Text>·</Text>
        <Text>ولي الأمر:</Text>
        <Text dir="ltr">{parentPhone || "—"}</Text>
      </HStack>
    </VStack>
  );
}
