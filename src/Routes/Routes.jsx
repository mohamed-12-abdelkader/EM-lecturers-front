import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

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

/*
 * كل الصفحات lazy — تُحمَّل عند فتحها فقط.
 * قبل كده كانت 127 صفحة بتتحمّل كلها مقدمًا فتأخر أول عرض جدًا.
 */

// Auth & Login
const SingUp = lazy(() => import("../pages/signup/SingUp"));
const WelcomePage = lazy(() => import("../pages/signup/WelcomePage"));
const LoginPage = lazy(() => import("../pages/login/LoginPage"));
const TeacherLoginPage = lazy(() => import("../pages/login/TeacherLoginPage"));
const VerifyCode = lazy(() => import("../pages/password/VerifyCode"));
const ResetPassword = lazy(() => import("../pages/password/ResetPassword"));

// Main Pages
const Home = lazy(() => import("../pages/home/Home"));
const HomePage = lazy(() => import("../pages/homePage/HomePage"));
const HomeLogin = lazy(() => import("../pages/homeLogin/HomeLogin"));
const LandingPage = lazy(() => import("../pages/landingPage/LandingPage"));
const NotFound = lazy(() => import("../components/not found/NotFound"));

// Tenant root
const TenantRootLayout = lazy(() =>
  import("../pages/tenantPublic/TenantSubdomainRoot").then((m) => ({
    default: m.TenantRootLayout,
  }))
);
const TenantRootIndex = lazy(() =>
  import("../pages/tenantPublic/TenantSubdomainRoot").then((m) => ({
    default: m.TenantRootIndex,
  }))
);

// Admin
const Admin = lazy(() => import("../pages/Admin/Admin"));
const AdminMange = lazy(() => import("../components/admin/AdminMange"));
const AdminCreateCode = lazy(() => import("../components/admin/AdminCreateCode"));
const AdminActivationCodes = lazy(() => import("../components/admin/AdminActivationCodes"));
const AdminTeacherBalances = lazy(() => import("../components/admin/AdminTeacherBalances"));
const AddTeacher = lazy(() => import("../components/admin/AddTeacher"));
const AddEmployees = lazy(() => import("../components/admin/AddEmployees"));
const MangeEmployees = lazy(() =>
  import("../components/admin/MangeEmployees").then((m) => ({
    default: m.MangeEmployees,
  }))
);
const OpenPhone = lazy(() => import("../components/admin/OpenPhone"));
const CreateComp = lazy(() => import("../components/admin/CreateComp"));
const AllComps = lazy(() => import("../components/admin/AllComps"));
const PackagesManagement = lazy(() => import("../components/admin/PackagesManagement"));
const PackageDetails = lazy(() => import("../pages/package/PackageDetails"));
const SubjectDetails = lazy(() => import("../pages/package/SubjectDetails"));
const GroupDetails = lazy(() => import("../pages/package/GroupDetails"));
const AssignmentQuestions = lazy(() => import("../pages/package/AssignmentQuestions"));
const AdminStreamsList = lazy(() => import("../components/stream/adminList"));
const GeneralCourses = lazy(() => import("../components/admin/GeneralCourses"));
const GeneralCourseDetailsPage = lazy(() => import("../pages/generalCourse/GeneralCourseDetailsPage"));
const GeneralCourseGroupPage = lazy(() => import("../pages/generalCourse/GeneralCourseGroupPage"));

// Student
const Profile = lazy(() => import("../pages/profile/Profile"));
const Wallet = lazy(() => import("../pages/wallet/Wallet"));
const TeacherWallet = lazy(() => import("../pages/wallet/TeacherWallet"));
const TeacherDetails = lazy(() => import("../pages/teacher/TeacherDetails"));
const Vedio = lazy(() => import("../pages/leacter/Vedio"));
const AllTeacherLogin = lazy(() => import("../components/teacher/AllTeacherLogin"));
const MyTeacher = lazy(() => import("../pages/myTeacher/MyTeacher"));
const SuggestedTeachers = lazy(() => import("../pages/suggested-teachers/SuggestedTeachers"));
const TeacherStudents = lazy(() => import("../pages/teacher/TeacherStudents"));
const ManagedStudentsPage = lazy(() => import("../pages/teacher/managedStudents/ManagedStudentsPage"));
const StudentReport = lazy(() => import("../pages/teacher/StudentReport"));
const PlatformStudents = lazy(() => import("../pages/teacher/PlatformStudents"));

// Center Management
const CenterLayout = lazy(() => import("../pages/centerMgmt/components/CenterLayout"));
const CenterDashboardPage = lazy(() => import("../pages/centerMgmt/CenterDashboardPage"));
const GroupsPage = lazy(() => import("../pages/centerMgmt/GroupsPage"));
const GroupDetailsPage = lazy(() => import("../pages/centerMgmt/GroupDetailsPage"));
const StudentsPage = lazy(() => import("../pages/centerMgmt/StudentsPage"));
const StudentDetailsPage = lazy(() => import("../pages/centerMgmt/StudentDetailsPage"));
const AttendancePage = lazy(() => import("../pages/centerMgmt/AttendancePage"));
const SubscriptionsPage = lazy(() => import("../pages/centerMgmt/SubscriptionsPage"));
const PaymentsPage = lazy(() => import("../pages/centerMgmt/PaymentsPage"));

