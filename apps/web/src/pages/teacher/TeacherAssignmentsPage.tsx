import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Plus, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";

interface Subject { id: string; name: string }
interface Semester { id: string; name: string; isCurrent: boolean }
interface Assignment {
  id: string;
  title: string;
  description: string;
  status: string;
  maxMarks: number;
  dueDate: string;
  subject: { name: string };
  semester: { name: string };
  _count: { submissions: number };
}
interface Submission {
  id: string;
  status: string;
  fileUrl: string | null;
  submittedAt: string | null;
  marksObtained: number | null;
  isLate: boolean;
  student: { id: string; fullName: string; rollNumber: string };
}

const schema = z.object({
  title: z.string().min(1, "Required").max(200),
  description: z.string().min(1, "Required").max(5000),
  subjectId: z.string().min(1, "Required"),
  semesterId: z.string().min(1, "Required"),
  maxMarks: z.coerce.number().positive(),
  dueDate: z.string().min(1, "Required"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});
type FormValues = z.infer<typeof schema>;

function CreateAssignmentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", subjectId: "", semesterId: "", maxMarks: 100, dueDate: "", status: "PUBLISHED" },
  });

  useEffect(() => {
    if (open) reset({ title: "", description: "", subjectId: "", semesterId: "", maxMarks: 100, dueDate: "", status: "PUBLISHED" });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/assignments", values),
    onSuccess: () => {
      toast.success("Assignment created");
      queryClient.invalidateQueries({ queryKey: ["assignments", "teacher"] });
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to create assignment");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Create assignment">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
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
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
            {errors.dueDate && <p className="text-xs text-danger mt-1">{errors.dueDate.message}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="description">Instructions</Label>
          <Textarea id="description" rows={4} {...register("description")} />
          {errors.description && <p className="text-xs text-danger mt-1">{errors.description.message}</p>}
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            <option value="PUBLISHED">Publish immediately</option>
            <option value="DRAFT">Save as draft</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>Create assignment</Button>
        </div>
      </form>
    </Dialog>
  );
}

function GradeInput({ submission, maxMarks, assignmentId }: { submission: Submission; maxMarks: number; assignmentId: string }) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState(submission.marksObtained?.toString() ?? "");

  const gradeMutation = useMutation({
    mutationFn: () => api.patch(`/assignments/submissions/${submission.id}/grade`, { marksObtained: Number(marks) }),
    onSuccess: () => {
      toast.success("Graded");
      queryClient.invalidateQueries({ queryKey: ["assignments", "submissions", assignmentId] });
    },
    onError: () => toast.error("Failed to save grade"),
  });

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        max={maxMarks}
        value={marks}
        onChange={(e) => setMarks(e.target.value)}
        className="w-20 h-8"
        placeholder="—"
      />
      <span className="text-xs text-ink-muted">/ {maxMarks}</span>
      <Button size="sm" variant="outline" disabled={!marks || gradeMutation.isPending} onClick={() => gradeMutation.mutate()}>
        Save
      </Button>
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const [expanded, setExpanded] = useState(false);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["assignments", "submissions", assignment.id],
    queryFn: async () => (await api.get(`/assignments/${assignment.id}/submissions`)).data.data as Submission[],
    enabled: expanded,
  });

  return (
    <Card>
      <CardContent className="pt-5">
        <button className="flex items-center justify-between w-full text-left" onClick={() => setExpanded((v) => !v)}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-sm font-semibold text-ink">{assignment.title}</h3>
              <Badge tone={assignment.status === "PUBLISHED" ? "positive" : "neutral"}>{assignment.status}</Badge>
            </div>
            <p className="text-xs text-ink-muted">
              {assignment.subject.name} · Due {new Date(assignment.dueDate).toLocaleDateString()} · {assignment._count.submissions} submissions
            </p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-ink-muted" /> : <ChevronDown size={16} className="text-ink-muted" />}
        </button>

        {expanded && (
          <div className="mt-4 border-t border-border pt-4 space-y-2">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !submissions || submissions.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-4">No submissions yet.</p>
            ) : (
              submissions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={s.student.fullName} size={26} />
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{s.student.fullName}</p>
                      <p className="figure text-xs text-ink-muted">{s.student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge tone={s.status === "GRADED" ? "positive" : s.isLate ? "warning" : "primary"}>{s.status}</Badge>
                    {s.fileUrl && (
                      <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        View file
                      </a>
                    )}
                    <GradeInput submission={s} maxMarks={assignment.maxMarks} assignmentId={assignment.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TeacherAssignmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["assignments", "teacher"],
    queryFn: async () => (await api.get("/assignments", { params: { page: 1, limit: 30 } })).data.data as Assignment[],
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Assignments</h1>
          <p className="text-sm text-ink-muted mt-0.5">Create, publish, and grade coursework</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={15} /> New assignment
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !assignments || assignments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="mx-auto text-ink-muted mb-3" size={24} />
            <p className="text-sm text-ink-muted">No assignments created yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <AssignmentRow key={a.id} assignment={a} />
          ))}
        </div>
      )}

      <CreateAssignmentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
