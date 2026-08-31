import { Suspense } from "react";
import { lazyWithRetry } from "../utils/lazyWithRetry";
import { Routes, Route, Navigate } from "react-router-dom";

// Hooks & Utils (خفيفة — تبقى eager)
import UserType from "../Hooks/auth/userType";
import ProtectedRoute from "../components/protectedRoute/ProtectedRoute";
import ProtectedLogin from "../components/protectedRoute/ProtectedLogin";
import { getTenantSubdomain } from "../utils/tenantHost";
import {
  renderTenantPublicRoutes,
  TenantPublicNotFoundRoute,
} from "../pages/tenantPublic/TenantPublicRoutes";
import TenantSeoHead from "../pages/tenantPublic/components/TenantSeoHead";
import RouteChunkLoader from "../components/loading/RouteChunkLoader";

/*
 * كل الصفحات lazy — تُحمَّل عند فتحها فقط.
 * lazyWithRetry: إعادة محاولة + reload تلقائي عند فشل chunk (PWA/كاش قديم).
 */
const lazyPage = lazyWithRetry;

// Auth & Login
const SingUp = lazyPage(() => import("../pages/signup/SingUp"));
const WelcomePage = lazyPage(() => import("../pages/signup/WelcomePage"));
const LoginPage = lazyPage(() => import("../pages/login/LoginPage"));
const TeacherLoginPage = lazyPage(() => import("../pages/login/TeacherLoginPage"));
const VerifyCode = lazyPage(() => import("../pages/password/VerifyCode"));
const ResetPassword = lazyPage(() => import("../pages/password/ResetPassword"));

// Main Pages
const Home = lazyPage(() => import("../pages/home/Home"));
const HomePage = lazyPage(() => import("../pages/homePage/HomePage"));
const HomeLogin = lazyPage(() => import("../pages/homeLogin/HomeLogin"));
const LandingPage = lazyPage(() => import("../pages/landingPage/LandingPage"));
const NotFound = lazyPage(() => import("../components/not found/NotFound"));

// Tenant root
const TenantRootLayout = lazyPage(() =>
  import("../pages/tenantPublic/TenantSubdomainRoot").then((m) => ({
    default: m.TenantRootLayout,
  }))
);
const TenantRootIndex = lazyPage(() =>
  import("../pages/tenantPublic/TenantSubdomainRoot").then((m) => ({
    default: m.TenantRootIndex,
  }))
);

// Admin
const Admin = lazyPage(() => import("../pages/Admin/Admin"));
const AdminMange = lazyPage(() => import("../components/admin/AdminMange"));
const AdminCreateCode = lazyPage(() => import("../components/admin/AdminCreateCode"));
const AdminActivationCodes = lazyPage(() => import("../components/admin/AdminActivationCodes"));
const AdminTeacherBalances = lazyPage(() => import("../components/admin/AdminTeacherBalances"));
const AddTeacher = lazyPage(() => import("../components/admin/AddTeacher"));
const AddEmployees = lazyPage(() => import("../components/admin/AddEmployees"));
const MangeEmployees = lazyPage(() =>
  import("../components/admin/MangeEmployees").then((m) => ({
    default: m.MangeEmployees,
  }))
);
const OpenPhone = lazyPage(() => import("../components/admin/OpenPhone"));
const CreateComp = lazyPage(() => import("../components/admin/CreateComp"));
const AllComps = lazyPage(() => import("../components/admin/AllComps"));
const PackagesManagement = lazyPage(() => import("../components/admin/PackagesManagement"));
const PackageDetails = lazyPage(() => import("../pages/package/PackageDetails"));
const SubjectDetails = lazyPage(() => import("../pages/package/SubjectDetails"));
const GroupDetails = lazyPage(() => import("../pages/package/GroupDetails"));
const AssignmentQuestions = lazyPage(() => import("../pages/package/AssignmentQuestions"));
const AdminStreamsList = lazyPage(() => import("../components/stream/adminList"));
const GeneralCourses = lazyPage(() => import("../components/admin/GeneralCourses"));
const GeneralCourseDetailsPage = lazyPage(() => import("../pages/generalCourse/GeneralCourseDetailsPage"));
const GeneralCourseGroupPage = lazyPage(() => import("../pages/generalCourse/GeneralCourseGroupPage"));

