import React from "react";
import {
  MdDashboard,
  MdAccountBalanceWallet,
  MdLibraryBooks,
  MdForum,
  MdAssignment,
  MdGrading,
  MdPerson,
  MdPeople,
  MdManageAccounts,
  MdQuestionAnswer,
  MdVideoLibrary,
  MdQuiz,
  MdWhatshot,
  MdLogout,
  MdHome,
  MdPublic,
  MdCollectionsBookmark,
  MdDescription,
  MdBusiness,
  MdGroups,
  MdRestoreFromTrash,
  MdEmojiEvents,
} from "react-icons/md";
import { FaRobot, FaFolderOpen, FaWhatsapp } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import {
  VStack,
  Text,
  Icon,
  Box,
  Button,
  Tooltip,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";
import UserType from "../../Hooks/auth/userType";
import { performLogout } from "../../utils/performLogout";

const BRAND_BLUE = "#3182CE";
const BRAND_ORANGE = "#DD6B20";

const NavLinkItem = ({ to, Icon: LinkIcon, label, onClick, isSidebarOpen }) => {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== "/home" && location.pathname.startsWith(`${to}/`));

  const idleBg = useColorModeValue("transparent", "transparent");
  const activeBg = useColorModeValue("white", "whiteAlpha.100");
  const hoverBg = useColorModeValue("white", "whiteAlpha.50");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const activeColor = useColorModeValue("gray.900", "white");
  const iconIdleBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const iconIdleColor = useColorModeValue(BRAND_BLUE, "blue.300");

  const content = (
    <Flex
      align="center"
      gap={3}
      px={isSidebarOpen ? 2.5 : 2}
      py={2}
      borderRadius="2xl"
      bg={isActive ? activeBg : idleBg}
      color={isActive ? activeColor : textColor}
      boxShadow={isActive ? "0 8px 20px rgba(15,23,42,0.06)" : "none"}
      borderWidth="1px"
      borderColor={isActive ? "blackAlpha.50" : "transparent"}
      position="relative"
      overflow="hidden"
      _hover={{
        bg: isActive ? activeBg : hoverBg,
        color: activeColor,
        boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
      }}
      transition="all 0.18s ease"
      w="full"
      minH="46px"
      justify={isSidebarOpen ? "flex-start" : "center"}
      cursor="pointer"
      role="group"
      _dark={{
        borderColor: isActive ? "whiteAlpha.200" : "transparent",
        boxShadow: isActive ? "0 8px 20px rgba(0,0,0,0.25)" : "none",
      }}
    >
      {isActive && isSidebarOpen ? (
        <Box
          position="absolute"
          right={0}
          top="20%"
          bottom="20%"
          w="3px"
          borderRadius="full"
          bg={BRAND_BLUE}
        />
      ) : null}

      <Flex
        w={9}
        h={9}
        flexShrink={0}
        align="center"
        justify="center"
        borderRadius="xl"
        bg={isActive ? BRAND_BLUE : iconIdleBg}
        color={isActive ? "white" : iconIdleColor}
        transition="all 0.18s ease"
        boxShadow={isActive ? "0 8px 16px rgba(49,130,206,0.35)" : "none"}
        _groupHover={{
          transform: isSidebarOpen ? "translateY(-1px)" : "none",
        }}
      >
        <Icon as={LinkIcon} boxSize="17px" />
      </Flex>

      {isSidebarOpen ? (
        <Text
          flex={1}
          fontSize="sm"
          fontWeight={isActive ? "extrabold" : "semibold"}
          noOfLines={1}
        >
          {label}
        </Text>
      ) : null}
    </Flex>
  );

  return (
    <Tooltip label={isSidebarOpen ? "" : label} placement="left" hasArrow openDelay={300}>
      <Link to={to} onClick={onClick} style={{ width: "100%", textDecoration: "none" }}>
        {content}
      </Link>
    </Tooltip>
  );
};

function NavSection({ title, children, isSidebarOpen }) {
  const sectionColor = useColorModeValue("gray.400", "gray.500");
  const divider = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  return (
    <Box w="full">
      {isSidebarOpen && title ? (
        <Flex align="center" gap={2} px={3} pt={3.5} pb={1.5}>
          <Box w="6px" h="6px" borderRadius="full" bg={BRAND_ORANGE} flexShrink={0} />
          <Text
            fontSize="10px"
            fontWeight="extrabold"
            letterSpacing="0.08em"
            color={sectionColor}
          >
            {title}
          </Text>
        </Flex>
      ) : isSidebarOpen ? null : (
        <Box h="1px" bg={divider} my={2} mx={2} />
      )}
      <VStack spacing={1} align="stretch" w="full">
        {children}
      </VStack>
    </Box>
  );
}

