import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HelpCircle, Send } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface QueryReply { id: string; message: string; teacher: { fullName: string } }
interface Query {
  id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  student: { fullName: string; rollNumber: string };
  subject: { name: string };
  replies: QueryReply[];
}

function statusTone(status: string): "warning" | "primary" | "positive" | "neutral" {
  if (status === "OPEN") return "warning";
  if (status === "IN_PROGRESS") return "primary";
  if (status === "RESOLVED") return "positive";
  return "neutral";
}

function QueryCard({ query }: { query: Query }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const replyMutation = useMutation({
    mutationFn: () => api.post(`/queries/${query.id}/reply`, { message: reply }),
    onSuccess: () => {
      toast.success("Reply sent");
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["queries", "teacher"] });
    },
    onError: () => toast.error("Failed to send reply"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/queries/${query.id}/status`, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["queries", "teacher"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-sm font-semibold text-ink">{query.title}</h3>
              <Badge tone={statusTone(query.status)}>{query.status.replace("_", " ")}</Badge>
            </div>
            <p className="text-xs text-ink-muted">
              {query.student.fullName} ({query.student.rollNumber}) · {query.subject.name}
            </p>
          </div>
          <Select
            className="w-36"
            value={query.status}
            onChange={(e) => statusMutation.mutate(e.target.value)}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>
        <p className="text-sm text-ink">{query.message}</p>

        {query.replies.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            {query.replies.map((r) => (
              <div key={r.id} className="bg-surface-2 rounded-md px-3 py-2">
                <p className="text-xs font-medium text-ink">{r.teacher.fullName}</p>
                <p className="text-sm text-ink-muted mt-0.5">{r.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Textarea
            placeholder="Write a reply..."
            rows={2}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="flex-1"
          />
          <Button
            className="self-end"
            disabled={!reply.trim() || replyMutation.isPending}
            onClick={() => replyMutation.mutate()}
          >
            <Send size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeacherQueriesPage() {
  const { data: queries, isLoading } = useQuery({
    queryKey: ["queries", "teacher"],
    queryFn: async () => (await api.get("/queries/teacher", { params: { page: 1, limit: 30 } })).data.data as Query[],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Student queries</h1>
        <p className="text-sm text-ink-muted mt-0.5">Questions from students in subjects you teach</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !queries || queries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <HelpCircle className="mx-auto text-ink-muted mb-3" size={24} />
            <p className="text-sm text-ink-muted">No student questions right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queries.map((q) => (
            <QueryCard key={q.id} query={q} />
          ))}
        </div>
      )}
    </div>
  );
}
