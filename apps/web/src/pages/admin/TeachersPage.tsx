import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { TeacherFormDialog } from "./TeacherFormDialog";

interface TeacherRow {
  id: string;
  employeeId: string;
  fullName: string;
  gender: string | null;
  department: string | null;
  designation: string | null;
  qualification: string | null;
  phone: string | null;
  subjectAssignments: Array<{ subject: { name: string } }>;
  user: { email: string; isActive: boolean };
}

export function TeachersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["teachers", { page, search: debouncedSearch }],
    queryFn: async () => {
      const res = await api.get("/teachers", {
        params: { page, limit: 10, search: debouncedSearch || undefined },
      });
      return { items: res.data.data as TeacherRow[], meta: res.data.meta };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/teachers/${id}`),
    onSuccess: () => {
      toast.success("Teacher deleted");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: () => toast.error("Failed to delete teacher"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/teachers/${id}/active`, { isActive }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  function openCreate() {
    setEditingTeacher(null);
    setDialogOpen(true);
  }
  function openEdit(teacher: TeacherRow) {
    setEditingTeacher(teacher);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Teachers</h1>
          <p className="text-sm text-ink-muted mt-0.5">{data?.meta?.total ?? "—"} teachers on staff</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} />
          Add teacher
        </Button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <Input
          placeholder="Search by name, employee ID, or email"
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-xs text-ink-muted">
                <th className="px-4 py-2.5 font-medium">Teacher</th>
                <th className="px-4 py-2.5 font-medium">Employee ID</th>
                <th className="px-4 py-2.5 font-medium">Department</th>
                <th className="px-4 py-2.5 font-medium">Subjects</th>
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
                    No teachers found.
                  </td>
                </tr>
              ) : (
                data.items.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={t.fullName} size={28} />
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{t.fullName}</p>
                          <p className="text-xs text-ink-muted truncate">{t.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 figure text-ink-muted">{t.employeeId}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{t.department || "—"}</td>
                    <td className="px-4 py-2.5 text-ink-muted">
                      {t.subjectAssignments.length === 0
                        ? "—"
                        : t.subjectAssignments.map((sa) => sa.subject.name).join(", ")}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={t.user.isActive ? "positive" : "neutral"}>
                        {t.user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t.user.isActive ? "Deactivate" : "Activate"}
                          onClick={() => toggleActiveMutation.mutate({ id: t.id, isActive: !t.user.isActive })}
                        >
                          <Power size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(t)}>
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Delete ${t.fullName}? This cannot be undone.`)) {
                              deleteMutation.mutate(t.id);
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

      <TeacherFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} teacher={editingTeacher} />
    </div>
  );
}