const Links = ({ isSidebarOpen = true, setIsSidebarOpen, onClose }) => {
  const [, isAdmin, isTeacher, isStudent, isAcademy, isAcademyTeacher] = UserType();

  const handleNavClick = () => {
    setIsSidebarOpen?.(true);
    onClose?.();
  };

  const handleLogout = () => {
    onClose?.();
    void performLogout();
  };

  const logoutHover = useColorModeValue("red.50", "whiteAlpha.50");
  const logoutColor = useColorModeValue("red.600", "red.300");
  const logoutIconBg = useColorModeValue("red.50", "whiteAlpha.100");
  const logoutBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  const adminSections = [
    {
      title: "عام",
      links: [{ to: "/home", Icon: MdHome, label: "الصفحة الرئيسية" }],
    },
    {
      title: "الإدارة",
      links: [
        { to: "/admin/management", Icon: MdDashboard, label: "لوحة التحكم" },
        { to: "/admin/finance", Icon: MdAccountBalanceWallet, label: "الحسابات والمالية" },
        { to: "/admin/whatsapp/inbox", Icon: FaWhatsapp, label: "واتساب" },
        { to: "/admin/whatsapp/policy", Icon: FaWhatsapp, label: "تخصيص الدعم" },
        { to: "/teacher-points", Icon: MdEmojiEvents, label: "النقاط والترتيب" },
        { to: "/all_students", Icon: MdPeople, label: "كل الطلاب" },
        {
          to: "/question-bank-dashboard",
          Icon: MdLibraryBooks,
          label: "لوحة بنك الأسئلة",
        },
      ],
    },
  ];

  const teacherSections = [
    {
      title: "عام",
      links: [{ to: "/home", Icon: MdHome, label: "الصفحة الرئيسية" }],
    },
    {
      title: "المحتوى والأسئلة",
      links: [
        { to: "/QuestionLibraryPage", Icon: MdLibraryBooks, label: "مكتبة الأسئلة" },
        { to: "/Teacher_subjects", Icon: MdQuestionAnswer, label: "بنك الأسئلة" },
      ],
    },
    {
      title: "التواصل",
      links: [
        { to: "/TeacherChat", Icon: MdForum, label: "الرسائل" },
        { to: "/social", Icon: MdPublic, label: "EM Social" },
      ],
    },
    {
      title: "الأدوات والامتحانات",
      links: [
        { to: "/teacher-scientific-files", Icon: FaRobot, label: "المساعد العلمي" },
        { to: "/teacher-my-files", Icon: FaFolderOpen, label: "ملفاتي" },
        { to: "/teacher-assignments", Icon: MdAssignment, label: "الواجبات" },
        { to: "/teacher-exams", Icon: MdQuiz, label: "الامتحانات" },
        { to: "/teacher-daily-quizzes", Icon: MdWhatshot, label: "المسابقات اليومية" },
        { to: "/teacher-points", Icon: MdEmojiEvents, label: "النقاط والترتيب" },
        { to: "/exam-builder-chat", Icon: MdQuiz, label: "مساعد الامتحانات" },
        { to: "/teacher-free-lectures", Icon: MdVideoLibrary, label: "المحاضرات المجانية" },
        { to: "/teacher-whatsapp", Icon: FaWhatsapp, label: "واتساب المدرس" },
      ],
    },
    {
      title: "الطلاب والحساب",
      links: [
        { to: "/center-mgmt", Icon: MdBusiness, label: "إدارة السنتر" },
        { to: "/managed-students", Icon: MdManageAccounts, label: "إدارة الطلاب" },
        { to: "/teacher-course-groups", Icon: MdGroups, label: "مجموعات الكورس" },
        { to: "/platform-students", Icon: MdPeople, label: "كل الطلاب" },
        { to: "/teacher-students", Icon: MdPeople, label: "طلاب الكورسات" },
        { to: "/teacher-invoices", Icon: MdDescription, label: "فواتير الاشتراك" },
        { to: "/teacher-trash", Icon: MdRestoreFromTrash, label: "المحذوفات" },
      ],
    },
  ];

  const studentSections = [
    {
      title: "عام",
      links: [
        { to: "/home", Icon: MdHome, label: "الصفحة الرئيسية" },
        { to: "/profile", Icon: MdPerson, label: "الملف الشخصي" },
      ],
    },
    {
      title: "التعلم",
      links: [
        { to: "/my-courses", Icon: MdCollectionsBookmark, label: "كورساتي" },
        { to: "/student-daily-quizzes", Icon: MdWhatshot, label: "المسابقات اليومية" },
        { to: "/my-points", Icon: MdEmojiEvents, label: "نقاطي وترتيبي" },
        { to: "/exam_grades", Icon: MdGrading, label: "درجات الامتحانات" },
        { to: "/scientific-chat", Icon: FaRobot, label: "المساعد العلمي" },
      ],
    },
  ];

  const academySections = [
    {
      title: "الأكاديمية",
      links: [
        { to: "/academy", Icon: MdDashboard, label: "لوحة الأكاديمية" },
        { to: "/academy/teachers", Icon: MdPeople, label: "مدرسو الأكاديمية" },
        { to: "/academy/courses", Icon: MdLibraryBooks, label: "كورسات الأكاديمية" },
        { to: "/teacher-points", Icon: MdEmojiEvents, label: "النقاط والترتيب" },
      ],
    },
    {
      title: "المحتوى",
      links: [
        { to: "/teacher_courses", Icon: MdCollectionsBookmark, label: "إنشاء وإدارة الكورسات" },
        { to: "/platform-students", Icon: MdPeople, label: "طلاب المنصة" },
      ],
    },
  ];

  const academyTeacherSections = [
    {
      title: "أكاديميتي",
      links: [
        { to: "/academy/me", Icon: MdHome, label: "لوحتي" },
        { to: "/academy/me/courses", Icon: MdLibraryBooks, label: "كورساتي المسندة" },
      ],
    },
    {
      title: "المحتوى",
      links: [
        { to: "/teacher-exams", Icon: MdQuiz, label: "الامتحانات" },
        { to: "/teacher-assignments", Icon: MdAssignment, label: "الواجبات" },
        { to: "/teacher-points", Icon: MdEmojiEvents, label: "النقاط والترتيب" },
        { to: "/teacher-my-files", Icon: FaFolderOpen, label: "ملفاتي" },
        { to: "/teacher-trash", Icon: MdRestoreFromTrash, label: "المحذوفات" },
      ],
    },
  ];

  const sections = isAdmin
    ? adminSections
    : isAcademy
      ? academySections
      : isAcademyTeacher
        ? academyTeacherSections
        : isTeacher
          ? teacherSections
          : isStudent
            ? studentSections
            : [{ title: "عام", links: [{ to: "/home", Icon: MdHome, label: "الصفحة الرئيسية" }] }];

  return (
    <VStack spacing={0.5} align="stretch" w="full" pb={2} data-tour-id="student-nav-links">
      {sections.map((section) => (
        <NavSection key={section.title} title={section.title} isSidebarOpen={isSidebarOpen}>
          {section.links.map((link) => (
            <NavLinkItem
              key={link.to}
              {...link}
              isSidebarOpen={isSidebarOpen}
              onClick={handleNavClick}
            />
          ))}
        </NavSection>
      ))}

      <Box pt={3} mt={2} borderTop="1px solid" borderColor={logoutBorder}>
        <Tooltip
          label={isSidebarOpen ? "" : "تسجيل الخروج"}
          placement="left"
          hasArrow
          openDelay={300}
        >
          <Box as="span" display="block" w="full">
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              w="full"
              h="auto"
              minH="46px"
              px={isSidebarOpen ? 2.5 : 2}
              py={2}
              borderRadius="2xl"
              color={logoutColor}
              _hover={{ bg: logoutHover }}
            >
              <Flex
                align="center"
                gap={3}
                w="full"
                justify={isSidebarOpen ? "flex-start" : "center"}
              >
                <Flex
                  w={9}
                  h={9}
                  flexShrink={0}
                  align="center"
                  justify="center"
                  borderRadius="xl"
                  bg={logoutIconBg}
                >
                  <Icon as={MdLogout} boxSize="17px" />
                </Flex>
                {isSidebarOpen ? (
                  <Text fontSize="sm" fontWeight="extrabold">
                    تسجيل الخروج
                  </Text>
                ) : null}
              </Flex>
            </Button>
          </Box>
        </Tooltip>
      </Box>
    </VStack>
  );
};

export default Links;
