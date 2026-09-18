import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Plus, Trash2, Layers } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface AcademicYear { id: string; name: string; isCurrent: boolean }
interface Subject { id: string; name: string; code: string }
interface TeacherOption { id: string; fullName: string }
interface ClassDetail {
  id: string;
  name: string;
  academicYear: { name: string };
  sections: Array<{ id: string; name: string; capacity: number; classTeacher: { id: string; fullName: string } | null; _count: { students: number } }>;
  subjects: Array<{ subject: Subject }>;
}
interface ClassSummary { id: string; name: string; academicYear: { name: string }; _count: { students: number } }

const classSchema = z.object({
  name: z.string().min(1, "Required"),
  academicYearId: z.string().min(1, "Required"),
  subjectIds: z.array(z.string()).default([]),
});
type ClassFormValues = z.infer<typeof classSchema>;

const sectionSchema = z.object({
  name: z.string().min(1, "Required"),
  classTeacherId: z.string().optional(),
  capacity: z.coerce.number().int().min(1).max(300),
});
type SectionFormValues = z.infer<typeof sectionSchema>;

function CreateClassDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: years } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get("/academic/academic-years")).data.data as AcademicYear[],
    enabled: open,
  });
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/academic/subjects")).data.data as Subject[],
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: "", academicYearId: "", subjectIds: [] },
  });

  useEffect(() => {
    if (open) reset({ name: "", academicYearId: "", subjectIds: [] });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: ClassFormValues) => api.post("/academic/classes", values),
    onSuccess: () => {
      toast.success("Class created");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to create class");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Add class">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="className">Class name</Label>
          <Input id="className" placeholder="e.g. B.Tech CSE — Year 3" {...register("name")} />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="academicYearId">Academic year</Label>
          <Select id="academicYearId" {...register("academicYearId")}>
            <option value="">Select a year</option>
            {years?.map((y) => (
              <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? " (current)" : ""}</option>
            ))}
          </Select>
          {errors.academicYearId && <p className="text-xs text-danger mt-1">{errors.academicYearId.message}</p>}
        </div>
        <div>
          <Label>Subjects</Label>
          <div className="border border-border rounded-md p-2 max-h-40 overflow-y-auto scrollbar-thin space-y-1">
            {subjects?.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm px-1 py-1 rounded hover:bg-surface-2 cursor-pointer">
                <input type="checkbox" value={s.id} {...register("subjectIds")} className="accent-primary" />
                {s.name} <span className="figure text-xs text-ink-muted">({s.code})</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>Create class</Button>
        </div>
      </form>
    </Dialog>
  );
}

function CreateSectionDialog({ open, onClose, classId }: { open: boolean; onClose: () => void; classId: string }) {
  const queryClient = useQueryClient();
  const { data: teachers } = useQuery({
    queryKey: ["teachers", "all-for-select"],
    queryFn: async () => (await api.get("/teachers", { params: { limit: 100 } })).data.data as TeacherOption[],
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: "", classTeacherId: "", capacity: 60 },
  });

  useEffect(() => {
    if (open) reset({ name: "", classTeacherId: "", capacity: 60 });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: SectionFormValues) =>
      api.post("/academic/sections", { ...values, classId, classTeacherId: values.classTeacherId || undefined }),
    onSuccess: () => {
      toast.success("Section created");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to create section");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Add section">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label htmlFor="sectionName">Section name</Label>
          <Input id="sectionName" placeholder="e.g. A" {...register("name")} />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="classTeacherId">Class teacher</Label>
          <Select id="classTeacherId" {...register("classTeacherId")}>
            <option value="">Unassigned</option>
            {teachers?.map((t) => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" type="number" min={1} max={300} {...register("capacity")} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>Create section</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ClassesPage() {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get("/academic/classes")).data.data as ClassSummary[],
  });

  useEffect(() => {
    if (!selectedClassId && classes && classes.length > 0) setSelectedClassId(classes[0].id);
  }, [classes, selectedClassId]);

  const { data: classDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["classes", selectedClassId],
    queryFn: async () => (await api.get(`/academic/classes/${selectedClassId}`)).data.data as ClassDetail,
    enabled: Boolean(selectedClassId),
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academic/classes/${id}`),
    onSuccess: () => {
      toast.success("Class deleted");
      setSelectedClassId(null);
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: () => toast.error("Failed to delete class"),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academic/sections/${id}`),
    onSuccess: () => {
      toast.success("Section deleted");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: () => toast.error("Failed to delete section"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Classes & sections</h1>
          <p className="text-sm text-ink-muted mt-0.5">Organize your academic structure</p>
        </div>
        <Button onClick={() => setClassDialogOpen(true)}>
          <Plus size={15} /> Add class
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Classes</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {loadingClasses ? (
              <Skeleton className="h-32 w-full" />
            ) : !classes || classes.length === 0 ? (
              <p className="text-sm text-ink-muted py-8 text-center">No classes yet.</p>
            ) : (
              classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                    selectedClassId === c.id ? "bg-primary/10 text-primary" : "hover:bg-surface-2 text-ink"
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Layers size={14} className="shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="figure text-xs text-ink-muted shrink-0">{c._count.students}</span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          {!selectedClassId || loadingDetail ? (
            <CardContent className="pt-5"><Skeleton className="h-48 w-full" /></CardContent>
          ) : classDetail ? (
            <>
              <CardHeader className="items-start">
                <div>
                  <CardTitle>{classDetail.name}</CardTitle>
                  <p className="text-xs text-ink-muted mt-0.5">{classDetail.academicYear.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setSectionDialogOpen(true)}>
                    <Plus size={14} /> Add section
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { if (confirm(`Delete ${classDetail.name}? This removes all its sections too.`)) deleteClassMutation.mutate(classDetail.id); }}
                  >
                    <Trash2 size={14} className="text-danger" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {classDetail.subjects.length === 0 ? (
                      <p className="text-sm text-ink-muted">No subjects assigned.</p>
                    ) : (
                      classDetail.subjects.map((cs) => (
                        <Badge key={cs.subject.id} tone="primary">{cs.subject.name}</Badge>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">Sections</p>
                  <div className="space-y-2">
                    {classDetail.sections.length === 0 ? (
                      <p className="text-sm text-ink-muted">No sections yet.</p>
                    ) : (
                      classDetail.sections.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-ink">Section {s.name}</p>
                            <p className="text-xs text-ink-muted">
                              {s.classTeacher ? s.classTeacher.fullName : "No class teacher"} · {s._count.students}/{s.capacity} students
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete section ${s.name}?`)) deleteSectionMutation.mutate(s.id); }}>
                            <Trash2 size={14} className="text-danger" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          ) : null}
        </Card>
      </div>

      <CreateClassDialog open={classDialogOpen} onClose={() => setClassDialogOpen(false)} />
      {selectedClassId && (
        <CreateSectionDialog open={sectionDialogOpen} onClose={() => setSectionDialogOpen(false)} classId={selectedClassId} />
      )}
    </div>
  );
}
