import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { RequireAuth, RequireRole } from "@/routes/guards";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { LandingPage } from "@/pages/public/LandingPage";
import { ExplorePage } from "@/pages/public/ExplorePage";
import { NotYetBuilt } from "@/components/layout/NotYetBuilt";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { StudentsPage } from "@/pages/admin/StudentsPage";
import { TeachersPage } from "@/pages/admin/TeachersPage";
import { SubjectsPage } from "@/pages/admin/SubjectsPage";
import { ClassesPage } from "@/pages/admin/ClassesPage";
import { AcademicYearsPage } from "@/pages/admin/AcademicYearsPage";
import { TimetablePage } from "@/pages/admin/TimetablePage";
import { SettingsPage } from "@/pages/admin/SettingsPage";
import { RolesPermissionsPage } from "@/pages/admin/RolesPermissionsPage";
import { AdminAttendancePage } from "@/pages/admin/AdminAttendancePage";
import { AdminAssignmentsPage } from "@/pages/admin/AdminAssignmentsPage";
import { AdminExamsPage } from "@/pages/admin/AdminExamsPage";
import { AuditLogPage } from "@/pages/admin/AuditLogPage";
import { PasswordRequestsPage } from "@/pages/admin/PasswordRequestsPage";
import { VisitorAnalyticsPage } from "@/pages/admin/VisitorAnalyticsPage";
import { TeacherDashboardPage } from "@/pages/teacher/TeacherDashboardPage";
import { TeacherAttendancePage } from "@/pages/teacher/TeacherAttendancePage";
import { TeacherAssignmentsPage } from "@/pages/teacher/TeacherAssignmentsPage";
import { TeacherExamsPage } from "@/pages/teacher/TeacherExamsPage";
import { TeacherQueriesPage } from "@/pages/teacher/TeacherQueriesPage";
import { TeacherMaterialsPage } from "@/pages/teacher/TeacherMaterialsPage";
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage";
import { StudentAttendancePage } from "@/pages/student/StudentAttendancePage";
import { StudentMarksPage } from "@/pages/student/StudentMarksPage";
import { StudentAssignmentsPage } from "@/pages/student/StudentAssignmentsPage";
import { StudentQueriesPage } from "@/pages/student/StudentQueriesPage";
import { StudentMaterialsPage } from "@/pages/student/StudentMaterialsPage";
import { NoticesPage } from "@/pages/shared/NoticesPage";
import { AnalyticsPage } from "@/pages/shared/AnalyticsPage";
import { ReportsPage } from "@/pages/shared/ReportsPage";
import { FeedbackPage } from "@/pages/shared/FeedbackPage";
import { NAV_BY_ROLE } from "@/components/layout/navConfig";

function RoleHome() {
  const { user } = useAuth();
  if (!user) return null;
  const dest = user.role === "SUPER_ADMIN" ? "/admin" : user.role === "TEACHER" ? "/teacher" : "/student";
  return <Navigate to={dest} replace />;
}

/** Public root: signed-in users go to their dashboard, everyone else sees the landing page. */
function PublicRoot() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <RoleHome />;
  return <LandingPage />;
}

/** Renders every nav item beyond the dashboard overview as NotYetBuilt for now (later phases fill these in). */
function buildPlaceholderRoutes(role: keyof typeof NAV_BY_ROLE, basePath: string, builtPaths: string[]) {
  return NAV_BY_ROLE[role]
    .flatMap((section) => section.items)
    .filter((item) => item.path !== basePath && !builtPaths.includes(item.path))
    .map((item) => (
      <Route key={item.path} path={item.path.replace(basePath, "").replace(/^\//, "")} element={<NotYetBuilt title={item.label} />} />
    ));
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoot />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<RequireRole role="SUPER_ADMIN" />}>
          <Route path="/admin" element={<AppShell />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="academic-years" element={<AcademicYearsPage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="exams" element={<AdminExamsPage />} />
            <Route path="attendance" element={<AdminAttendancePage />} />
            <Route path="assignments" element={<AdminAssignmentsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="visitors" element={<VisitorAnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notices" element={<NoticesPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="backup" element={<SettingsPage />} />
            <Route path="roles" element={<RolesPermissionsPage />} />
            <Route path="password-requests" element={<PasswordRequestsPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            {buildPlaceholderRoutes("SUPER_ADMIN", "/admin", [
              "/admin/students",
              "/admin/teachers",
              "/admin/subjects",
              "/admin/classes",
              "/admin/academic-years",
              "/admin/timetable",
              "/admin/exams",
              "/admin/attendance",
              "/admin/assignments",
              "/admin/analytics",
              "/admin/visitors",
              "/admin/reports",
              "/admin/notices",
              "/admin/feedback",
              "/admin/settings",
              "/admin/backup",
              "/admin/roles",
              "/admin/password-requests",
              "/admin/audit-log",
            ])}
          </Route>
        </Route>

        <Route element={<RequireRole role="TEACHER" />}>
          <Route path="/teacher" element={<AppShell />}>
            <Route index element={<TeacherDashboardPage />} />
            <Route path="attendance" element={<TeacherAttendancePage />} />
            <Route path="assignments" element={<TeacherAssignmentsPage />} />
            <Route path="marks" element={<TeacherExamsPage />} />
            <Route path="materials" element={<TeacherMaterialsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="queries" element={<TeacherQueriesPage />} />
            <Route path="notices" element={<NoticesPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            {buildPlaceholderRoutes("TEACHER", "/teacher", [
              "/teacher/attendance",
              "/teacher/assignments",
              "/teacher/marks",
              "/teacher/materials",
              "/teacher/analytics",
              "/teacher/queries",
              "/teacher/notices",
              "/teacher/feedback",
            ])}
          </Route>
        </Route>

        <Route element={<RequireRole role="STUDENT" />}>
          <Route path="/student" element={<AppShell />}>
            <Route index element={<StudentDashboardPage />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="marks" element={<StudentMarksPage />} />
            <Route path="assignments" element={<StudentAssignmentsPage />} />
            <Route path="materials" element={<StudentMaterialsPage />} />
            <Route path="queries" element={<StudentQueriesPage />} />
            <Route path="notices" element={<NoticesPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            {buildPlaceholderRoutes("STUDENT", "/student", [
              "/student/attendance",
              "/student/marks",
              "/student/assignments",
              "/student/materials",
              "/student/queries",
              "/student/notices",
              "/student/feedback",
            ])}
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster richColors position="top-right" theme="system" />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