// Exams
const Exam = lazy(() => import("../pages/exam/Exam"));
const ExamTeacher = lazy(() => import("../pages/exam/ExamTeacher"));
const ComprehensiveExam = lazy(() => import("../pages/exam/ComprehensiveExam"));
const ExamGrades = lazy(() => import("../pages/exam/ExamGrades"));
const TeacherAnalyticsIntelligence = lazy(() => import("../pages/analytics/TeacherAnalyticsIntelligence"));
const TeacherMyFilesPage = lazy(() => import("../pages/myFiles/TeacherMyFilesPage"));
const TeacherAssignmentsPage = lazy(() => import("../pages/assignments/TeacherAssignmentsPage"));
const TeacherCourseExamsPage = lazy(() => import("../pages/exams/TeacherCourseExamsPage"));
const TeacherFreeLecturesPage = lazy(() => import("../pages/freeLectures/TeacherFreeLecturesPage"));
const TeacherDailyQuizzesPage = lazy(() => import("../pages/dailyQuiz/TeacherDailyQuizzesPage"));
const TeacherDailyQuizDetailPage = lazy(() =>
  import("../pages/dailyQuiz/TeacherDailyQuizDetailPage"),
);
const StudentDailyQuizzesHomePage = lazy(() =>
  import("../pages/dailyQuiz/StudentDailyQuizzesHomePage"),
);
const StudentDailyQuizPlayPage = lazy(() =>
  import("../pages/dailyQuiz/StudentDailyQuizPlayPage"),
);
const StudentDailyQuizResultPage = lazy(() =>
  import("../pages/dailyQuiz/StudentDailyQuizResultPage"),
);
const StudentDailyQuizLeaderboardPage = lazy(() =>
  import("../pages/dailyQuiz/StudentDailyQuizLeaderboardPage"),
);
const StudentDailyQuizHubPage = lazy(() =>
  import("../pages/dailyQuiz/StudentDailyQuizHubPage"),
);
const ScientificChatPage = lazy(() => import("../pages/scientificChat/ScientificChatPage"));
const ScientificTeacherFilesPage = lazy(() => import("../pages/scientificChat/ScientificTeacherFilesPage"));
const ExamBuilderChatPage = lazy(() => import("../pages/examBuilder/ExamBuilderChatPage"));
const PlatformExams = lazy(() => import("../pages/PlatformExams/PlatformExams"));
const EssayExam = lazy(() => import("../pages/exam/EssayExam"));

// Question Bank
const QuestionBank = lazy(() => import("../pages/Question Bank/QuestionBank"));
const ChapterQuestion = lazy(() => import("../pages/Question Bank/ChapterQuestion"));
const SubjectPage = lazy(() => import("../pages/Question Bank/SubjectPage"));
const QuestionsPage = lazy(() => import("../pages/Question Bank/QuestionsPage"));
const QuestionBankDashboard = lazy(() => import("../pages/Question Bank/QuestionBankDashboard"));
const QuestionLibraryPage = lazy(() => import("../pages/Question Bank/QuestionLibraryPage"));
const QuestionLibraryLessonPage = lazy(() => import("../pages/Question Bank/QuestionLibraryLessonPage"));
const Lesson = lazy(() => import("../pages/Question Bank/Lesson"));
const TeacherSubject = lazy(() => import("../pages/Question Bank/TeacherSubject"));

// Competitions
const Competitions = lazy(() => import("../pages/competitions/Competitions"));
const CompetitionDetails = lazy(() => import("../pages/competitions/CompetitionDetails"));
const TheFirsts = lazy(() => import("../pages/theFirsts/TheFirsts"));

// Courses
const TeacherCourses = lazy(() => import("../pages/teacherCourses/TeacherCourses"));
const AllCourses = lazy(() => import("../pages/teacherCourses/AllCourses"));
const CourseDetailsPage = lazy(() => import("../pages/course/CourseDetailsPage"));
const CourseStatisticsPage = lazy(() => import("../pages/course/CourseStatisticsPage"));
const CourseStatistics = lazy(() => import("../pages/courseStatistics/CourseStatistics"));
const CourseStudentsPage = lazy(() => import("../pages/course/CourseStudentsPage"));

// Chat & Support
const ChatPage = lazy(() => import("../pages/chat/ChatPage"));
const TeacherChat = lazy(() => import("../pages/chat/TeacherChatPage"));
const ChatbotPage = lazy(() => import("../pages/chatbot/ChatbotPage"));
const TeamChat = lazy(() => import("../pages/teamChatPage/TeamChat"));
const SupportChatAdmin = lazy(() => import("../pages/support/SupportChatAdmin"));
const SupportChatTeacher = lazy(() => import("../pages/support/SupportChatTeacher"));
const SupportGuestPage = lazy(() => import("../pages/support/SupportGuestPage"));
const SupportEntry = lazy(() => import("../pages/support/SupportEntry"));

