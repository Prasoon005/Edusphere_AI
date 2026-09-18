import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList } from "lucide-react";

interface Overview {
  summary: {
    total: number;
    published: number;
    draft: number;
    closed: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    pendingSubmissions: number;
    lateSubmissions: number;
    avgScore: number;
  };
  byTeacher: Array<{ teacherId: string; teacherName: string; assignments: number; submissions: number; responseRate: number }>;
  bySubject: Array<{ subjectId: string; subjectName: string; assignments: number }>;
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-surface-2 px-4 py-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="figure text-lg font-semibold text-ink mt-0.5">{value}</p>
    </div>
  );
}

export function AdminAssignmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview", "assignments"],
    queryFn: async () => (await api.get("/admin-overview/assignments")).data.data as Overview,
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
        <h1 className="font-display text-xl font-semibold text-ink">Assignment analytics</h1>
        <p className="text-sm text-ink-muted mt-0.5">Cross-teacher assignment activity and submission rates.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Total assignments" value={data.summary.total} />
        <StatBlock label="Published" value={data.summary.published} />
        <StatBlock label="Drafts" value={data.summary.draft} />
        <StatBlock label="Avg score" value={data.summary.avgScore} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Total submissions" value={data.summary.totalSubmissions} />
        <StatBlock label="Graded" value={data.summary.gradedSubmissions} />
        <StatBlock label="Pending" value={data.summary.pendingSubmissions} />
        <StatBlock label="Late" value={data.summary.lateSubmissions} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Assignments by subject</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {data.bySubject.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No assignments yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.bySubject}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                <XAxis dataKey="subjectName" tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <RTooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="assignments" fill="rgb(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Teacher | Assignments | Submissions | Response %</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto scrollbar-thin">
          {data.byTeacher.length === 0 ? (
            <EmptyState title="No teacher activity yet" />
          ) : (
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-xs text-ink-muted border-b border-border">
                  <th className="py-2 font-medium">Teacher</th>
                  <th className="py-2 font-medium">Assignments</th>
                  <th className="py-2 font-medium">Submissions</th>
                  <th className="py-2 font-medium">Response %</th>
                </tr>
              </thead>
              <tbody>
                {data.byTeacher.map((t) => (
                  <tr key={t.teacherId} className="border-b border-border last:border-0">
                    <td className="py-2 text-ink">{t.teacherName}</td>
                    <td className="py-2 figure text-ink-muted">{t.assignments}</td>
                    <td className="py-2 figure text-ink-muted">{t.submissions}</td>
                    <td className="py-2 figure text-ink-muted">{t.responseRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
