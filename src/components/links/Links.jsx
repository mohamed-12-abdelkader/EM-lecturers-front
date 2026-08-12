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
  MdSchedule,
  MdCollectionsBookmark,
  MdDescription,
  MdBusiness,
  MdGroups,
} from "react-icons/md";
import { FaAndroid, FaRobot, FaFolderOpen, FaWhatsapp } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import {
  VStack,
  HStack,
  Text,
  Icon,
  Box,
  Tooltip,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";
import UserType from "../../Hooks/auth/userType";
import { logoutRequest } from "../../services/authService";
import { clearAuthSession } from "../../utils/authStorage";

const NavLinkItem = ({ to, Icon: LinkIcon, label, onClick, isSidebarOpen }) => {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== "/home" && location.pathname.startsWith(`${to}/`));

  const activeBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const activeColor = useColorModeValue("blue.700", "blue.200");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const hoverTextColor = useColorModeValue("gray.800", "white");
  const iconWrapIdle = useColorModeValue("gray.100", "whiteAlpha.100");
  const iconWrapActive = useColorModeValue("blue.500", "blue.400");
  const iconIdleColor = useColorModeValue("blue.500", "blue.300");
  const accentBar = useColorModeValue("blue.500", "blue.300");

  const content = (
    <Flex
      align="center"
      gap={3}
      px={isSidebarOpen ? 2.5 : 2}
      py={2}
      borderRadius="xl"
      bg={isActive ? activeBg : "transparent"}
      color={isActive ? activeColor : textColor}
      position="relative"
      overflow="hidden"
      _hover={{
        bg: isActive ? activeBg : hoverBg,
        color: isActive ? activeColor : hoverTextColor,
      }}
      transition="all 0.2s ease"
      w="full"
      minH="44px"
      justify={isSidebarOpen ? "flex-start" : "center"}
      cursor="pointer"
      role="group"
    >
      {isActive && isSidebarOpen ? (
        <Box
          position="absolute"
          right={0}
          top="18%"
          bottom="18%"
          w="3px"
          borderRadius="full"
          bg={accentBar}
        />
      ) : null}

      <Flex
        w={9}
        h={9}
        flexShrink={0}
        align="center"
        justify="center"
        borderRadius="lg"
        bg={isActive ? iconWrapActive : iconWrapIdle}
        color={isActive ? "white" : iconIdleColor}
        transition="all 0.2s ease"
        _groupHover={{
          transform: isSidebarOpen ? "scale(1.04)" : "none",
        }}
      >
        <Icon as={LinkIcon} boxSize="18px" />
      </Flex>

      {isSidebarOpen ? (
        <Text
          flex={1}
          fontSize="sm"
          fontWeight={isActive ? "bold" : "medium"}
          noOfLines={1}
          letterSpacing="0.01em"
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
  const divider = useColorModeValue("gray.100", "gray.700");

  return (
    <Box w="full">
      {isSidebarOpen && title ? (
        <Text
          px={3}
          pt={3}
          pb={1.5}
          fontSize="10px"
          fontWeight="bold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color={sectionColor}
        >
          {title}
        </Text>
      ) : isSidebarOpen ? null : (
        <Box h="1px" bg={divider} my={2} mx={2} />
      )}
      <VStack spacing={0.5} align="stretch" w="full">
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

  const handleLogout = async () => {
    // يمسح كوكي الـ refresh على الخادم ثم ينظف الجلسة محلياً ويبلغ بقية التبويبات
    try {
      await logoutRequest();
    } catch {
      // الخروج محلياً يتم في كل الأحوال
    }
    ["examAnswers", "examTimeLeft"].forEach((item) =>
      localStorage.removeItem(item),
    );
    clearAuthSession({ broadcast: true });
    window.location.href = "/login";
  };

  const logoutBorder = useColorModeValue("gray.100", "gray.700");
  const logoutHover = useColorModeValue("red.50", "whiteAlpha.50");
  const logoutColor = useColorModeValue("red.600", "red.300");

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
        { to: "/lectures_taple", Icon: MdSchedule, label: "جدول المحاضرات" },
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
        { to: "/teacher-my-files", Icon: FaFolderOpen, label: "ملفاتي" },
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
    <VStack spacing={1} align="stretch" w="full" pb={2} data-tour-id="student-nav-links">
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
          <Flex
            as="button"
            type="button"
            onClick={() => {
              handleLogout();
              onClose?.();
            }}
            align="center"
            gap={3}
            px={isSidebarOpen ? 2.5 : 2}
            py={2}
            borderRadius="xl"
            color={logoutColor}
            w="full"
            minH="44px"
            justify={isSidebarOpen ? "flex-start" : "center"}
            _hover={{ bg: logoutHover }}
            transition="all 0.2s ease"
          >
            <Flex
              w={9}
              h={9}
              flexShrink={0}
              align="center"
              justify="center"
              borderRadius="lg"
              bg={useColorModeValue("red.50", "whiteAlpha.100")}
            >
              <Icon as={MdLogout} boxSize="18px" />
            </Flex>
            {isSidebarOpen ? (
              <Text fontSize="sm" fontWeight="bold">
                تسجيل الخروج
              </Text>
            ) : null}
          </Flex>
        </Tooltip>
      </Box>
    </VStack>
  );
};

export default Links;
