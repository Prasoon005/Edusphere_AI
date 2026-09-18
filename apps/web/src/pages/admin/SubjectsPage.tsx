import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  description: string | null;
}

const schema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().min(1, "Required"),
  credits: z.coerce.number().int().min(1).max(10),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function SubjectFormDialog({ open, onClose, subject }: { open: boolean; onClose: () => void; subject: Subject | null }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(subject);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", credits: 3, description: "" },
  });

  useEffect(() => {
    if (open) {
      reset(subject ? { name: subject.name, code: subject.code, credits: subject.credits, description: subject.description ?? "" } : { name: "", code: "", credits: 3, description: "" });
    }
  }, [open, subject, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit && subject ? api.patch(`/academic/subjects/${subject.id}`, values) : api.post("/academic/subjects", values),
    onSuccess: () => {
      toast.success(isEdit ? "Subject updated" : "Subject created");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to save subject");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit subject" : "Add subject"}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="name">Subject name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="code">Code</Label>
            <Input id="code" {...register("code")} />
            {errors.code && <p className="text-xs text-danger mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <Label htmlFor="credits">Credits</Label>
            <Input id="credits" type="number" min={1} max={10} {...register("credits")} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>{isEdit ? "Save changes" : "Create subject"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function SubjectsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/academic/subjects")).data.data as Subject[],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academic/subjects/${id}`),
    onSuccess: () => {
      toast.success("Subject deleted");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: () => toast.error("Failed to delete subject — it may be in use"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Subjects</h1>
          <p className="text-sm text-ink-muted mt-0.5">{subjects?.length ?? "—"} subjects in the curriculum</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus size={15} /> Add subject
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-xs text-ink-muted">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Credits</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3" colSpan={5}><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              ) : !subjects || subjects.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-muted text-sm">No subjects yet.</td></tr>
              ) : (
                subjects.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-ink">{s.name}</td>
                    <td className="px-4 py-2.5 figure text-ink-muted">{s.code}</td>
                    <td className="px-4 py-2.5 figure text-ink-muted">{s.credits}</td>
                    <td className="px-4 py-2.5 text-ink-muted truncate max-w-xs">{s.description || "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => { if (confirm(`Delete ${s.name}?`)) deleteMutation.mutate(s.id); }}
                        >
                          <Trash2 size={14} className="text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <SubjectFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} subject={editing} />
    </div>
  );
}
