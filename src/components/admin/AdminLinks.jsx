import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Box,
  Flex,
  Icon,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  MdDashboard,
  MdPersonAdd,
  MdCode,
  MdAccountBalanceWallet,
  MdPhoneIphone,
  MdBook,
  MdPeople,
  MdCloudUpload,
  MdSchool,
  MdSupportAgent,
  MdGroups,
  MdBadge,
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import UserType from "../../Hooks/auth/userType";

const ADMIN_SECTIONS = [
  {
    title: "المنصة",
    items: [
      { label: "إدارة المدرسين", path: "/admin/management", icon: MdDashboard },
      { label: "جداول المدرسين", path: "/admin/teacher-schedules", icon: MdSchool },
      { label: "إضافة مدرس", path: "/admin/addteacher", icon: MdPersonAdd },
      { label: "الصفوف الدراسية", path: "/admin/grades", icon: MdSchool },
      { label: "كل الطلاب", path: "/admin/students", icon: MdPeople },
      { label: "الكورسات العامة", path: "/admin/general-courses", icon: MdBook },
      { label: "رفع YouTube", path: "/admin/youtube-uploads", icon: MdCloudUpload },
    ],
  },
  {
    title: "الفريق",
    items: [
      { label: "إضافة موظف", path: "/admin/add_employees", icon: MdBadge },
      { label: "إدارة الموظفين", path: "/admin/mange_employees", icon: MdGroups },
    ],
  },
  {
    title: "التواصل",
    items: [
      { label: "واتساب", path: "/admin/whatsapp/inbox", icon: FaWhatsapp },
      { label: "وكيل المبيعات", path: "/admin/whatsapp/sales-agent", icon: FaWhatsapp },
      { label: "أولياء الأمور", path: "/admin/whatsapp/parents-exam", icon: FaWhatsapp },
      { label: "إدارة المدرسين واتساب", path: "/admin/whatsapp/teachers-management", icon: FaWhatsapp },
      { label: "تخصيص الدعم", path: "/admin/whatsapp/policy", icon: MdSupportAgent },
    ],
  },
  {
    title: "المالية والأجهزة",
    items: [
      { label: "إنشاء أكواد شحن", path: "/admin/create_code", icon: MdCode },
      { label: "أرصدة المدرسين", path: "/admin/cridet", icon: MdAccountBalanceWallet },
      { label: "فتح جهاز للطالب", path: "/admin/open_phone", icon: MdPhoneIphone },
    ],
  },
];

function NavItem({ item, active }) {
  const idleBg = useColorModeValue("transparent", "transparent");
  const hoverBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const activeBg = useColorModeValue("blue.500", "blue.400");
  const idleColor = useColorModeValue("gray.700", "gray.200");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconIdleBg = useColorModeValue("gray.100", "whiteAlpha.100");

  return (
    <NavLink to={item.path} style={{ textDecoration: "none", width: "100%" }}>
      <Flex
        align="center"
        gap={3}
        px={3}
        py={2.5}
        borderRadius="xl"
        bg={active ? activeBg : idleBg}
        color={active ? "white" : idleColor}
        fontWeight={active ? "700" : "600"}
        transition="all 0.15s ease"
        _hover={{
          bg: active ? activeBg : hoverBg,
          transform: "translateX(-2px)",
        }}
      >
        <Flex
          w="34px"
          h="34px"
          align="center"
          justify="center"
          borderRadius="lg"
          bg={active ? "whiteAlpha.200" : iconIdleBg}
          flexShrink={0}
        >
          <Icon
            as={item.icon}
            boxSize={4}
            color={active ? "white" : muted}
          />
        </Flex>
        <Text fontSize="sm" noOfLines={1} lineHeight="1.4">
          {item.label}
        </Text>
      </Flex>
    </NavLink>
  );
}

/**
 * قائمة أدمن نظيفة — مجموعات + عناصر بدون تداخل CSS القديم.
 * props القديمة (currentLink/setCurrentLink) اختيارية للتوافق.
 */
const AdminLinks = () => {
  const location = useLocation();
  const [, isAdmin] = UserType();
  const sectionLabel = useColorModeValue("gray.400", "gray.500");
  const divider = useColorModeValue("blackAlpha.100", "whiteAlpha.200");

  const sections = useMemo(() => (isAdmin ? ADMIN_SECTIONS : []), [isAdmin]);

  if (!sections.length) return null;

  return (
    <Box
      className="admin-nav-modern"
      p={3}
      maxH={{ base: "none", lg: "calc(100vh - 160px)" }}
      overflowY="auto"
      css={{
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(49,130,206,0.35)",
          borderRadius: "999px",
        },
      }}
    >
      <VStack align="stretch" spacing={5}>
        {sections.map((section) => (
          <Box key={section.title}>
            <Text
              fontSize="11px"
              fontWeight="800"
              letterSpacing="0.08em"
              color={sectionLabel}
              mb={2}
              px={2}
            >
              {section.title}
            </Text>
            <VStack align="stretch" spacing={1}>
              {section.items.map((item) => {
                const active =
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);
                return <NavItem key={item.path} item={item} active={active} />;
              })}
            </VStack>
            <Box mt={4} borderBottomWidth="1px" borderColor={divider} />
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default AdminLinks;
