import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  ShieldCheck,
  Users,
  ArrowLeft,
  ClipboardCheck,
  FileText,
  Award,
  BarChart3,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GradeRing } from "@/components/ui/GradeRing";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

type DemoRole = "SUPER_ADMIN" | "TEACHER" | "STUDENT";

const tabs: Array<{ key: DemoRole; label: string; icon: typeof ShieldCheck }> = [
  { key: "SUPER_ADMIN", label: "Administrator", icon: ShieldCheck },
  { key: "TEACHER", label: "Teacher", icon: Users },
  { key: "STUDENT", label: "Student", icon: GraduationCap },
];

// Purely illustrative, static demo data — no protected API calls of any kind.
const demoContent: Record<DemoRole, { stats: Array<{ label: string; value: string; icon: typeof ClipboardCheck }>; highlight: string }> = {
  SUPER_ADMIN: {
    stats: [
      { label: "Total students", value: "842", icon: GraduationCap },
      { label: "Total teachers", value: "56", icon: Users },
      { label: "Attendance rate", value: "94%", icon: ClipboardCheck },
      { label: "Active notices", value: "12", icon: Bell },
    ],
    highlight: "Administrators get institution-wide analytics, attendance oversight, exam performance, and full user management — all from one dashboard.",
  },
  TEACHER: {
    stats: [
      { label: "My classes", value: "4", icon: Users },
      { label: "Assignments graded", value: "38", icon: FileText },
      { label: "Avg. class score", value: "82%", icon: Award },
      { label: "Pending queries", value: "3", icon: Bell },
    ],
    highlight: "Teachers manage attendance, publish assignments, grade submissions, schedule exams, and respond to student queries — all in one place.",
  },
  STUDENT: {
    stats: [
      { label: "Attendance", value: "91%", icon: ClipboardCheck },
      { label: "Assignments due", value: "2", icon: FileText },
      { label: "Current GPA", value: "8.4", icon: Award },
      { label: "Class rank", value: "#5", icon: BarChart3 },
    ],
    highlight: "Students track attendance, submit assignments, view marks and exam schedules, and message teachers directly with questions.",
  },
};

export function ExplorePage() {
  useVisitorTracking();
  const [activeTab, setActiveTab] = useState<DemoRole>("SUPER_ADMIN");
  const content = demoContent[activeTab];

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={15} /> Back to home
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted mb-4">
            Visitor preview — read-only, no account needed
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">Explore EduSphere AI</h1>
          <p className="text-sm text-ink-muted mt-2 max-w-lg mx-auto">
            A look at what each role sees. All figures below are illustrative — sign in to see your real data.
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface text-ink-muted border-border hover:text-ink"
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {content.stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                    <s.icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">{s.label}</p>
                    <p className="figure text-lg font-semibold text-ink">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>What {tabs.find((t) => t.key === activeTab)?.label.toLowerCase()}s can do</CardTitle>
                <CardDescription>A preview, not your real account data</CardDescription>
              </div>
              <Badge tone="primary">Demo</Badge>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
              <GradeRing value={activeTab === "STUDENT" ? 84 : activeTab === "TEACHER" ? 82 : 94} label="Illustrative" sublabel="%" />
              <p className="text-sm text-ink-muted flex-1">{content.highlight}</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="text-center mt-10">
          <Link to="/login">
            <Button size="lg">Sign in to get started</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
