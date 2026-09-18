import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldQuestion, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Select, Textarea } from "@/components/ui/Select";

interface ResetRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  reason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  rejectReason: string | null;
  user: { id: string; email: string; role: string };
  reviewedBy: { email: string } | null;
}

const statusTone: Record<ResetRequest["status"], "warning" | "positive" | "danger" | "neutral"> = {
  PENDING: "warning",
  APPROVED: "positive",
  REJECTED: "danger",
  COMPLETED: "neutral",
};

export function PasswordRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["password-requests", statusFilter],
    queryFn: async () =>
      (
        await api.get("/password-reset", { params: { page: 1, limit: 50, status: statusFilter || undefined } })
      ).data.data as ResetRequest[],
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/password-reset/${id}/approve`),
    onSuccess: () => {
      toast.success("Request approved — the user has been notified");
      queryClient.invalidateQueries({ queryKey: ["password-requests"] });
    },
    onError: () => toast.error("Failed to approve request"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/password-reset/${id}/reject`, { rejectReason: reason }),
    onSuccess: () => {
      toast.success("Request rejected");
      setRejectTarget(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["password-requests"] });
    },
    onError: () => toast.error("Failed to reject request"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Password recovery requests</h1>
          <p className="text-sm text-ink-muted mt-0.5">Verify identity before approving account recovery.</p>
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="COMPLETED">Completed</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !requests || requests.length === 0 ? (
        <Card>
          <EmptyState icon={ShieldQuestion} title="No requests" description="No recovery requests match this filter." />
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-ink">{r.user.email}</p>
                    <Badge tone="neutral">{r.user.role}</Badge>
                    <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                  </div>
                  {r.reason && <p className="text-sm text-ink-muted">"{r.reason}"</p>}
                  <p className="text-xs text-ink-muted mt-1">
                    Requested {new Date(r.requestedAt).toLocaleString()}
                    {r.reviewedBy && ` · Reviewed by ${r.reviewedBy.email}`}
                  </p>
                  {r.rejectReason && <p className="text-xs text-danger mt-1">Rejected: {r.rejectReason}</p>}
                </div>
                {r.status === "PENDING" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending}>
                      <Check size={14} /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectTarget(r.id)}>
                      <X size={14} /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject this request?">
        <div className="space-y-4">
          <div>
            <Textarea
              placeholder="Optional reason shown to the user…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => rejectTarget && rejectMutation.mutate({ id: rejectTarget, reason: rejectReason })}
              disabled={rejectMutation.isPending}
            >
              Reject
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