// Student
const Profile = lazyPage(() => import("../pages/profile/Profile"));
const Wallet = lazyPage(() => import("../pages/wallet/Wallet"));
const TeacherWallet = lazyPage(() => import("../pages/wallet/TeacherWallet"));
const TeacherDetails = lazyPage(() => import("../pages/teacher/TeacherDetails"));
const Vedio = lazyPage(() => import("../pages/leacter/Vedio"));
const AllTeacherLogin = lazyPage(() => import("../components/teacher/AllTeacherLogin"));
const MyTeacher = lazyPage(() => import("../pages/myTeacher/MyTeacher"));
const SuggestedTeachers = lazyPage(() => import("../pages/suggested-teachers/SuggestedTeachers"));
const TeacherStudents = lazyPage(() => import("../pages/teacher/TeacherStudents"));
const ManagedStudentsPage = lazyPage(() => import("../pages/teacher/managedStudents/ManagedStudentsPage"));
const StudentReport = lazyPage(() => import("../pages/teacher/StudentReport"));
const PlatformStudents = lazyPage(() => import("../pages/teacher/PlatformStudents"));
const TeacherWhatsAppPage = lazyPage(() => import("../pages/teacher/TeacherWhatsAppPage"));

// Center Management
const CenterLayout = lazyPage(() => import("../pages/centerMgmt/components/CenterLayout"));
const CenterDashboardPage = lazyPage(() => import("../pages/centerMgmt/CenterDashboardPage"));
const GroupsPage = lazyPage(() => import("../pages/centerMgmt/GroupsPage"));
const GroupDetailsPage = lazyPage(() => import("../pages/centerMgmt/GroupDetailsPage"));
const GroupExamGradesPage = lazyPage(() => import("../pages/centerMgmt/GroupExamGradesPage"));
const StudentsPage = lazyPage(() => import("../pages/centerMgmt/StudentsPage"));
const StudentDetailsPage = lazyPage(() => import("../pages/centerMgmt/StudentDetailsPage"));
const AttendancePage = lazyPage(() => import("../pages/centerMgmt/AttendancePage"));
const SubscriptionsPage = lazyPage(() => import("../pages/centerMgmt/SubscriptionsPage"));
const PaymentsPage = lazyPage(() => import("../pages/centerMgmt/PaymentsPage"));

// Exams
const Exam = lazyPage(() => import("../pages/exam/Exam"));
const ExamTeacher = lazyPage(() => import("../pages/exam/ExamTeacher"));
const ComprehensiveExam = lazyPage(() => import("../pages/exam/ComprehensiveExam"));
const ExamReportPage = lazyPage(() => import("../pages/exam/ExamReportPage"));
const ExamGrades = lazyPage(() => import("../pages/exam/ExamGrades"));
const TeacherAnalyticsIntelligence = lazyPage(() => import("../pages/analytics/TeacherAnalyticsIntelligence"));
const TeacherMyFilesPage = lazyPage(() => import("../pages/myFiles/TeacherMyFilesPage"));
const TeacherTrashPage = lazyPage(() => import("../pages/teacher/TeacherTrashPage"));
const TeacherCourseGroupsPage = lazyPage(() => import("../pages/teacher/CourseGroupsPage"));
const TeacherAssignmentsPage = lazyPage(() => import("../pages/assignments/TeacherAssignmentsPage"));
const TeacherCourseExamsPage = lazyPage(() => import("../pages/exams/TeacherCourseExamsPage"));
const TeacherFreeLecturesPage = lazyPage(() => import("../pages/freeLectures/TeacherFreeLecturesPage"));
const TeacherDailyQuizzesPage = lazyPage(() => import("../pages/dailyQuiz/TeacherDailyQuizzesPage"));
const TeacherDailyQuizDetailPage = lazyPage(() =>
  import("../pages/dailyQuiz/TeacherDailyQuizDetailPage"),
);
const StudentDailyQuizzesHomePage = lazyPage(() =>
  import("../pages/dailyQuiz/StudentDailyQuizzesHomePage"),
);
const StudentDailyQuizPlayPage = lazyPage(() =>
  import("../pages/dailyQuiz/StudentDailyQuizPlayPage"),
);
const StudentDailyQuizResultPage = lazyPage(() =>
  import("../pages/dailyQuiz/StudentDailyQuizResultPage"),
);
const StudentDailyQuizLeaderboardPage = lazyPage(() =>
  import("../pages/dailyQuiz/StudentDailyQuizLeaderboardPage"),
);
const StudentDailyQuizHubPage = lazyPage(() =>
  import("../pages/dailyQuiz/StudentDailyQuizHubPage"),
);
const ScientificChatPage = lazyPage(() => import("../pages/scientificChat/ScientificChatPage"));
const ScientificTeacherFilesPage = lazyPage(() => import("../pages/scientificChat/ScientificTeacherFilesPage"));
const ExamBuilderChatPage = lazyPage(() => import("../pages/examBuilder/ExamBuilderChatPage"));
const PlatformExams = lazyPage(() => import("../pages/PlatformExams/PlatformExams"));
const EssayExam = lazyPage(() => import("../pages/exam/EssayExam"));

