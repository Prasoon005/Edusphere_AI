import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Plus, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface Subject { id: string; name: string }
interface QueryReply { id: string; message: string; createdAt: string; teacher: { fullName: string } }
interface Query {
  id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  subject: { name: string };
  replies: QueryReply[];
}

const schema = z.object({
  subjectId: z.string().min(1, "Required"),
  title: z.string().min(1, "Required").max(200),
  message: z.string().min(1, "Required").max(3000),
});
type FormValues = z.infer<typeof schema>;

function statusTone(status: string): "warning" | "primary" | "positive" | "neutral" {
  if (status === "OPEN") return "warning";
  if (status === "IN_PROGRESS") return "primary";
  if (status === "RESOLVED") return "positive";
  return "neutral";
}

function AskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/academic/subjects")).data.data as Subject[],
    enabled: open,
  });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subjectId: "", title: "", message: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/queries", values),
    onSuccess: () => {
      toast.success("Question sent");
      queryClient.invalidateQueries({ queryKey: ["queries", "mine"] });
      reset();
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to send question");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Ask a teacher">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="subjectId">Subject</Label>
          <Select id="subjectId" {...register("subjectId")}>
            <option value="">Select a subject</option>
            {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          {errors.subjectId && <p className="text-xs text-danger mt-1">{errors.subjectId.message}</p>}
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="Short summary of your question" {...register("title")} />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="message">Your question</Label>
          <Textarea id="message" rows={4} {...register("message")} />
          {errors.message && <p className="text-xs text-danger mt-1">{errors.message.message}</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>Send question</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function StudentQueriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: queries, isLoading } = useQuery({
    queryKey: ["queries", "mine"],
    queryFn: async () => (await api.get("/queries/me", { params: { page: 1, limit: 30 } })).data.data as Query[],
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Query a teacher</h1>
          <p className="text-sm text-ink-muted mt-0.5">Ask questions about coursework and get replies here</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={15} /> Ask a question
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !queries || queries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <HelpCircle className="mx-auto text-ink-muted mb-3" size={24} />
            <p className="text-sm text-ink-muted">You haven't asked any questions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queries.map((q) => (
            <Card key={q.id}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-sm font-semibold text-ink">{q.title}</h3>
                      <Badge tone={statusTone(q.status)}>{q.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-xs text-ink-muted">{q.subject.name} · {new Date(q.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-sm text-ink">{q.message}</p>

                {q.replies.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    {q.replies.map((r) => (
                      <div key={r.id} className="bg-surface-2 rounded-md px-3 py-2">
                        <p className="text-xs font-medium text-ink">{r.teacher.fullName}</p>
                        <p className="text-sm text-ink-muted mt-0.5">{r.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
