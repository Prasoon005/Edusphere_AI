import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Users, GraduationCap, Layers, Bell } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { GradeRing } from "@/components/ui/GradeRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

interface ClassSummary {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string; capacity: number }>;
  _count: { students: number };
}

interface SectionDetail {
  id: string;
  capacity: number;
  classTeacher: { id: string } | null;
  _count: { students: number };
}

interface Notice {
  id: string;
  title: string;
  content: string;
  audience: string;
  publishedAt: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-ink-muted">{label}</p>
          {loading ? (
            <Skeleton className="h-6 w-16 mt-1" />
          ) : (
            <p className="figure text-xl font-semibold text-ink">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { data: studentsMeta, isLoading: loadingStudents } = useQuery({
    queryKey: ["students", "count"],
    queryFn: async () => (await api.get("/students", { params: { page: 1, limit: 1 } })).data.meta.total as number,
  });

  const { data: teachersMeta, isLoading: loadingTeachers } = useQuery({
    queryKey: ["teachers", "count"],
    queryFn: async () => (await api.get("/teachers", { params: { page: 1, limit: 1 } })).data.meta.total as number,
  });

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: async () => (await api.get("/academic/classes")).data.data as ClassSummary[],
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", "all"],
    queryFn: async () => (await api.get("/academic/sections")).data.data as SectionDetail[],
  });

  const { data: notices, isLoading: loadingNotices } = useQuery({
    queryKey: ["notices", "recent"],
    queryFn: async () => (await api.get("/notices", { params: { page: 1, limit: 5 } })).data.data as Notice[],
  });

  const totalCapacity = sections?.reduce((sum, s) => sum + s.capacity, 0) ?? 0;
  const totalEnrolled = sections?.reduce((sum, s) => sum + s._count.students, 0) ?? 0;
  const capacityUtilization = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

  const sectionsWithTeacher = sections?.filter((s) => s.classTeacher).length ?? 0;
  const teacherCoverage = sections && sections.length > 0 ? (sectionsWithTeacher / sections.length) * 100 : 0;

  const chartData = classes?.map((c) => ({ name: c.name, students: c._count.students })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted mt-0.5">A live overview of EduSphere AI.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Total Students" value={studentsMeta ?? 0} loading={loadingStudents} />
        <StatCard icon={Users} label="Total Teachers" value={teachersMeta ?? 0} loading={loadingTeachers} />
        <StatCard icon={Layers} label="Total Classes" value={classes?.length ?? 0} loading={loadingClasses} />
        <StatCard icon={Bell} label="Active Notices" value={notices?.length ?? 0} loading={loadingNotices} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Students per class</CardTitle>
              <CardDescription>Current enrollment across all classes</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loadingClasses ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length === 0 ? (
              <p className="text-sm text-ink-muted py-12 text-center">No classes have been created yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgb(var(--surface))",
                      border: "1px solid rgb(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="students" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Operational health</CardTitle>
              <CardDescription>Section-level coverage</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-around pt-2">
            <GradeRing value={capacityUtilization} label="Seats filled" sublabel="%" />
            <GradeRing value={teacherCoverage} label="Sections with a class teacher" sublabel="%" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent notices</CardTitle>
            <CardDescription>Latest announcements published across EduSphere AI</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingNotices ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : !notices || notices.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">No notices have been published yet.</p>
          ) : (
            notices.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{n.title}</p>
                  <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{n.content}</p>
                </div>
                <Badge tone="primary" className="shrink-0">
                  {n.audience}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