// Question Bank
const QuestionBank = lazyPage(() => import("../pages/Question Bank/QuestionBank"));
const ChapterQuestion = lazyPage(() => import("../pages/Question Bank/ChapterQuestion"));
const SubjectPage = lazyPage(() => import("../pages/Question Bank/SubjectPage"));
const QuestionsPage = lazyPage(() => import("../pages/Question Bank/QuestionsPage"));
const QuestionBankDashboard = lazyPage(() => import("../pages/Question Bank/QuestionBankDashboard"));
const QuestionLibraryPage = lazyPage(() => import("../pages/Question Bank/QuestionLibraryPage"));
const QuestionLibraryGradePage = lazyPage(() => import("../pages/Question Bank/QuestionLibraryGradePage"));
const QuestionLibraryLessonPage = lazyPage(() => import("../pages/Question Bank/QuestionLibraryLessonPage"));
const Lesson = lazyPage(() => import("../pages/Question Bank/Lesson"));
const TeacherSubject = lazyPage(() => import("../pages/Question Bank/TeacherSubject"));

// Competitions
const Competitions = lazyPage(() => import("../pages/competitions/Competitions"));
const CompetitionDetails = lazyPage(() => import("../pages/competitions/CompetitionDetails"));
const TheFirsts = lazyPage(() => import("../pages/theFirsts/TheFirsts"));

// Courses
const TeacherCourses = lazyPage(() => import("../pages/teacherCourses/TeacherCourses"));
const AllCourses = lazyPage(() => import("../pages/teacherCourses/AllCourses"));
const CourseDetailsPage = lazyPage(() => import("../pages/course/CourseDetailsPage"));
const CourseFileViewPage = lazyPage(() => import("../pages/course/CourseFileViewPage"));
const CourseStatisticsPage = lazyPage(() => import("../pages/course/CourseStatisticsPage"));
const CourseStatistics = lazyPage(() => import("../pages/courseStatistics/CourseStatistics"));
const CourseStudentsPage = lazyPage(() => import("../pages/course/CourseStudentsPage"));

// Chat & Support
const ChatPage = lazyPage(() => import("../pages/chat/ChatPage"));
const TeacherChat = lazyPage(() => import("../pages/chat/TeacherChatPage"));
const ChatbotPage = lazyPage(() => import("../pages/chatbot/ChatbotPage"));
const TeamChat = lazyPage(() => import("../pages/teamChatPage/TeamChat"));
const SupportChatAdmin = lazyPage(() => import("../pages/support/SupportChatAdmin"));
const SupportChatTeacher = lazyPage(() => import("../pages/support/SupportChatTeacher"));
const SupportGuestPage = lazyPage(() => import("../pages/support/SupportGuestPage"));
const SupportEntry = lazyPage(() => import("../pages/support/SupportEntry"));

