import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CalendarClock,
  ClipboardCheck,
  FileEdit,
  ClipboardList,
  BarChart3,
  Bell,
  MessageSquare,
  HelpCircle,
  Settings,
  ShieldCheck,
  Database,
  FileText,
  Upload,
  Award,
  TrendingUp,
  KeyRound,
  ScrollText,
  Globe,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_BY_ROLE: Record<Role, NavSection[]> = {
  SUPER_ADMIN: [
    { items: [{ label: "Dashboard", path: "/admin", icon: LayoutDashboard }] },
    {
      title: "People",
      items: [
        { label: "Teachers", path: "/admin/teachers", icon: Users },
        { label: "Students", path: "/admin/students", icon: GraduationCap },
      ],
    },
    {
      title: "Academics",
      items: [
        { label: "Subjects", path: "/admin/subjects", icon: BookOpen },
        { label: "Classes & Sections", path: "/admin/classes", icon: Layers },
        { label: "Academic Years", path: "/admin/academic-years", icon: CalendarClock },
        { label: "Timetable", path: "/admin/timetable", icon: CalendarClock },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Attendance", path: "/admin/attendance", icon: ClipboardCheck },
        { label: "Assignments", path: "/admin/assignments", icon: ClipboardList },
        { label: "Exams", path: "/admin/exams", icon: FileEdit },
        { label: "Reports", path: "/admin/reports", icon: FileText },
        { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
        { label: "Visitor Analytics", path: "/admin/visitors", icon: Globe },
      ],
    },
    {
      title: "Communication",
      items: [
        { label: "Notices", path: "/admin/notices", icon: Bell },
        { label: "Feedback", path: "/admin/feedback", icon: MessageSquare },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Roles & Permissions", path: "/admin/roles", icon: ShieldCheck },
        { label: "Password Requests", path: "/admin/password-requests", icon: KeyRound },
        { label: "Audit Log", path: "/admin/audit-log", icon: ScrollText },
        { label: "Database Backup", path: "/admin/backup", icon: Database },
        { label: "Settings", path: "/admin/settings", icon: Settings },
      ],
    },
  ],
  TEACHER: [
    { items: [{ label: "Dashboard", path: "/teacher", icon: LayoutDashboard }] },
    {
      title: "Classes",
      items: [
        { label: "Attendance", path: "/teacher/attendance", icon: ClipboardCheck },
        { label: "Assignments", path: "/teacher/assignments", icon: ClipboardList },
        { label: "Study Material", path: "/teacher/materials", icon: Upload },
        { label: "Exams & Marks", path: "/teacher/marks", icon: FileEdit },
      ],
    },
    {
      title: "Insights",
      items: [
        { label: "Performance Analytics", path: "/teacher/analytics", icon: BarChart3 },
        { label: "Student Queries", path: "/teacher/queries", icon: HelpCircle },
      ],
    },
    {
      title: "Communication",
      items: [
        { label: "Announcements", path: "/teacher/notices", icon: Bell },
        { label: "Feedback", path: "/teacher/feedback", icon: MessageSquare },
      ],
    },
  ],
  STUDENT: [
    { items: [{ label: "Dashboard", path: "/student", icon: LayoutDashboard }] },
    {
      title: "Academics",
      items: [
        { label: "Attendance", path: "/student/attendance", icon: ClipboardCheck },
        { label: "Subjects", path: "/student/subjects", icon: BookOpen },
        { label: "Study Material", path: "/student/materials", icon: Upload },
        { label: "Assignments", path: "/student/assignments", icon: ClipboardList },
        { label: "Marks & Grades", path: "/student/marks", icon: Award },
        { label: "Performance & Rank", path: "/student/performance", icon: TrendingUp },
      ],
    },
    {
      title: "Communication",
      items: [
        { label: "Teacher Feedback", path: "/student/feedback", icon: MessageSquare },
        { label: "Query Teacher", path: "/student/queries", icon: HelpCircle },
        { label: "Announcements", path: "/student/notices", icon: Bell },
      ],
    },
  ],
};
