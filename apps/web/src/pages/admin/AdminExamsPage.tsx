import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileEdit } from "lucide-react";

interface Overview {
  summary: {
    total: number;
    upcoming: number;
    completed: number;
    avgMarksPercentage: number;
    passPercentage: number;
    failPercentage: number;
    participants: number;
  };
  gradeDistribution: Record<string, number>;
  byTeacher: Array<{ teacherId: string; teacherName: string; exams: number }>;
  bySubject: Array<{ subjectId: string; subjectName: string; avgPercentage: number; count: number }>;
}

const COLORS = ["#3730A3", "#B48A20", "#0D9488", "#B45309", "#DC2626", "#2563EB", "#8D85EB"];

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-surface-2 px-4 py-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="figure text-lg font-semibold text-ink mt-0.5">{value}</p>
    </div>
  );
}

export function AdminExamsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview", "exams"],
    queryFn: async () => (await api.get("/admin-overview/exams")).data.data as Overview,
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

  const gradeData = Object.entries(data.gradeDistribution).map(([grade, count]) => ({ grade, count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Exam analytics</h1>
        <p className="text-sm text-ink-muted mt-0.5">Pass rates, grade distribution and cross-teacher exam activity.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Total exams" value={data.summary.total} />
        <StatBlock label="Upcoming" value={data.summary.upcoming} />
        <StatBlock label="Pass %" value={`${data.summary.passPercentage}%`} />
        <StatBlock label="Fail %" value={`${data.summary.failPercentage}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Grade distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {gradeData.length === 0 ? (
              <EmptyState icon={FileEdit} title="No marks entered yet" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={gradeData} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={80} label>
                    {gradeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Average % by subject</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.bySubject.length === 0 ? (
              <EmptyState title="No subject data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.bySubject}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                  <XAxis dataKey="subjectName" tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="avgPercentage" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Exams by teacher</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.byTeacher.length === 0 ? (
            <EmptyState title="No exams yet" />
          ) : (
            data.byTeacher.map((t) => (
              <div key={t.teacherId} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="text-ink">{t.teacherName}</span>
                <span className="figure text-ink-muted">{t.exams} exams</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
