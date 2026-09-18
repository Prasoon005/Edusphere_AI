import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { GradeRing } from "@/components/ui/GradeRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface AttendanceStats {
  overallPercentage: number;
  totalClasses: number;
}

interface CgpaResponse {
  cgpa: number;
  semesters: Array<{ semesterName: string; gpa: number }>;
}

interface AssignmentWithSubmission {
  id: string;
  title: string;
  dueDate: string;
  subject: { name: string };
  mySubmission: { status: string } | null;
}

export function StudentDashboardPage() {
  const { user } = useAuth();
  const fullName = (user?.profile?.fullName as string) ?? user?.email ?? "";

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ["attendance", "me", "stats"],
    queryFn: async () => (await api.get("/attendance/me/stats")).data.data as AttendanceStats,
  });

  const { data: cgpa, isLoading: loadingCgpa } = useQuery({
    queryKey: ["exams", "cgpa", "me"],
    queryFn: async () => (await api.get("/exams/cgpa/me")).data.data as CgpaResponse,
  });

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments", "upcoming"],
    queryFn: async () =>
      (await api.get("/assignments", { params: { page: 1, limit: 5 } })).data.data as AssignmentWithSubmission[],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Hi{fullName ? `, ${fullName.split(" ")[0]}` : ""}</h1>
        <p className="text-sm text-ink-muted mt-0.5">Here's how things are looking this semester.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center justify-center py-6">
          {loadingAttendance ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <GradeRing value={attendance?.overallPercentage ?? 0} label="Attendance" sublabel="%" size={104} />
          )}
        </Card>
        <Card className="flex items-center justify-center py-6">
          {loadingCgpa ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <GradeRing value={(cgpa?.cgpa ?? 0) * 10} label="CGPA" sublabel={String(cgpa?.cgpa ?? 0)} size={104} />
          )}
        </Card>
        <Card className="flex items-center justify-center py-6">
          {loadingAttendance ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <GradeRing
              value={
                assignments && assignments.length > 0
                  ? (assignments.filter((a) => a.mySubmission).length / assignments.length) * 100
                  : 0
              }
              label="Assignments submitted"
              sublabel="%"
              size={104}
            />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Upcoming assignments</CardTitle>
            <CardDescription>Published work for your class</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingAssignments ? (
            <Skeleton className="h-32 w-full" />
          ) : !assignments || assignments.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">No assignments right now — check back soon.</p>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{a.title}</p>
                  <p className="text-xs text-ink-muted">
                    {a.subject.name} · due {new Date(a.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge tone={a.mySubmission ? "positive" : "warning"}>
                  {a.mySubmission ? a.mySubmission.status : "Not submitted"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
