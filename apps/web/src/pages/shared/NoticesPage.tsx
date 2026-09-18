import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Plus, Bell, Trash2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Notice {
  id: string;
  title: string;
  content: string;
  audience: string;
  priority: "NORMAL" | "IMPORTANT";
  publishedAt: string;
  author: { email: string; role: string };
}

const schema = z.object({
  title: z.string().min(1, "Required").max(200),
  content: z.string().min(1, "Required").max(5000),
  audience: z.enum(["ALL", "TEACHERS", "STUDENTS"]),
  priority: z.enum(["NORMAL", "IMPORTANT"]),
});
type FormValues = z.infer<typeof schema>;

function CreateNoticeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", content: "", audience: "ALL", priority: "NORMAL" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/notices", values),
    onSuccess: () => {
      toast.success("Notice published");
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      reset();
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to publish notice");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Publish a notice">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="audience">Audience</Label>
            <Select id="audience" {...register("audience")}>
              <option value="ALL">Everyone</option>
              <option value="TEACHERS">Teachers only</option>
              <option value="STUDENTS">Students only</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" {...register("priority")}>
              <option value="NORMAL">Normal</option>
              <option value="IMPORTANT">Important</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="content">Message</Label>
          <Textarea id="content" rows={5} {...register("content")} />
          {errors.content && <p className="text-xs text-danger mt-1">{errors.content.message}</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>Publish</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function NoticesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");

  const { data: notices, isLoading } = useQuery({
    queryKey: ["notices", "all", search, audienceFilter],
    queryFn: async () =>
      (
        await api.get("/notices", {
          params: { page: 1, limit: 30, search: search || undefined },
        })
      ).data.data as Notice[],
  });

  const filtered = (notices ?? []).filter((n) => !audienceFilter || n.audience === audienceFilter);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notices/${id}`),
    onSuccess: () => {
      toast.success("Notice deleted");
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: () => toast.error("Failed to delete notice"),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Notices</h1>
          <p className="text-sm text-ink-muted mt-0.5">Announcements from EduSphere AI</p>
        </div>
        {user?.role === "SUPER_ADMIN" && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={15} /> Publish notice
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search notices…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)} className="sm:max-w-[180px]">
          <option value="">All audiences</option>
          <option value="ALL">Everyone</option>
          <option value="TEACHERS">Teachers</option>
          <option value="STUDENTS">Students</option>
          <option value="CLASS">Class</option>
          <option value="SECTION">Section</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="No notices found" description="Nothing matches your filters yet." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <Card key={n.id} className={n.priority === "IMPORTANT" ? "border-warning/40" : undefined}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {n.priority === "IMPORTANT" && <AlertTriangle size={14} className="text-warning shrink-0" />}
                      <h3 className="font-display text-sm font-semibold text-ink">{n.title}</h3>
                      <Badge tone="primary">{n.audience}</Badge>
                      {n.priority === "IMPORTANT" && <Badge tone="warning">Important</Badge>}
                    </div>
                    <p className="text-sm text-ink-muted whitespace-pre-wrap">{n.content}</p>
                    <p className="text-xs text-ink-muted mt-2">
                      {new Date(n.publishedAt).toLocaleDateString(undefined, { dateStyle: "medium" })} · {n.author.email}
                    </p>
                  </div>
                  {user?.role === "SUPER_ADMIN" && (
                    <Button variant="ghost" size="icon" onClick={() => setPendingDelete(n.id)}>
                      <Trash2 size={14} className="text-danger" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateNoticeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete);
        }}
        title="Delete this notice?"
        description="This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
