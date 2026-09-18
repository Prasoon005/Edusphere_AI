import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { GradeRing } from "@/components/ui/GradeRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import type { SemesterOption } from "@/types/academic";

interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  credits: number;
  weightedPercentage: number;
  grade: string;
  gradePoints: number;
}
interface SemesterReport {
  student: { fullName: string; rollNumber: string };
  subjects: SubjectResult[];
  gpa: number;
  overallPercentage: number;
  rank: number | null;
  classSize: number;
}

function gradeTone(grade: string): "positive" | "primary" | "warning" | "danger" {
  if (grade === "A+" || grade === "A") return "positive";
  if (grade === "B+" || grade === "B") return "primary";
  if (grade === "C+" || grade === "C" || grade === "D") return "warning";
  return "danger";
}

export function StudentMarksPage() {
  const [semesterId, setSemesterId] = useState("");

  const { data: semesters } = useQuery({
    queryKey: ["semesters", "all"],
    queryFn: async () => (await api.get("/academic/semesters")).data.data as SemesterOption[],
  });

  useEffect(() => {
    if (!semesterId && semesters && semesters.length > 0) {
      const current = semesters.find((s) => s.isCurrent) ?? semesters[0];
      setSemesterId(current.id);
    }
  }, [semesters, semesterId]);

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ["marks", "report", "me", semesterId],
    queryFn: async () => (await api.get(`/exams/report/me/${semesterId}`)).data.data as SemesterReport,
    enabled: Boolean(semesterId),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Marks & grades</h1>
          <p className="text-sm text-ink-muted mt-0.5">Your semester performance report.</p>
        </div>
        <Select className="w-56" value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
          {semesters?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.academicYear.name})
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex flex-col items-center justify-center py-6">
          {loadingReport ? <Skeleton className="h-24 w-24 rounded-full" /> : <GradeRing value={(report?.gpa ?? 0) * 10} label="GPA" sublabel={String(report?.gpa ?? 0)} size={104} />}
        </Card>
        <Card className="flex flex-col items-center justify-center py-6">
          {loadingReport ? <Skeleton className="h-24 w-24 rounded-full" /> : <GradeRing value={report?.overallPercentage ?? 0} label="Overall score" sublabel="%" size={104} />}
        </Card>
        <Card className="flex flex-col items-center justify-center py-6 text-center">
          <p className="figure text-3xl font-semibold text-ink">{report?.rank ?? "—"}</p>
          <p className="text-xs text-ink-muted mt-1">Rank of {report?.classSize ?? 0}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Subject-wise performance</CardTitle>
            <CardDescription>Weighted across all exams for this semester</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loadingReport ? (
            <Skeleton className="h-48 w-full" />
          ) : !report || report.subjects.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">No marks published for this semester yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-ink-muted">
                    <th className="py-2 font-medium">Subject</th>
                    <th className="py-2 font-medium">Credits</th>
                    <th className="py-2 font-medium">Score</th>
                    <th className="py-2 font-medium">Grade</th>
                    <th className="py-2 font-medium">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {report.subjects.map((s) => (
                    <tr key={s.subjectId} className="border-b border-border last:border-0">
                      <td className="py-2.5">
                        <p className="text-ink font-medium">{s.subjectName}</p>
                        <p className="figure text-xs text-ink-muted">{s.subjectCode}</p>
                      </td>
                      <td className="py-2.5 figure text-ink-muted">{s.credits}</td>
                      <td className="py-2.5 figure text-ink-muted">{s.weightedPercentage}%</td>
                      <td className="py-2.5">
                        <Badge tone={gradeTone(s.grade)}>{s.grade}</Badge>
                      </td>
                      <td className="py-2.5 figure text-ink-muted">{s.gradePoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
