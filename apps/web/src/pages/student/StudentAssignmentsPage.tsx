import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ClipboardList, Upload, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface Submission {
  id: string;
  status: string;
  fileUrl: string | null;
  submittedAt: string | null;
  marksObtained: number | null;
  feedback: string | null;
  isLate: boolean;
}
interface Assignment {
  id: string;
  title: string;
  description: string;
  maxMarks: number;
  dueDate: string;
  subject: { name: string };
  teacher: { fullName: string };
  mySubmission: Submission | null;
}

function statusTone(status: string): "positive" | "warning" | "primary" | "neutral" {
  if (status === "GRADED") return "positive";
  if (status === "LATE") return "warning";
  if (status === "SUBMITTED") return "primary";
  return "neutral";
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post(`/assignments/${assignment.id}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Assignment submitted");
      queryClient.invalidateQueries({ queryKey: ["assignments", "student"] });
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to submit assignment");
    },
    onSettled: () => setUploading(false),
  });

  const isPastDue = new Date(assignment.dueDate) < new Date();
  const submission = assignment.mySubmission;

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-sm font-semibold text-ink">{assignment.title}</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {assignment.subject.name} · {assignment.teacher.fullName} · Due {new Date(assignment.dueDate).toLocaleDateString()}
              {isPastDue && !submission ? " (overdue)" : ""}
            </p>
          </div>
          {submission ? (
            <Badge tone={statusTone(submission.status)}>{submission.status}</Badge>
          ) : (
            <Badge tone="warning">Not submitted</Badge>
          )}
        </div>

        <p className="text-sm text-ink-muted whitespace-pre-wrap">{assignment.description}</p>

        {submission?.status === "GRADED" && (
          <div className="rounded-md bg-positive/5 border border-positive/20 px-3 py-2">
            <p className="text-sm font-medium text-ink figure">
              Score: {submission.marksObtained} / {assignment.maxMarks}
            </p>
            {submission.feedback && <p className="text-xs text-ink-muted mt-1">{submission.feedback}</p>}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          {submission ? (
            <div className="flex items-center gap-2 text-sm text-positive">
              <CheckCircle2 size={15} />
              Submitted {submission.submittedAt && new Date(submission.submittedAt).toLocaleDateString()}
              {submission.fileUrl && (
                <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline ml-1">
                  View file
                </a>
              )}
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploading(true);
                    submitMutation.mutate(file);
                  }
                }}
              />
              <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} />
                {uploading ? "Uploading..." : "Submit file"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentAssignmentsPage() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["assignments", "student"],
    queryFn: async () => (await api.get("/assignments", { params: { page: 1, limit: 30 } })).data.data as Assignment[],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Assignments</h1>
        <p className="text-sm text-ink-muted mt-0.5">Published work for your class</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !assignments || assignments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="mx-auto text-ink-muted mb-3" size={24} />
            <p className="text-sm text-ink-muted">No assignments right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      )}
    </div>
  );
}
