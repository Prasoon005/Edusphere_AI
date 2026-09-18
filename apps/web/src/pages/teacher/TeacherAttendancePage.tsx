import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, FileWarning, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface TeacherProfile {
  subjectAssignments: Array<{ subject: { id: string; name: string } }>;
}
interface SectionOption {
  id: string;
  name: string;
  class: { name: string };
}
interface RosterRow {
  student: { id: string; fullName: string; rollNumber: string };
  attendance: { id: string; status: Status } | null;
}

const STATUS_CONFIG: Record<Status, { label: string; icon: typeof Check; tone: string }> = {
  PRESENT: { label: "Present", icon: Check, tone: "bg-positive/10 text-positive border-positive/30" },
  ABSENT: { label: "Absent", icon: X, tone: "bg-danger/10 text-danger border-danger/30" },
  LATE: { label: "Late", icon: Clock, tone: "bg-warning/10 text-warning border-warning/30" },
  EXCUSED: { label: "Excused", icon: FileWarning, tone: "bg-info/10 text-info border-info/30" },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TeacherAttendancePage() {
  const queryClient = useQueryClient();
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [marks, setMarks] = useState<Record<string, Status>>({});

  const { data: me } = useQuery({
    queryKey: ["teachers", "me"],
    queryFn: async () => (await api.get("/teachers/me")).data.data as TeacherProfile,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", "all"],
    queryFn: async () => (await api.get("/academic/sections")).data.data as SectionOption[],
  });

  const { data: roster, isLoading: loadingRoster } = useQuery({
    queryKey: ["attendance", "section", sectionId, subjectId, date],
    queryFn: async () =>
      (
        await api.get(`/attendance/section/${sectionId}`, { params: { subjectId, date } })
      ).data.data as RosterRow[],
    enabled: Boolean(sectionId && subjectId && date),
  });

  useEffect(() => {
    if (!roster) return;
    const initial: Record<string, Status> = {};
    for (const row of roster) {
      initial[row.student.id] = row.attendance?.status ?? "PRESENT";
    }
    setMarks(initial);
  }, [roster]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post("/attendance/mark", {
        subjectId,
        date,
        records: Object.entries(marks).map(([studentId, status]) => ({ studentId, status })),
      }),
    onSuccess: () => {
      toast.success("Attendance saved");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: () => toast.error("Failed to save attendance"),
  });

  const ready = Boolean(sectionId && subjectId && date);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Mark attendance</h1>
        <p className="text-sm text-ink-muted mt-0.5">Select a class, subject, and date to mark the roster.</p>
      </div>

      <Card>
        <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="section">Section</Label>
            <Select id="section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">Select a section</option>
              {sections?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.class.name} — {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Select id="subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Select a subject</option>
              {me?.subjectAssignments.map((sa) => (
                <option key={sa.subject.id} value={sa.subject.id}>
                  {sa.subject.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {ready && (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Roster</CardTitle>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || loadingRoster}>
              <Save size={15} />
              Save attendance
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {loadingRoster ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !roster || roster.length === 0 ? (
              <p className="text-sm text-ink-muted py-8 text-center">No students in this section.</p>
            ) : (
              roster.map((row) => (
                <div
                  key={row.student.id}
                  className="flex items-center justify-between gap-4 py-2.5 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={row.student.fullName} size={30} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{row.student.fullName}</p>
                      <p className="figure text-xs text-ink-muted">{row.student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => {
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      const active = marks[row.student.id] === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          title={config.label}
                          onClick={() => setMarks((prev) => ({ ...prev, [row.student.id]: status }))}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                            active ? config.tone : "border-border text-ink-muted hover:bg-surface-2"
                          )}
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
