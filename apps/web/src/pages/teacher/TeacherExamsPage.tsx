import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Plus, FileEdit, Save } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface Subject { id: string; name: string }
interface Semester { id: string; name: string; isCurrent: boolean }
interface SectionOption { id: string; name: string; class: { name: string } }
interface Exam {
  id: string;
  name: string;
  type: string;
  maxMarks: number;
  examDate: string;
  subject: { id: string; name: string };
  semester: { name: string };
}
interface RosterStudent {
  id: string;
  fullName: string;
  rollNumber: string;
}

const EXAM_TYPES = ["INTERNAL", "EXTERNAL", "QUIZ", "LAB", "PRACTICAL", "VIVA", "MIDTERM", "FINAL"];

const examSchema = z.object({
  name: z.string().min(1, "Required"),
  type: z.enum(EXAM_TYPES as [string, ...string[]]),
  subjectId: z.string().min(1, "Required"),
  semesterId: z.string().min(1, "Required"),
  maxMarks: z.coerce.number().positive(),
  weightage: z.coerce.number().positive(),
  examDate: z.string().min(1, "Required"),
});
type ExamFormValues = z.infer<typeof examSchema>;

function CreateExamDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/academic/subjects")).data.data as Subject[],
    enabled: open,
  });
  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => (await api.get("/academic/semesters")).data.data as Semester[],
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: { name: "", type: "INTERNAL", subjectId: "", semesterId: "", maxMarks: 100, weightage: 1, examDate: "" },
  });

  useEffect(() => {
    if (open) reset({ name: "", type: "INTERNAL", subjectId: "", semesterId: "", maxMarks: 100, weightage: 1, examDate: "" });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: ExamFormValues) => api.post("/exams", values),
    onSuccess: () => {
      toast.success("Exam created");
      queryClient.invalidateQueries({ queryKey: ["exams", "teacher"] });
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to create exam");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Create exam">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="name">Exam name</Label>
          <Input id="name" placeholder="e.g. Midterm — Data Structures" {...register("name")} />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select id="type" {...register("type")}>
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="examDate">Date</Label>
            <Input id="examDate" type="date" {...register("examDate")} />
            {errors.examDate && <p className="text-xs text-danger mt-1">{errors.examDate.message}</p>}
          </div>
          <div>
            <Label htmlFor="subjectId">Subject</Label>
            <Select id="subjectId" {...register("subjectId")}>
              <option value="">Select</option>
              {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            {errors.subjectId && <p className="text-xs text-danger mt-1">{errors.subjectId.message}</p>}
          </div>
          <div>
            <Label htmlFor="semesterId">Semester</Label>
            <Select id="semesterId" {...register("semesterId")}>
              <option value="">Select</option>
              {semesters?.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? " (current)" : ""}</option>)}
            </Select>
            {errors.semesterId && <p className="text-xs text-danger mt-1">{errors.semesterId.message}</p>}
          </div>
          <div>
            <Label htmlFor="maxMarks">Max marks</Label>
            <Input id="maxMarks" type="number" min={1} {...register("maxMarks")} />
          </div>
          <div>
            <Label htmlFor="weightage">Weightage</Label>
            <Input id="weightage" type="number" step="0.1" min={0.1} {...register("weightage")} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>Create exam</Button>
        </div>
      </form>
    </Dialog>
  );
}

function MarksEntryPanel({ exam }: { exam: Exam }) {
  const queryClient = useQueryClient();
  const [sectionId, setSectionId] = useState("");
  const [marks, setMarks] = useState<Record<string, { marksObtained: string; graceMarks: string }>>({});

  const { data: sections } = useQuery({
    queryKey: ["sections", "all"],
    queryFn: async () => (await api.get("/academic/sections")).data.data as SectionOption[],
  });

  const { data: roster, isLoading: loadingRoster } = useQuery({
    queryKey: ["students", "section-roster", sectionId],
    queryFn: async () =>
      (await api.get("/students", { params: { sectionId, limit: 100 } })).data.data as RosterStudent[],
    enabled: Boolean(sectionId),
  });

  useEffect(() => {
    if (!roster) return;
    setMarks((prev) => {
      const next = { ...prev };
      for (const s of roster) {
        if (!next[s.id]) next[s.id] = { marksObtained: "", graceMarks: "0" };
      }
      return next;
    });
  }, [roster]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post("/exams/marks/bulk", {
        examId: exam.id,
        records: Object.entries(marks)
          .filter(([, v]) => v.marksObtained !== "")
          .map(([studentId, v]) => ({
            studentId,
            marksObtained: Number(v.marksObtained),
            graceMarks: Number(v.graceMarks || 0),
          })),
      }),
    onSuccess: () => {
      toast.success("Marks saved and published");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to save marks");
    },
  });

  return (
    <Card>
      <CardHeader className="items-center">
        <div>
          <CardTitle>{exam.name}</CardTitle>
          <p className="text-xs text-ink-muted mt-0.5">{exam.subject.name} · {exam.semester.name} · Max {exam.maxMarks}</p>
        </div>
        <Select className="w-56" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          <option value="">Select a section</option>
          {sections?.map((s) => <option key={s.id} value={s.id}>{s.class.name} — {s.name}</option>)}
        </Select>
      </CardHeader>
      <CardContent>
        {!sectionId ? (
          <p className="text-sm text-ink-muted py-8 text-center">Select a section to load its roster.</p>
        ) : loadingRoster ? (
          <Skeleton className="h-48 w-full" />
        ) : !roster || roster.length === 0 ? (
          <p className="text-sm text-ink-muted py-8 text-center">No students in this section.</p>
        ) : (
          <div className="space-y-2">
            {roster.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={s.fullName} size={26} />
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{s.fullName}</p>
                    <p className="figure text-xs text-ink-muted">{s.rollNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    max={exam.maxMarks}
                    placeholder="Marks"
                    className="w-20 h-8"
                    value={marks[s.id]?.marksObtained ?? ""}
                    onChange={(e) =>
                      setMarks((prev) => ({ ...prev, [s.id]: { ...prev[s.id], marksObtained: e.target.value } }))
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Grace"
                    className="w-16 h-8"
                    value={marks[s.id]?.graceMarks ?? "0"}
                    onChange={(e) =>
                      setMarks((prev) => ({ ...prev, [s.id]: { ...prev[s.id], graceMarks: e.target.value } }))
                    }
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-3">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save size={15} /> Save & publish marks
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TeacherExamsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams", "teacher"],
    queryFn: async () => (await api.get("/exams")).data.data as Exam[],
  });

  const selectedExam = exams?.find((e) => e.id === selectedExamId) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Exams & marks</h1>
          <p className="text-sm text-ink-muted mt-0.5">Create exams and enter marks</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={15} /> New exam
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Exams</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !exams || exams.length === 0 ? (
              <p className="text-sm text-ink-muted py-8 text-center">
                <FileEdit className="mx-auto mb-2" size={20} />
                No exams created yet.
              </p>
            ) : (
              exams.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedExamId(e.id)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2.5 text-sm transition-colors",
                    selectedExamId === e.id ? "bg-primary/10 text-primary" : "hover:bg-surface-2 text-ink"
                  )}
                >
                  <p className="font-medium truncate">{e.name}</p>
                  <p className="text-xs text-ink-muted">{e.subject.name} · {e.type}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {selectedExam ? (
            <MarksEntryPanel exam={selectedExam} />
          ) : (
            <Card className="py-16 text-center">
              <p className="text-sm text-ink-muted">Select an exam to enter marks.</p>
            </Card>
          )}
        </div>
      </div>

      <CreateExamDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
