import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ClassOption } from "@/types/academic";
import { StudentFormDialog } from "./StudentFormDialog";

interface StudentRow {
  id: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  gender: string | null;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  classId: string | null;
  sectionId: string | null;
  class: { name: string } | null;
  section: { name: string } | null;
  user: { email: string; isActive: boolean };
}

export function StudentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);

  const { data: classes } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: async () => (await api.get("/academic/classes")).data.data as ClassOption[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["students", { page, search: debouncedSearch, classId }],
    queryFn: async () => {
      const res = await api.get("/students", {
        params: { page, limit: 10, search: debouncedSearch || undefined, classId: classId || undefined },
      });
      return { items: res.data.data as StudentRow[], meta: res.data.meta };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.success("Student deleted");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: () => toast.error("Failed to delete student"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/students/${id}/active`, { isActive }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  function openCreate() {
    setEditingStudent(null);
    setDialogOpen(true);
  }
  function openEdit(student: StudentRow) {
    setEditingStudent(student);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Students</h1>
          <p className="text-sm text-ink-muted mt-0.5">{data?.meta?.total ?? "—"} students enrolled</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} />
          Add student
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Search by name, roll number, admission number, or email"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className="sm:w-56"
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All classes</option>
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-xs text-ink-muted">
                <th className="px-4 py-2.5 font-medium">Student</th>
                <th className="px-4 py-2.5 font-medium">Roll No</th>
                <th className="px-4 py-2.5 font-medium">Class / Section</th>
                <th className="px-4 py-2.5 font-medium">Guardian</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3" colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-muted text-sm">
                    No students found.
                  </td>
                </tr>
              ) : (
                data.items.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.fullName} size={28} />
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{s.fullName}</p>
                          <p className="text-xs text-ink-muted truncate">{s.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 figure text-ink-muted">{s.rollNumber}</td>
                    <td className="px-4 py-2.5 text-ink-muted">
                      {s.class ? `${s.class.name}${s.section ? ` · ${s.section.name}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-ink-muted">
                      {s.guardianName || "—"}
                      {s.guardianPhone && <span className="figure text-xs block">{s.guardianPhone}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={s.user.isActive ? "positive" : "neutral"}>
                        {s.user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={s.user.isActive ? "Deactivate" : "Activate"}
                          onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.user.isActive })}
                        >
                          <Power size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(s)}>
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Delete ${s.fullName}? This cannot be undone.`)) {
                              deleteMutation.mutate(s.id);
                            }
                          }}
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
        {data && (
          <div className="px-4 pb-3">
            <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} limit={10} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <StudentFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} student={editingStudent} />
    </div>
  );
}
