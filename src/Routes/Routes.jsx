import { Routes, Route } from "react-router-dom";

// Auth & Login Components
import SingUp from "../pages/signup/SingUp";
import WelcomePage from "../pages/signup/WelcomePage";
import LoginPage from "../pages/login/LoginPage";
import TeacherLoginPage from "../pages/login/TeacherLoginPage";
import VerifyCode from "../pages/password/VerifyCode";
import ResetPassword from "../pages/password/ResetPassword";
// Main Pages
import Home from "../pages/home/Home";
import HomePage from "../pages/homePage/HomePage";
import HomeLogin from "../pages/homeLogin/HomeLogin";
import LandingPage from "../pages/landingPage/LandingPage";
import NotFound from "../components/not found/NotFound";

// Admin Components
import Admin from "../pages/Admin/Admin";
import AdminMange from "../components/admin/AdminMange";
import AdminCreateCode from "../components/admin/AdminCreateCode";
import AdminActivationCodes from "../components/admin/AdminActivationCodes";
import AdminTeacherBalances from "../components/admin/AdminTeacherBalances";
import AddTeacher from "../components/admin/AddTeacher";
import AddEmployees from "../components/admin/AddEmployees";
import { MangeEmployees } from "../components/admin/MangeEmployees";
import OpenPhone from "../components/admin/OpenPhone";
import CreateComp from "../components/admin/CreateComp";
import AllComps from "../components/admin/AllComps";
import PackagesManagement from "../components/admin/PackagesManagement";
import PackageDetails from "../pages/package/PackageDetails";
import SubjectDetails from "../pages/package/SubjectDetails";
import GroupDetails from "../pages/package/GroupDetails";
import AssignmentQuestions from "../pages/package/AssignmentQuestions";
import AdminStreamsList from "../components/stream/adminList";
import GeneralCourses from "../components/admin/GeneralCourses";
import GeneralCourseDetailsPage from "../pages/generalCourse/GeneralCourseDetailsPage";
import GeneralCourseGroupPage from "../pages/generalCourse/GeneralCourseGroupPage";

// Teacher Components

// Student Components
import Profile from "../pages/profile/Profile";
import Wallet from "../pages/wallet/Wallet";
import TeacherWallet from "../pages/wallet/TeacherWallet";
import TeacherDetails from "../pages/teacher/TeacherDetails";

import Vedio from "../pages/leacter/Vedio";

import AllTeacherLogin from "../components/teacher/AllTeacherLogin";

import MyTeacher from "../pages/myTeacher/MyTeacher";
import SuggestedTeachers from "../pages/suggested-teachers/SuggestedTeachers";
import TeacherStudents from "../pages/teacher/TeacherStudents";
import ManagedStudentsPage from "../pages/teacher/managedStudents/ManagedStudentsPage";
import StudentReport from "../pages/teacher/StudentReport";
import PlatformStudents from "../pages/teacher/PlatformStudents";

// Center Management (teacher-center API)
import CenterLayout from "../pages/centerMgmt/components/CenterLayout";
import CenterDashboardPage from "../pages/centerMgmt/CenterDashboardPage";
import GroupsPage from "../pages/centerMgmt/GroupsPage";
import GroupDetailsPage from "../pages/centerMgmt/GroupDetailsPage";
import StudentsPage from "../pages/centerMgmt/StudentsPage";
import StudentDetailsPage from "../pages/centerMgmt/StudentDetailsPage";
import AttendancePage from "../pages/centerMgmt/AttendancePage";
import SubscriptionsPage from "../pages/centerMgmt/SubscriptionsPage";
import PaymentsPage from "../pages/centerMgmt/PaymentsPage";

// Exam Components
import Exam from "../pages/exam/Exam";
import ExamTeacher from "../pages/exam/ExamTeacher";
import ComprehensiveExam from "../pages/exam/ComprehensiveExam";
import ExamGrades from "../pages/exam/ExamGrades";
import TeacherAnalyticsIntelligence from "../pages/analytics/TeacherAnalyticsIntelligence";
import TeacherMyFilesPage from "../pages/myFiles/TeacherMyFilesPage";
import TeacherAssignmentsPage from "../pages/assignments/TeacherAssignmentsPage";
import TeacherCourseExamsPage from "../pages/exams/TeacherCourseExamsPage";
import TeacherFreeLecturesPage from "../pages/freeLectures/TeacherFreeLecturesPage";
import ScientificChatPage from "../pages/scientificChat/ScientificChatPage";
import ScientificTeacherFilesPage from "../pages/scientificChat/ScientificTeacherFilesPage";
import ExamBuilderChatPage from "../pages/examBuilder/ExamBuilderChatPage";
import PlatformExams from "../pages/PlatformExams/PlatformExams";


