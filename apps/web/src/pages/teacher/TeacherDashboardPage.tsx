import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardList, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: { name: string };
  section: { name: string; class: { name: string } };
}

interface TeacherProfile {
  fullName: string;
  subjectAssignments: Array<{ subject: { id: string; name: string; code: string } }>;
}

interface Assignment {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  subject: { name: string };
  _count: { submissions: number };
}

export function TeacherDashboardPage() {
  const { data: me } = useQuery({
    queryKey: ["teachers", "me"],
    queryFn: async () => (await api.get("/teachers/me")).data.data as TeacherProfile,
  });

  const { data: timetable, isLoading: loadingTimetable } = useQuery({
    queryKey: ["timetable", "me"],
    queryFn: async () => (await api.get("/academic/timetable/me")).data.data as TimetableSlot[],
  });

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments", "mine"],
    queryFn: async () =>
      (await api.get("/assignments", { params: { page: 1, limit: 5, sortOrder: "desc" } })).data.data as Assignment[],
  });

  const { data: openQueriesMeta } = useQuery({
    queryKey: ["queries", "teacher", "count"],
    queryFn: async () =>
      (await api.get("/queries/teacher", { params: { status: "OPEN", page: 1, limit: 1 } })).data.meta.total as number,
  });

  const today = new Date().getDay();
  const todaysSlots = (timetable ?? []).filter((s) => s.dayOfWeek === today).sort((a, b) => (a.startTime > b.startTime ? 1 : -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Welcome back{me ? `, ${me.fullName.split(" ")[0]}` : ""}</h1>
        <p className="text-sm text-ink-muted mt-0.5">Here's what's happening in your classes today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Subjects taught</p>
              <p className="figure text-xl font-semibold text-ink">{me?.subjectAssignments.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
              <ClipboardList size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Classes today</p>
              <p className="figure text-xl font-semibold text-ink">{todaysSlots.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-warning/10 text-warning">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Open student queries</p>
              <p className="figure text-xl font-semibold text-ink">{openQueriesMeta ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Today's schedule</CardTitle>
              <CardDescription>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingTimetable ? (
              <Skeleton className="h-32 w-full" />
            ) : todaysSlots.length === 0 ? (
              <p className="text-sm text-ink-muted py-8 text-center">No classes scheduled for today.</p>
            ) : (
              todaysSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{slot.subject.name}</p>
                    <p className="text-xs text-ink-muted">
                      {slot.section.class.name} — Section {slot.section.name}
                      {slot.room ? ` · ${slot.room}` : ""}
                    </p>
                  </div>
                  <span className="figure text-xs text-ink-muted">
                    {slot.startTime}–{slot.endTime}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent assignments</CardTitle>
              <CardDescription>Your latest published and draft work</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingAssignments ? (
              <Skeleton className="h-32 w-full" />
            ) : !assignments || assignments.length === 0 ? (
              <p className="text-sm text-ink-muted py-8 text-center">No assignments created yet.</p>
            ) : (
              assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{a.title}</p>
                    <p className="text-xs text-ink-muted">{a.subject.name} · {a._count.submissions} submissions</p>
                  </div>
                  <Badge tone={a.status === "PUBLISHED" ? "positive" : "neutral"}>{a.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
