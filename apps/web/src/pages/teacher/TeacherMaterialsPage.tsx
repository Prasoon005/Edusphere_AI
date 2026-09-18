import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";

interface Subject { id: string; name: string }
interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileSizeKb: number | null;
  createdAt: string;
  subject: { name: string };
  teacher: { fullName: string };
}

const schema = z.object({
  title: z.string().min(1, "Required").max(200),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/academic/subjects")).data.data as Subject[],
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", subjectId: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const file = fileInputRef.current?.files?.[0];
      if (!file) throw new Error("Please choose a file");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", values.title);
      if (values.description) formData.append("description", values.description);
      formData.append("subjectId", values.subjectId);
      return api.post("/study-materials", formData, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      toast.success("Material uploaded");
      queryClient.invalidateQueries({ queryKey: ["study-materials"] });
      reset();
      onClose();
    },
    onError: (err) => {
      const message =
        err instanceof AxiosError ? (err.response?.data?.message as string) : (err as Error).message || "Something went wrong";
      toast.error(message || "Failed to upload material");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Upload study material">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
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
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea id="description" rows={3} {...register("description")} />
        </div>
        <div>
          <Label htmlFor="file">File</Label>
          <input
            ref={fileInputRef}
            id="file"
            type="file"
            className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-primary file:text-sm file:font-medium"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>Upload</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function TeacherMaterialsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: materials, isLoading } = useQuery({
    queryKey: ["study-materials", "mine"],
    queryFn: async () => (await api.get("/study-materials", { params: { page: 1, limit: 30 } })).data.data as Material[],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/study-materials/${id}`),
    onSuccess: () => {
      toast.success("Material deleted");
      queryClient.invalidateQueries({ queryKey: ["study-materials"] });
    },
    onError: () => toast.error("Failed to delete material"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Study material</h1>
          <p className="text-sm text-ink-muted mt-0.5">Notes and resources for your subjects</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Upload size={15} /> Upload material
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !materials || materials.length === 0 ? (
        <Card className="py-16 text-center">
          <FileText className="mx-auto text-ink-muted mb-3" size={24} />
          <p className="text-sm text-ink-muted">No study material uploaded yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {materials.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{m.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{m.subject.name}</p>
                    {m.description && <p className="text-sm text-ink-muted mt-2 line-clamp-2">{m.description}</p>}
                    <p className="figure text-xs text-ink-muted mt-2">
                      {m.fileSizeKb ? `${(m.fileSizeKb / 1024).toFixed(1)} MB` : ""} · {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <a href={m.fileUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon"><Download size={14} /></Button>
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${m.title}?`)) deleteMutation.mutate(m.id); }}>
                      <Trash2 size={14} className="text-danger" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