// Question Bank Components
import QuestionBank from "../pages/Question Bank/QuestionBank";
import ChapterQuestion from "../pages/Question Bank/ChapterQuestion";
import SubjectPage from "../pages/Question Bank/SubjectPage";
import QuestionsPage from "../pages/Question Bank/QuestionsPage";
import QuestionBankDashboard from "../pages/Question Bank/QuestionBankDashboard";
import QuestionLibraryPage from "../pages/Question Bank/QuestionLibraryPage";
import QuestionLibraryLessonPage from "../pages/Question Bank/QuestionLibraryLessonPage";
import Lesson from "../pages/Question Bank/Lesson";
import TeacherSubject from "../pages/Question Bank/TeacherSubject";

// Competition Components
import Competitions from "../pages/competitions/Competitions";
import CompetitionDetails from "../pages/competitions/CompetitionDetails";
import TheFirsts from "../pages/theFirsts/TheFirsts";

// Course Components
import TeacherCourses from "../pages/teacherCourses/TeacherCourses";
import AllCourses from "../pages/teacherCourses/AllCourses";
import CourseDetailsPage from "../pages/course/CourseDetailsPage";
import CourseStatisticsPage from "../pages/course/CourseStatisticsPage";
import CourseStatistics from "../pages/courseStatistics/CourseStatistics";
import CourseStudentsPage from "../pages/course/CourseStudentsPage";

// Chat Components
import ChatPage from "../pages/chat/ChatPage";
import TeacherChat from "../pages/chat/TeacherChatPage";
import ChatbotPage from "../pages/chatbot/ChatbotPage";
import TeamChat from "../pages/teamChatPage/TeamChat";
import SupportChatAdmin from "../pages/support/SupportChatAdmin";
import SupportChatStudent from "../pages/support/SupportChatStudent";
import SupportChatTeacher from "../pages/support/SupportChatTeacher";
import SupportGuestPage from "../pages/support/SupportGuestPage";

// Other Components
import Code from "../pages/code/Code";
import TeacherCode from "../pages/code/TeacherCode";

import StudentStats from "../pages/myStatistics/MyStatistics";
import AllUsers from "../pages/allUsers/AllUsers";
import TasksPage from "../pages/tasks/TasksPage";
import AllStudents from "../pages/allStudents/AllStudents";
import LecturCommints from "../pages/lecturCommints/LecturCommints";
import Social from "../pages/social/Social";
import PlatfourmLeagues from "../pages/league/PlatfourmLeagues";
import League from "../pages/league/League";
import LecturesSchedule from "../pages/lecturesSchedule/LecturesSchedule";
import FinanceManagementPage from "../pages/finance/FinanceManagementPage";
import TeacherInvoicesPage from "../pages/teacher/TeacherInvoicesPage";
import AdminDashboardHome from "../pages/home/AdminDashboardHome";
import TeacherDashboardHome from "../pages/home/TeacherDashboardHome";

// Hooks & Utils
import UserType from "../Hooks/auth/userType";
import ProtectedRoute from "../components/protectedRoute/ProtectedRoute";
import ProtectedLogin from "../components/protectedRoute/ProtectedLogin";
import { getTenantSubdomain } from "../utils/tenantHost";
import TenantPublicLanding from "../pages/tenantPublic/TenantPublicLanding";
import {
  TenantRootLayout,
  TenantRootIndex,
} from "../pages/tenantPublic/TenantSubdomainRoot";
import {
  renderTenantPublicRoutes,
  TenantPublicNotFoundRoute,
} from "../pages/tenantPublic/TenantPublicRoutes";
import GlobalSearchPage from "../pages/search/GlobalSearchPage";
import Match from "../pages/league/Match";
import EssayExam from "../pages/exam/EssayExam";
import ChallengeEMAcademy from "../pages/challengeEMAcademy/ChallengeEMAcademy";
import LecturesTaple from "../pages/lecturesTaple/LecturesTaple";
import MeetingRoom from "../pages/meeting/MeetingRoom";
import MyEnrollmentsPage from "../pages/myEnrollments/MyEnrollmentsPage";
import NotificationCenterPage from "../pages/notifications/NotificationCenterPage";


const AppRouter = () => {
  const [userData, isAdmin, isTeacher, student] = UserType();
  const tenantSubdomain = getTenantSubdomain();

  return (
    <div>
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
          path="/support-chat"
          element={
            <ProtectedRoute auth={isAdmin}>
              <SupportChatAdmin />
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
            <Route path="addteacher" element={<AddTeacher />} />
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

          {/* Courses */}






          {/* Groups */}


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
        </Route>
        {/* Student Specific Routes */}
        <Route element={<ProtectedRoute auth={student} />}>
          <Route path="studentStats" element={<StudentStats />} />
          <Route path="course_statistics" element={<CourseStatistics />} />
        </Route>

        {/* Shared Routes (طالب + مدرس) */}
        <Route element={<ProtectedRoute auth={isTeacher || student} />}>
          <Route path="support" element={<SupportChatStudent />} />
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
    </div>
  );
};

export default AppRouter;
