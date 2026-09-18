import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from "recharts";
import { AlertTriangle, Users2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface Overview {
  summary: { total: number; present: number; absent: number; late: number; excused: number; overallPercentage: number };
  byClass: Array<{ classId: string; className: string; total: number; percentage: number }>;
  byTeacher: Array<{ teacherId: string; teacherName: string; recordsMarked: number }>;
  missingAttendance: Array<{ sectionId: string; sectionName: string }>;
  lowAttendanceStudents: Array<{ studentId: string; fullName: string; rollNumber: string; percentage: number }>;
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-surface-2 px-4 py-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="figure text-lg font-semibold text-ink mt-0.5">{value}</p>
    </div>
  );
}

export function AdminAttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview", "attendance"],
    queryFn: async () => (await api.get("/admin-overview/attendance")).data.data as Overview,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Attendance overview</h1>
        <p className="text-sm text-ink-muted mt-0.5">Institution-wide attendance, powered by live records.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatBlock label="Overall %" value={`${data.summary.overallPercentage}%`} />
        <StatBlock label="Present" value={data.summary.present} />
        <StatBlock label="Absent" value={data.summary.absent} />
        <StatBlock label="Late" value={data.summary.late} />
        <StatBlock label="Excused" value={data.summary.excused} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Attendance % by class</CardTitle>
            <CardDescription>Higher is better</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {data.byClass.length === 0 ? (
            <EmptyState title="No attendance records yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byClass}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                <XAxis dataKey="className" tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} />
                <RTooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="percentage" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Who's marking attendance</CardTitle>
              <CardDescription>Teacher activity</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.byTeacher.length === 0 ? (
              <EmptyState icon={Users2} title="No activity yet" />
            ) : (
              data.byTeacher.map((t) => (
                <div key={t.teacherId} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="text-ink">{t.teacherName}</span>
                  <span className="figure text-ink-muted">{t.recordsMarked} records</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Missing attendance</CardTitle>
              <CardDescription>Sections with no records in the last 7 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.missingAttendance.length === 0 ? (
              <p className="text-sm text-positive py-4 text-center">All sections are up to date.</p>
            ) : (
              data.missingAttendance.map((m) => (
                <div key={m.sectionId} className="flex items-center gap-2 text-sm py-1.5 border-b border-border last:border-0">
                  <AlertTriangle size={13} className="text-warning shrink-0" />
                  <span className="text-ink">{m.sectionName}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Students with low attendance</CardTitle>
            <CardDescription>Below 75%</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.lowAttendanceStudents.length === 0 ? (
            <p className="text-sm text-positive py-4 text-center">No students below the threshold.</p>
          ) : (
            data.lowAttendanceStudents.map((s) => (
              <div key={s.studentId} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="text-ink">{s.fullName} <span className="text-ink-muted figure">#{s.rollNumber}</span></span>
                <Badge tone="danger">{s.percentage}%</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
