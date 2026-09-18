import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { GradeRing } from "@/components/ui/GradeRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

interface SubjectStat {
  subjectId: string;
  subjectName: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}
interface AttendanceStats {
  overallPercentage: number;
  totalClasses: number;
  perSubject: SubjectStat[];
}
interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  subject: { name: string };
}

export function StudentAttendancePage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["attendance", "me", "stats"],
    queryFn: async () => (await api.get("/attendance/me/stats")).data.data as AttendanceStats,
  });

  const { data: records, isLoading: loadingRecords } = useQuery({
    queryKey: ["attendance", "me", "records"],
    queryFn: async () => (await api.get("/attendance/me")).data.data as AttendanceRecord[],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Attendance</h1>
        <p className="text-sm text-ink-muted mt-0.5">Your attendance record across all subjects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="flex flex-col items-center justify-center py-8">
          {loadingStats ? (
            <Skeleton className="h-28 w-28 rounded-full" />
          ) : (
            <GradeRing value={stats?.overallPercentage ?? 0} label="Overall attendance" sublabel="%" size={120} />
          )}
          <p className="text-xs text-ink-muted mt-3">{stats?.totalClasses ?? 0} classes recorded</p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>By subject</CardTitle>
              <CardDescription>Present + late counts as attended</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStats ? (
              <Skeleton className="h-32 w-full" />
            ) : !stats || stats.perSubject.length === 0 ? (
              <p className="text-sm text-ink-muted py-8 text-center">No attendance recorded yet.</p>
            ) : (
              stats.perSubject.map((s) => (
                <div key={s.subjectId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink font-medium">{s.subjectName}</span>
                    <span className="figure text-ink-muted">{s.percentage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.percentage >= 75 ? "bg-positive" : "bg-danger"}`}
                      style={{ width: `${Math.min(100, s.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent history</CardTitle>
            <CardDescription>Your last recorded classes</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {loadingRecords ? (
            <Skeleton className="h-40 w-full" />
          ) : !records || records.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">No attendance history yet.</p>
          ) : (
            records.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm text-ink">{r.subject.name}</p>
                  <p className="figure text-xs text-ink-muted">{new Date(r.date).toLocaleDateString()}</p>
                </div>
                <Badge
                  tone={r.status === "PRESENT" ? "positive" : r.status === "LATE" ? "warning" : r.status === "EXCUSED" ? "info" : "danger"}
                >
                  {r.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
