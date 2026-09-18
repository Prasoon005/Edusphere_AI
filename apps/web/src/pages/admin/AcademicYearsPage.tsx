import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Plus, Trash2, CalendarClock } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const schema = z.object({
  name: z.string().min(4, "e.g. 2025-2026"),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().min(1, "Required"),
  isCurrent: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function CreateYearDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", startDate: "", endDate: "", isCurrent: false },
  });

  useEffect(() => {
    if (open) reset({ name: "", startDate: "", endDate: "", isCurrent: false });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/academic/academic-years", values),
    onSuccess: () => {
      toast.success("Academic year created");
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to create academic year");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Add academic year">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="e.g. 2026-2027" {...register("name")} />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" type="date" {...register("startDate")} />
            {errors.startDate && <p className="text-xs text-danger mt-1">{errors.startDate.message}</p>}
          </div>
          <div>
            <Label htmlFor="endDate">End date</Label>
            <Input id="endDate" type="date" {...register("endDate")} />
            {errors.endDate && <p className="text-xs text-danger mt-1">{errors.endDate.message}</p>}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="accent-primary" {...register("isCurrent")} />
          Set as current academic year
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>Create</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function AcademicYearsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: years, isLoading } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get("/academic/academic-years")).data.data as AcademicYear[],
  });

  const setCurrentMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/academic/academic-years/${id}`, { isCurrent: true }),
    onSuccess: () => {
      toast.success("Current academic year updated");
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academic/academic-years/${id}`),
    onSuccess: () => {
      toast.success("Academic year deleted");
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
    onError: () => toast.error("Failed to delete — it may have classes attached"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Academic years</h1>
          <p className="text-sm text-ink-muted mt-0.5">Manage the academic calendar</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={15} /> Add year
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !years || years.length === 0 ? (
        <Card className="py-16 text-center">
          <CalendarClock className="mx-auto text-ink-muted mb-3" size={24} />
          <p className="text-sm text-ink-muted">No academic years created yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {years.map((y) => (
            <Card key={y.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <p className="font-medium text-ink">{y.name}</p>
                {y.isCurrent && <Badge tone="positive">Current</Badge>}
                <p className="figure text-xs text-ink-muted">
                  {new Date(y.startDate).toLocaleDateString()} – {new Date(y.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!y.isCurrent && (
                  <Button variant="outline" size="sm" onClick={() => setCurrentMutation.mutate(y.id)}>
                    Set current
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { if (confirm(`Delete ${y.name}?`)) deleteMutation.mutate(y.id); }}
                >
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateYearDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