// Other Pages
const Code = lazyPage(() => import("../pages/code/Code"));
const TeacherCode = lazyPage(() => import("../pages/code/TeacherCode"));
const StudentStats = lazyPage(() => import("../pages/myStatistics/MyStatistics"));
const AllUsers = lazyPage(() => import("../pages/allUsers/AllUsers"));
const TasksPage = lazyPage(() => import("../pages/tasks/TasksPage"));
const AllStudents = lazyPage(() => import("../pages/allStudents/AllStudents"));
const LecturCommints = lazyPage(() => import("../pages/lecturCommints/LecturCommints"));
const Social = lazyPage(() => import("../pages/social/Social"));
const PlatfourmLeagues = lazyPage(() => import("../pages/league/PlatfourmLeagues"));
const League = lazyPage(() => import("../pages/league/League"));
const Match = lazyPage(() => import("../pages/league/Match"));
const LecturesSchedule = lazyPage(() => import("../pages/lecturesSchedule/LecturesSchedule"));
const FinanceManagementPage = lazyPage(() => import("../pages/finance/FinanceManagementPage"));
const AdminAllStudentsPage = lazyPage(() => import("../pages/Admin/AdminAllStudentsPage"));
const WhatsAppSessionsPage = lazyPage(() => import("../pages/Admin/whatsapp/WhatsAppSessionsPage"));
const WhatsAppServicesPage = lazyPage(() => import("../pages/Admin/whatsapp/WhatsAppServicesPage"));
const WhatsAppMonitorPage = lazyPage(() => import("../pages/Admin/whatsapp/WhatsAppMonitorPage"));
const WhatsAppInboxPage = lazyPage(() => import("../pages/Admin/whatsapp/WhatsAppInboxPage"));
const TeacherInvoicesPage = lazyPage(() => import("../pages/teacher/TeacherInvoicesPage"));
const AdminDashboardHome = lazyPage(() => import("../pages/home/AdminDashboardHome"));
const TeacherDashboardHome = lazyPage(() => import("../pages/home/TeacherDashboardHome"));
const RoleHomePage = lazyPage(() => import("../pages/home/RoleHomePage"));
const GlobalSearchPage = lazyPage(() => import("../pages/search/GlobalSearchPage"));
const ChallengeEMAcademy = lazyPage(() => import("../pages/challengeEMAcademy/ChallengeEMAcademy"));
const AcademyOverviewPage = lazyPage(() => import("../pages/academy/AcademyOverviewPage"));
const AcademyTeachersPage = lazyPage(() => import("../pages/academy/AcademyTeachersPage"));
const AcademyCoursesPage = lazyPage(() => import("../pages/academy/AcademyCoursesPage"));
const AcademyTeacherHomePage = lazyPage(() => import("../pages/academy/AcademyTeacherHomePage"));
const AcademyTeacherCoursesPage = lazyPage(() => import("../pages/academy/AcademyTeacherCoursesPage"));
const AcademyOwnerShell = lazyPage(() =>
  import("../pages/academy/components/AcademyShell").then((m) => ({
    default: m.AcademyOwnerShell,
  })),
);
const AcademyTeacherShell = lazyPage(() =>
  import("../pages/academy/components/AcademyShell").then((m) => ({
    default: m.AcademyTeacherShell,
  })),
);
const LecturesTaple = lazyPage(() => import("../pages/lecturesTaple/LecturesTaple"));
const MeetingRoom = lazyPage(() => import("../pages/meeting/MeetingRoom"));
const MyEnrollmentsPage = lazyPage(() => import("../pages/myEnrollments/MyEnrollmentsPage"));
const NotificationCenterPage = lazyPage(() => import("../pages/notifications/NotificationCenterPage"));

