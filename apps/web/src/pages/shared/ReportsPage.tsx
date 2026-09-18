import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { FileText, FileSpreadsheet, FileDown, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input, Label } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import type { ClassOption, SemesterOption } from "@/types/academic";

interface StudentOption { id: string; fullName: string; rollNumber: string }
interface ReportRecord {
  id: string;
  type: string;
  format: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

const FORMAT_ICON = { PDF: FileText, EXCEL: FileSpreadsheet, CSV: FileDown } as const;

function ReportCardTab() {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const { data: classes } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: async () => (await api.get("/academic/classes")).data.data as ClassOption[],
  });
  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => (await api.get("/academic/semesters")).data.data as SemesterOption[],
  });
  const { data: students } = useQuery({
    queryKey: ["students", "by-class", classId],
    queryFn: async () => (await api.get("/students", { params: { classId, limit: 100 } })).data.data as StudentOption[],
    enabled: Boolean(classId),
  });

  const mutation = useMutation({
    mutationFn: () => api.post(`/reports/report-card/${studentId}/${semesterId}`),
    onSuccess: () => {
      toast.success("Report card generated");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to generate report card");
    },
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <Label>Class</Label>
        <Select value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(""); }}>
          <option value="">Select</option>
          {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Student</Label>
        <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!classId}>
          <option value="">Select</option>
          {students?.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
        </Select>
      </div>
      <div>
        <Label>Semester</Label>
        <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
          <option value="">Select</option>
          {semesters?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-3">
        <Button disabled={!studentId || !semesterId || mutation.isPending} onClick={() => mutation.mutate()}>
          <FileText size={15} /> Generate PDF report card
        </Button>
      </div>
    </div>
  );
}

function ClassMarksTab() {
  const queryClient = useQueryClient();
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

  const mutation = useMutation({
    mutationFn: () => api.post(`/reports/class-marks/${classId}/${semesterId}`),
    onSuccess: () => {
      toast.success("Marks report generated");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: () => toast.error("Failed to generate marks report"),
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <Label>Class</Label>
        <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select</option>
          {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Semester</Label>
        <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
          <option value="">Select</option>
          {semesters?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-3">
        <Button disabled={!classId || !semesterId || mutation.isPending} onClick={() => mutation.mutate()}>
          <FileSpreadsheet size={15} /> Generate Excel marks report
        </Button>
      </div>
    </div>
  );
}

function AttendanceReportTab() {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: classes } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: async () => (await api.get("/academic/classes")).data.data as ClassOption[],
  });

  const mutation = useMutation({
    mutationFn: () => api.post("/reports/attendance", null, { params: { classId, from, to } }),
    onSuccess: () => {
      toast.success("Attendance report generated");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: () => toast.error("Failed to generate attendance report"),
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <Label>Class</Label>
        <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select</option>
          {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>From</Label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div>
        <Label>To</Label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="sm:col-span-3">
        <Button disabled={!classId || !from || !to || mutation.isPending} onClick={() => mutation.mutate()}>
          <FileDown size={15} /> Generate CSV attendance report
        </Button>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [tab, setTab] = useState<"card" | "marks" | "attendance">("card");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => (await api.get("/reports", { params: { page: 1, limit: 20 } })).data.data as ReportRecord[],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Reports</h1>
        <p className="text-sm text-ink-muted mt-0.5">Generate and download official reports</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-1 border-b border-border -mb-3 w-full">
            {(["card", "marks", "attendance"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {t === "card" ? "Report card" : t === "marks" ? "Class marks" : "Attendance"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {tab === "card" && <ReportCardTab />}
          {tab === "marks" && <ClassMarksTab />}
          {tab === "attendance" && <AttendanceReportTab />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Generated reports</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !reports || reports.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">No reports generated yet.</p>
          ) : (
            reports.map((r) => {
              const Icon = FORMAT_ICON[r.format as keyof typeof FORMAT_ICON] ?? FileText;
              return (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className="text-ink-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{r.title}</p>
                      <p className="text-xs text-ink-muted">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone="neutral">{r.format}</Badge>
                    <a href={r.fileUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm"><Download size={13} /></Button>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
