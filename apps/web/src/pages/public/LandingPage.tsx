import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  ShieldCheck,
  BarChart3,
  ClipboardCheck,
  Bell,
  FileText,
  MessageSquare,
  Users,
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const roles = [
  {
    icon: ShieldCheck,
    title: "Administrator",
    points: ["Institution management", "Analytics & reports", "Attendance oversight", "Exam management", "User management"],
  },
  {
    icon: Users,
    title: "Teacher",
    points: ["Classes & attendance", "Assignments & grading", "Exams & marks", "Student interaction", "Performance analytics"],
  },
  {
    icon: GraduationCap,
    title: "Student",
    points: ["Attendance tracking", "Assignments & deadlines", "Marks & exams", "Study material", "Ask questions"],
  },
];

const features = [
  { icon: ClipboardCheck, label: "Attendance" },
  { icon: FileText, label: "Assignments" },
  { icon: Award, label: "Exams" },
  { icon: BarChart3, label: "Analytics" },
  { icon: FileText, label: "Reports" },
  { icon: Bell, label: "Notifications" },
  { icon: MessageSquare, label: "Communication" },
  { icon: ShieldCheck, label: "Security" },
];

export function LandingPage() {
  useVisitorTracking();

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-border bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap size={17} />
            </div>
            <span className="font-display font-semibold text-ink">EduSphere AI</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/explore">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">Explore</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted mb-6">
            <Sparkles size={12} className="text-accent" /> Modern academic management, reimagined
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-ink tracking-tight text-balance">
            Welcome to EduSphere AI
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ink-muted max-w-2xl mx-auto text-balance">
            A single, secure home for attendance, assignments, exams, and communication —
            built for administrators, teachers, and students alike.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/explore">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Explore EduSphere <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto">Sign In</Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16"
        >
          <GlassCard className="mx-auto max-w-4xl p-6 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Attendance rate", value: "94%" },
                { label: "Assignments graded", value: "1.2k" },
                { label: "Active classes", value: "38" },
                { label: "Avg. response", value: "<2h" },
              ].map((stat) => (
                <div key={stat.label} className="text-left">
                  <p className="figure text-2xl font-semibold text-ink">{stat.value}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Why EduSphere */}
      <section className="mx-auto max-w-6xl px-5 py-16 border-t border-border">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">Why EduSphere?</h2>
          <p className="mt-3 text-sm sm:text-base text-ink-muted">
            Most academic platforms feel like a stack of disconnected spreadsheets. EduSphere AI unifies
            attendance, grading, communication, and analytics into one consistent, secure system —
            so administrators spend less time reconciling data and more time supporting students.
          </p>
        </motion.div>
      </section>

      {/* Built for everyone */}
      <section className="mx-auto max-w-6xl px-5 py-16 border-t border-border">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="font-display text-2xl sm:text-3xl font-semibold text-ink text-center mb-10"
        >
          Built for Everyone
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.1 }}
            >
              <div className="h-full rounded-xl border border-border bg-surface p-6 shadow-soft hover:shadow-popover hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <role.icon size={20} />
                </div>
                <h3 className="font-display text-base font-semibold text-ink">{role.title}</h3>
                <ul className="mt-3 space-y-1.5">
                  {role.points.map((p) => (
                    <li key={p} className="text-sm text-ink-muted flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-ink-muted shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Core features */}
      <section className="mx-auto max-w-6xl px-5 py-16 border-t border-border">
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="font-display text-2xl sm:text-3xl font-semibold text-ink text-center mb-10">
          Core Features
        </motion.h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-surface p-5 text-center hover:border-primary/40 transition-colors"
            >
              <f.icon size={20} className="mx-auto text-primary mb-2" />
              <p className="text-sm font-medium text-ink">{f.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16 border-t border-border">
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="font-display text-2xl sm:text-3xl font-semibold text-ink text-center mb-10">
          How EduSphere Works
        </motion.h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2">
          {["Admin", "Teacher", "Student"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink shadow-soft">
                {step}
              </div>
              {i < 2 && <ArrowRight size={16} className="text-ink-muted hidden sm:block" />}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-ink-muted mt-6 max-w-xl mx-auto">
          Admins set up classes and teachers; teachers run attendance, assignments, and exams;
          students engage, submit, and track their own progress — all synced in real time.
        </p>
      </section>

      {/* Explore as visitor */}
      <section className="mx-auto max-w-6xl px-5 py-16 border-t border-border">
        <GlassCard className="p-8 sm:p-12 text-center">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink">Not ready to sign in?</h2>
          <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto">
            Explore a read-only preview of EduSphere AI's dashboards for each role — no account required.
          </p>
          <Link to="/explore">
            <Button size="lg" variant="outline" className="mt-6">
              Explore EduSphere <ArrowRight size={16} />
            </Button>
          </Link>
        </GlassCard>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 border-t border-border text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">Ready to transform academic management?</h2>
        <Link to="/login">
          <Button size="lg" className="mt-6">Get Started</Button>
        </Link>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap size={14} />
            </div>
            <span className="font-display font-semibold text-sm text-ink">EduSphere AI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-muted">
            <Link to="/explore" className="hover:text-ink">Product</Link>
            <span>Features</span>
            <span>Roles</span>
            <span>Contact</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
          <p className="text-xs text-ink-muted">© {new Date().getFullYear()} EduSphere AI</p>
        </div>
      </footer>
    </div>
  );
}