const AppRouter = () => {
  const [userData, isAdmin, isTeacher, student, isAcademy, isAcademyTeacher] = UserType();
  const tenantSubdomain = getTenantSubdomain();

  return (
    <div>
      {tenantSubdomain ? <TenantSeoHead subdomain={tenantSubdomain} /> : null}
      <Suspense fallback={<RouteChunkLoader />}>
      <Routes>
        {/* Public Routes — على النطاق الفرعي للمستأجر: الرئيسية = لاندنج العميل؛ باقي المسارات (login, home, …) مشتركة لنفس الـ origin وللـ localStorage */}
        <Route
          path="/"
          element={tenantSubdomain ? <TenantRootLayout /> : <Home />}
        >
          {tenantSubdomain ? (
            <Route index element={<TenantRootIndex />} />
          ) : null}
        </Route>
        <Route path="/landing" element={<LandingPage />} />
        {!tenantSubdomain ? (
          <Route path="/create-platform" element={<AddTeacher publicMode />} />
        ) : null}
        <Route path="/support-guest" element={<SupportGuestPage />} />
        <Route path="/support" element={<SupportEntry />} />
        {!tenantSubdomain ? <Route path="/search" element={<GlobalSearchPage />} /> : null}
        {renderTenantPublicRoutes(tenantSubdomain)}

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <ProtectedLogin>
              <LoginPage />
            </ProtectedLogin>
          }
        />
        <Route
          path="/teacher-login"
          element={
            <ProtectedLogin>
              <TeacherLoginPage />
            </ProtectedLogin>
          }
        />



        <Route path="/welcome" element={<WelcomePage />} />

        <Route
          path="/signup"
          element={
            <ProtectedLogin>
              <SingUp />
            </ProtectedLogin>
          }
        />
        <Route path="/verify_code" element={<VerifyCode />} />
        <Route path="/rest_pass" element={<ResetPassword />} />

        {/* Admin Only Routes */}
        <Route
          path="/code"
          element={
            <ProtectedRoute auth={isAdmin}>
              <Code />
            </ProtectedRoute>
          }
        />
        <Route
          path="/all_users"
          element={
            <ProtectedRoute auth={isAdmin}>
              <AllUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/all_students"
          element={
            <ProtectedRoute auth={isAdmin}>
              <AllStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/packages-management"
          element={
            <ProtectedRoute auth={isAdmin}>
              <PackagesManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support-chat"
          element={
            <ProtectedRoute auth={isAdmin}>
              <SupportChatAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/package/:id"
          element={
            <ProtectedRoute auth={isAdmin}>
              <PackageDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subject/:id"
          element={
            <ProtectedRoute auth={isAdmin || isTeacher || student}>
              <SubjectDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subject/:subjectId/groups/:groupId"
          element={
            <ProtectedRoute auth={isAdmin || isTeacher}>
              <GroupDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignment/:assignmentId/questions"
          element={
            <ProtectedRoute auth={isAdmin || isTeacher || student}>
              <AssignmentQuestions />
            </ProtectedRoute>
          }
        />

        {/* Streams Route */}
        <Route
          path="/streams"
          element={
            <ProtectedRoute auth={isAdmin}>
              <HomeLogin />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminStreamsList />} />
        </Route>

        {/* Finance — داخل HomeLogin مع السايدبار الرئيسي */}
        <Route
          path="/admin/finance"
          element={
            <ProtectedRoute auth={isAdmin}>
              <HomeLogin />
            </ProtectedRoute>
          }
        >
          <Route index element={<FinanceManagementPage />} />
        </Route>

        {/* كل طلاب المنصات */}
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute auth={isAdmin}>
              <HomeLogin />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminAllStudentsPage />} />
        </Route>

        {/* WhatsApp platform admin */}
        <Route
          path="/admin/whatsapp/sessions"
          element={
            <ProtectedRoute auth={isAdmin}>
              <HomeLogin />
            </ProtectedRoute>
          }
        >
          <Route index element={<WhatsAppSessionsPage />} />
        </Route>
        <Route
          path="/admin/whatsapp/services"
          element={
            <ProtectedRoute auth={isAdmin}>
              <HomeLogin />
            </ProtectedRoute>
          }
        >
          <Route index element={<WhatsAppServicesPage />} />
        </Route>
        <Route
          path="/admin/whatsapp/monitor"
          element={
            <ProtectedRoute auth={isAdmin}>
              <HomeLogin />
            </ProtectedRoute>
          }
        >
          <Route index element={<WhatsAppMonitorPage />} />
        </Route>
        <Route
          path="/admin/whatsapp/inbox"
          element={
            <ProtectedRoute auth={isAdmin}>
              <HomeLogin />
            </ProtectedRoute>
          }
        >
          <Route index element={<WhatsAppInboxPage />} />
        </Route>

        {/* إنشاء/تعديل منصة مدرس — صفحة مستقلة خارج لياوت الأدمن */}
        <Route
          path="/admin/addteacher"
          element={
            <ProtectedRoute auth={isAdmin}>
              <AddTeacher />
            </ProtectedRoute>
          }
        />

        {/* Admin Panel Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute auth={isAdmin || isTeacher}>
              <Admin />
            </ProtectedRoute>
          }
        >
          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute auth={isAdmin} />}>
            <Route path="management" element={<AdminMange />} />
            <Route path="add_employees" element={<AddEmployees />} />
            <Route path="mange_employees" element={<MangeEmployees />} />
            <Route path="create_code" element={<AdminCreateCode />} />
            <Route path="cridet" element={<AdminTeacherBalances />} />
            <Route path="open_phone" element={<OpenPhone />} />

          </Route>

          {/* Teacher Routes */}

        </Route>

        {/* Academy Dashboard — مالك الأكاديمية */}
        <Route
          path="/academy"
          element={
            <ProtectedRoute auth={isAcademy}>
              <AcademyOwnerShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AcademyOverviewPage />} />
          <Route path="teachers" element={<AcademyTeachersPage />} />
          <Route path="courses" element={<AcademyCoursesPage />} />
        </Route>

        {/* Academy Teacher — مدرس تابع للأكاديمية */}
        <Route
          path="/academy/me"
          element={
            <ProtectedRoute auth={isAcademyTeacher}>
              <AcademyTeacherShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AcademyTeacherHomePage />} />
          <Route path="courses" element={<AcademyTeacherCoursesPage />} />
        </Route>

        <Route path="video/:videoId/:token?" element={<Vedio />} />
        <Route
          path="CourseDetailsPage/:courseId/file/:fileId"
          element={
            <ProtectedRoute>
              <CourseFileViewPage />
            </ProtectedRoute>
          }
        />
        {/* Main App Routes — بوابة الجلسة فقط؛ الأدوار في المسارات الفرعية */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <HomeLogin />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route
            path="home"
            element={
              <RoleHomePage
                AdminDashboardHome={AdminDashboardHome}
                TeacherDashboardHome={TeacherDashboardHome}
                HomePage={HomePage}
              />
            }
          />

          {/* Admin standalone: إدارة أكواد التفعيل (صفحة عادية خارج لوحة التحكم) */}
          <Route
            path="activation-codes"
            element={
              <ProtectedRoute auth={isAdmin}>
                <AdminActivationCodes />
              </ProtectedRoute>
            }
          />

          {/* Profile & Settings */}
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<NotificationCenterPage />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="challenge_EM_Academy" element={<ChallengeEMAcademy />} />

          {/* Teachers */}
          <Route path="teachers" element={<AllTeacherLogin />} />
          <Route path="suggested-teachers" element={<SuggestedTeachers />} />
          <Route path="my-teachers" element={<MyTeacher />} />
          {/* قبل teacher/:id حتى لا يُفسَّر whatsapp كمعرّف محاضر */}
          <Route
            path="teacher-whatsapp"
            element={
              <ProtectedRoute auth={isTeacher || isAdmin}>
                <TeacherWhatsAppPage />
              </ProtectedRoute>
            }
          />
          <Route path="teacher/:id" element={<TeacherDetails />} />
          <Route path="lectures_taple" element={<LecturesTaple />} />
          <Route
            path="my-courses"
            element={
              <ProtectedRoute auth={student}>
                <MyEnrollmentsPage />
              </ProtectedRoute>
            }
          />
          <Route path="scientific-chat" element={<ScientificChatPage />} />
          <Route path="teacher-scientific-files" element={<ScientificTeacherFilesPage />} />

          {/* Competitions */}
          <Route path="competitions" element={<Competitions />} />
          <Route path="competition/:id" element={<CompetitionDetails />} />
          <Route path="the_Firsts" element={<TheFirsts />} />
          <Route path="general-courses" element={<GeneralCourses />} />
          <Route path="general-course/:id" element={<GeneralCourseDetailsPage />} />
          <Route path="general-course/:id/group/:groupId" element={<GeneralCourseGroupPage />} />
          {/* Question Bank */}
          <Route path="question-bank/subject/:id" element={<SubjectPage />} />
          <Route path="question-bank/:id" element={<QuestionBank />} />
          <Route path="question_bank" element={<QuestionBank />} />
          <Route path="supject/:id" element={<SubjectPage />} />
          <Route path="QuestionsPage/:id" element={<QuestionsPage />} />
          <Route path="chapter/:id" element={<ChapterQuestion />} />
          <Route path="lesson/:id" element={<Lesson />} />
          <Route path="Teacher_subjects" element={<TeacherSubject />} />
          <Route path="question-bank-dashboard" element={<QuestionBankDashboard />} />
          <Route path="dashboard" element={<QuestionBankDashboard />} />
          <Route path="QuestionLibraryPage" element={<QuestionLibraryPage />} />
          <Route path="QuestionLibraryPage/grade/:gradeId" element={<QuestionLibraryGradePage />} />
          <Route
            path="QuestionLibraryPage/grade/:gradeId/lesson/:lessonId"
            element={<QuestionLibraryLessonPage />}
          />
          <Route
            path="QuestionLibraryPage/lesson/:lessonId"
            element={<QuestionLibraryLessonPage />}
          />

          {/* Exams */}
          <Route path="Platform_exams" element={<PlatformExams />} />
          <Route path="essay-exam/:id" element={<EssayExam />} />
          <Route path="exam/:examId" element={<Exam />} />
          <Route path="exam/:examId/report" element={<ExamReportPage />} />
          <Route path="lecture-exam/:examId/report" element={<ExamReportPage />} />
          <Route path="exam_grades" element={<ExamGrades />} />
          <Route path="teacher-analytics" element={<TeacherAnalyticsIntelligence />} />
          <Route path="ComprehensiveExam/:id/report" element={<ExamReportPage />} />
          <Route path="ComprehensiveExam/:id" element={<ComprehensiveExam />} />

          {/* Leagues */}
          <Route path="leagues" element={<PlatfourmLeagues />} />
          <Route path="league/:id" element={<League />} />
          <Route path="matche/:id" element={<Match />} />
          {/* Chat */}
          <Route path="chatbot-page" element={<ChatbotPage />} />
          <Route path="chats" element={<ChatPage />} />
          <Route path="TeacherChat" element={<TeacherChat />} />
          <Route path="teamChat" element={<TeamChat />} />

          {/* Other Pages */}
          <Route path="social" element={<Social />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="lectur_commints/:id" element={<LecturCommints />} />

          {/* Course Details */}
          <Route path="CourseDetailsPage/:id" element={<CourseDetailsPage />} />
          <Route path="CourseStudentsPage/:id" element={<CourseStudentsPage />} />
          <Route path="CourseStatisticsPage/:id" element={<CourseStatisticsPage />} />

          {/* Meeting Room */}
          <Route path="meeting/:meetingId" element={<MeetingRoom />} />

          {/* Financial */}
          <Route path="PlatformAccounts" element={<FinanceManagementPage />} />
          <Route path="finance" element={<FinanceManagementPage />} />
          <Route path="LecturesSchedule" element={<LecturesSchedule />} />

          {/* Admin/Teacher Competition Management */}
          <Route path="create_comp" element={<CreateComp />} />
          <Route path="allComps" element={<AllComps />} />

          {/* فواتير المدرس — داخل HomeLogin لإظهار السايدبار */}
          <Route
            path="teacher-invoices"
            element={
              <ProtectedRoute auth={isTeacher}>
                <TeacherInvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher-invoices/:id"
            element={
              <ProtectedRoute auth={isTeacher}>
                <TeacherInvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher-trash"
            element={
              <ProtectedRoute auth={isTeacher || isAcademyTeacher || isAdmin}>
                <TeacherTrashPage />
              </ProtectedRoute>
            }
          />

        </Route>

        {/* Teacher Specific Routes */}
        <Route element={<ProtectedRoute auth={isTeacher || isAcademyTeacher || isAdmin} />}>
          <Route path="teacher_wallet" element={<TeacherWallet />} />
          <Route path="teacher_code" element={<TeacherCode />} />
          <Route path="teacher_exam/:examId" element={<ExamTeacher />} />
          <Route path="teacher_courses/*" element={<TeacherCourses />}>
            <Route path="courses/:id" element={<AllCourses />} />
          </Route>
          <Route path="teacher-students" element={<TeacherStudents />} />
          <Route path="managed-students" element={<ManagedStudentsPage />} />
          <Route path="center-mgmt" element={<CenterLayout />}>
            <Route index element={<CenterDashboardPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/:groupId" element={<GroupDetailsPage />} />
            <Route path="groups/:groupId/exams/:examId" element={<GroupExamGradesPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:studentId" element={<StudentDetailsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
          </Route>
          <Route path="teacher-students/:studentId" element={<StudentReport />} />
          <Route path="platform-students" element={<PlatformStudents />} />
          <Route path="support-teacher" element={<SupportChatTeacher />} />
          <Route path="teacher-my-files" element={<TeacherMyFilesPage />} />
          <Route path="teacher-course-groups" element={<TeacherCourseGroupsPage />} />
          <Route path="teacher-assignments" element={<TeacherAssignmentsPage />} />
          <Route path="teacher-exams" element={<TeacherCourseExamsPage />} />
          <Route path="exam-builder-chat" element={<ExamBuilderChatPage />} />
          <Route path="teacher-free-lectures" element={<TeacherFreeLecturesPage />} />
          <Route path="teacher-daily-quizzes" element={<TeacherDailyQuizzesPage />} />
          <Route path="teacher-daily-quizzes/:id" element={<TeacherDailyQuizDetailPage />} />
        </Route>
        {/* Student Specific Routes */}
        <Route element={<ProtectedRoute auth={student} />}>
          <Route path="studentStats" element={<StudentStats />} />
          <Route path="course_statistics" element={<CourseStatistics />} />
          <Route path="student-daily-quizzes" element={<StudentDailyQuizzesHomePage />} />
          <Route path="student-daily-quizzes/hub" element={<StudentDailyQuizHubPage />} />
          <Route path="student-daily-quizzes/attempt/:attemptId" element={<StudentDailyQuizPlayPage />} />
          <Route path="student-daily-quizzes/:id/result" element={<StudentDailyQuizResultPage />} />
          <Route path="student-daily-quizzes/:id/leaderboard" element={<StudentDailyQuizLeaderboardPage />} />
        </Route>

        {/* Shared Routes (طالب + مدرس) */}
        <Route element={<ProtectedRoute auth={isTeacher || student} />}>
          <Route path="video/:videoId/:token?" element={<Vedio />} />
        </Route>

        {/* مسارات غير معرّفة: على المستأجر نعرض 404 عامة، وإلا 404 الرئيسية */}
        <Route
          path="*"
          element={
            tenantSubdomain ? (
              <TenantPublicNotFoundRoute subdomain={tenantSubdomain} />
            ) : (
              <NotFound />
            )
          }
        />
      </Routes>
      </Suspense>
    </div>
  );
};

export default AppRouter;
