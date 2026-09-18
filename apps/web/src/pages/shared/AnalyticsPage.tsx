import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ScatterChart, Scatter, ZAxis } from "recharts";
import { AlertTriangle, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { GradeRing } from "@/components/ui/GradeRing";
import type { ClassOption, SemesterOption } from "@/types/academic";

interface ClassAnalytics {
  studentCount: number;
  avgAttendance: number;
  avgMarks: number;
  weakSubjects: Array<{ subjectId: string; subjectName: string; avgPercentage: number }>;
  strongSubjects: Array<{ subjectId: string; subjectName: string; avgPercentage: number }>;
  riskStudentCount: number;
  riskStudents: Array<{ studentId: string; fullName: string; rollNumber: string; attendancePercentage: number; avgMarksPercentage: number; reasons: string[] }>;
}
interface TopStudent { id: string; fullName: string; rollNumber: string; gpa: number; overallPercentage: number; rank: number }
interface AttendanceVsMarksPoint { studentId: string; fullName: string; attendancePercentage: number; avgMarksPercentage: number }

export function AnalyticsPage() {
  const [classId, setClassId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const { data: classes } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: async () => (await api.get("/academic/classes")).data.data as ClassOption[],
  });
  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => (await api.get("/academic/semesters")).data.data as SemesterOption[],
  });

  useEffect(() => {
    if (!classId && classes && classes.length > 0) setClassId(classes[0].id);
  }, [classes, classId]);
  useEffect(() => {
    if (!semesterId && semesters && semesters.length > 0) {
      setSemesterId((semesters.find((s) => s.isCurrent) ?? semesters[0]).id);
    }
  }, [semesters, semesterId]);

  const ready = Boolean(classId && semesterId);

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["analytics", "class", classId, semesterId],
    queryFn: async () => (await api.get(`/analytics/class/${classId}/${semesterId}`)).data.data as ClassAnalytics,
    enabled: ready,
  });

  const { data: topStudents, isLoading: loadingTop } = useQuery({
    queryKey: ["analytics", "top", classId, semesterId],
    queryFn: async () => (await api.get(`/analytics/top-students/${classId}/${semesterId}`, { params: { limit: 5 } })).data.data as TopStudent[],
    enabled: ready,
  });

  const { data: scatter, isLoading: loadingScatter } = useQuery({
    queryKey: ["analytics", "attendance-vs-marks", classId, semesterId],
    queryFn: async () =>
      (await api.get(`/analytics/attendance-vs-marks/${classId}/${semesterId}`)).data.data as AttendanceVsMarksPoint[],
    enabled: ready,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Analytics</h1>
          <p className="text-sm text-ink-muted mt-0.5">Performance insights by class and semester</p>
        </div>
        <div className="flex items-center gap-2">
          <Select className="w-52" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select className="w-52" value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
            {semesters?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
      </div>

      {!ready ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="flex flex-col items-center justify-center py-6">
              {loadingAnalytics ? <Skeleton className="h-20 w-20 rounded-full" /> : <GradeRing value={analytics?.avgAttendance ?? 0} label="Avg attendance" sublabel="%" size={92} />}
            </Card>
            <Card className="flex flex-col items-center justify-center py-6">
              {loadingAnalytics ? <Skeleton className="h-20 w-20 rounded-full" /> : <GradeRing value={analytics?.avgMarks ?? 0} label="Avg marks" sublabel="%" size={92} />}
            </Card>
            <Card className="flex flex-col items-center justify-center py-6 text-center">
              <p className="figure text-2xl font-semibold text-ink">{analytics?.studentCount ?? 0}</p>
              <p className="text-xs text-ink-muted mt-1">Students</p>
            </Card>
            <Card className="flex flex-col items-center justify-center py-6 text-center">
              <p className="figure text-2xl font-semibold text-danger">{analytics?.riskStudentCount ?? 0}</p>
              <p className="text-xs text-ink-muted mt-1">At risk</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Attendance vs. marks</CardTitle>
                  <CardDescription>Each point is one student</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loadingScatter ? (
                  <Skeleton className="h-64 w-full" />
                ) : !scatter || scatter.length === 0 ? (
                  <p className="text-sm text-ink-muted py-12 text-center">No data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                      <XAxis type="number" dataKey="attendancePercentage" name="Attendance %" domain={[0, 100]} tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} />
                      <YAxis type="number" dataKey="avgMarksPercentage" name="Marks %" domain={[0, 100]} tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} />
                      <ZAxis range={[60, 60]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12 }}
                        formatter={(value: number) => `${value}%`}
                      />
                      <Scatter data={scatter} fill="rgb(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Top students</CardTitle>
                  <CardDescription>Ranked by GPA this semester</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingTop ? (
                  <Skeleton className="h-48 w-full" />
                ) : !topStudents || topStudents.length === 0 ? (
                  <p className="text-sm text-ink-muted py-8 text-center">No marks published yet.</p>
                ) : (
                  topStudents.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        {s.rank <= 3 && <Trophy size={14} className="text-accent" />}
                        <div>
                          <p className="text-sm text-ink font-medium">{s.fullName}</p>
                          <p className="figure text-xs text-ink-muted">{s.rollNumber}</p>
                        </div>
                      </div>
                      <span className="figure text-sm text-ink-muted">GPA {s.gpa}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Weakest subjects</CardTitle></CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <Skeleton className="h-40 w-full" />
                ) : !analytics || analytics.weakSubjects.length === 0 ? (
                  <p className="text-sm text-ink-muted py-8 text-center">No marks published yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={analytics.weakSubjects} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} />
                      <YAxis type="category" dataKey="subjectName" width={120} tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} />
                      <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="avgPercentage" fill="rgb(var(--danger))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>At-risk students</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {loadingAnalytics ? (
                  <Skeleton className="h-40 w-full" />
                ) : !analytics || analytics.riskStudents.length === 0 ? (
                  <p className="text-sm text-ink-muted py-8 text-center">No students flagged — nice work.</p>
                ) : (
                  analytics.riskStudents.slice(0, 6).map((s) => (
                    <div key={s.studentId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-warning" />
                        <div>
                          <p className="text-sm text-ink">{s.fullName}</p>
                          <div className="flex gap-1 mt-0.5">
                            {s.reasons.map((r) => <Badge key={r} tone="warning">{r}</Badge>)}
                          </div>
                        </div>
                      </div>
                      <span className="figure text-xs text-ink-muted">{s.avgMarksPercentage}%</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