// Other Pages
const Code = lazy(() => import("../pages/code/Code"));
const TeacherCode = lazy(() => import("../pages/code/TeacherCode"));
const StudentStats = lazy(() => import("../pages/myStatistics/MyStatistics"));
const AllUsers = lazy(() => import("../pages/allUsers/AllUsers"));
const TasksPage = lazy(() => import("../pages/tasks/TasksPage"));
const AllStudents = lazy(() => import("../pages/allStudents/AllStudents"));
const LecturCommints = lazy(() => import("../pages/lecturCommints/LecturCommints"));
const Social = lazy(() => import("../pages/social/Social"));
const PlatfourmLeagues = lazy(() => import("../pages/league/PlatfourmLeagues"));
const League = lazy(() => import("../pages/league/League"));
const Match = lazy(() => import("../pages/league/Match"));
const LecturesSchedule = lazy(() => import("../pages/lecturesSchedule/LecturesSchedule"));
const FinanceManagementPage = lazy(() => import("../pages/finance/FinanceManagementPage"));
const AdminAllStudentsPage = lazy(() => import("../pages/Admin/AdminAllStudentsPage"));
const WhatsAppSessionsPage = lazy(() => import("../pages/Admin/whatsapp/WhatsAppSessionsPage"));
const WhatsAppServicesPage = lazy(() => import("../pages/Admin/whatsapp/WhatsAppServicesPage"));
const WhatsAppMonitorPage = lazy(() => import("../pages/Admin/whatsapp/WhatsAppMonitorPage"));
const WhatsAppInboxPage = lazy(() => import("../pages/Admin/whatsapp/WhatsAppInboxPage"));
const TeacherInvoicesPage = lazy(() => import("../pages/teacher/TeacherInvoicesPage"));
const AdminDashboardHome = lazy(() => import("../pages/home/AdminDashboardHome"));
const TeacherDashboardHome = lazy(() => import("../pages/home/TeacherDashboardHome"));
const GlobalSearchPage = lazy(() => import("../pages/search/GlobalSearchPage"));
const ChallengeEMAcademy = lazy(() => import("../pages/challengeEMAcademy/ChallengeEMAcademy"));
const LecturesTaple = lazy(() => import("../pages/lecturesTaple/LecturesTaple"));
const MeetingRoom = lazy(() => import("../pages/meeting/MeetingRoom"));
const MyEnrollmentsPage = lazy(() => import("../pages/myEnrollments/MyEnrollmentsPage"));
const NotificationCenterPage = lazy(() => import("../pages/notifications/NotificationCenterPage"));

/* مؤشر تحميل خفيف يظهر أثناء جلب كود الصفحة أول مرة فقط */
const RouteFallback = () => (
  <div
    role="status"
    aria-label="جاري التحميل"
    style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <span
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "3px solid rgba(0,160,227,0.2)",
        borderTopColor: "#00a0e3",
        display: "inline-block",
        animation: "em-route-spin 0.8s linear infinite",
      }}
    />
    <style>{`@keyframes em-route-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const AppRouter = () => {
  const [userData, isAdmin, isTeacher, student] = UserType();
  const tenantSubdomain = getTenantSubdomain();

  return (
    <div>
      {tenantSubdomain ? <TenantSeoHead subdomain={tenantSubdomain} /> : null}
      <Suspense fallback={<RouteFallback />}>
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
        <Route path="/support-guest" element={<SupportGuestPage />} />
        <Route path="/support" element={<SupportEntry />} />
        {!tenantSubdomain ? <Route path="/search" element={<GlobalSearchPage />} /> : null}
        {renderTenantPublicRoutes(tenantSubdomain)}

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <ProtectedLogin auth={isAdmin || student || isTeacher}>
              <LoginPage />
            </ProtectedLogin>
          }
        />
        <Route
          path="/teacher-login"
          element={
            <ProtectedLogin auth={isAdmin || student || isTeacher}>
              <TeacherLoginPage />
            </ProtectedLogin>
          }
        />



        <Route path="/welcome" element={<WelcomePage />} />

        <Route
          path="/signup"
          element={
            <ProtectedLogin auth={isAdmin || student || isTeacher}>
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
        <Route path="video/:videoId/:token?" element={<Vedio />} />
        {/* Main App Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute auth={isAdmin || isTeacher || student}>
              <HomeLogin />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route
            path="home"
            element={
              isAdmin ? (
                <AdminDashboardHome />
              ) : isTeacher ? (
                <TeacherDashboardHome />
              ) : (
                <HomePage />
              )
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
          <Route
            path="QuestionLibraryPage/lesson/:lessonId"
            element={<QuestionLibraryLessonPage />}
          />

          {/* Exams */}
          <Route path="Platform_exams" element={<PlatformExams />} />
          <Route path="essay-exam/:id" element={<EssayExam />} />
          <Route path="exam/:examId" element={<Exam />} />
          <Route path="exam_grades" element={<ExamGrades />} />
          <Route path="teacher-analytics" element={<TeacherAnalyticsIntelligence />} />
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

        </Route>

        {/* Teacher Specific Routes */}
        <Route element={<ProtectedRoute auth={isTeacher || isAdmin} />}>
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
