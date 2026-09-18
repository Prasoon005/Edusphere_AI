import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Plus, ShieldCheck, X } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface Permission { id: string; code: string; description: string | null }
interface UserWithGrants {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: Array<{ permission: Permission }>;
}

const schema = z.object({
  code: z.string().min(1, "Required").regex(/^[a-z]+(\.[a-z]+)+$/, "Use dot notation, e.g. students.manage"),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function PermissionCatalog() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", description: "" },
  });

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => (await api.get("/permissions")).data.data as Permission[],
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/permissions", values),
    onSuccess: () => {
      toast.success("Permission created");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      reset();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to create permission");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/permissions/${id}`),
    onSuccess: () => {
      toast.success("Permission deleted");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
    onError: () => toast.error("Failed to delete permission"),
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Permission catalog</CardTitle>
          <CardDescription>Fine-grained permissions layered on top of role-based access</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input id="code" placeholder="e.g. students.manage" {...register("code")} />
            {errors.code && <p className="text-xs text-danger mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
          </div>
          <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
            <Plus size={15} /> Add permission
          </Button>
        </form>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !permissions || permissions.length === 0 ? (
          <p className="text-sm text-ink-muted py-6 text-center">No permissions defined yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {permissions.map((p) => (
              <Badge key={p.id} tone="primary" className="gap-1.5 pr-1">
                {p.code}
                <button onClick={() => deleteMutation.mutate(p.id)} className="hover:text-danger transition-colors">
                  <X size={11} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserGrants() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPermissionId, setSelectedPermissionId] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["permissions", "users"],
    queryFn: async () => (await api.get("/permissions/users")).data.data as UserWithGrants[],
  });
  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => (await api.get("/permissions")).data.data as Permission[],
  });

  const assignMutation = useMutation({
    mutationFn: () => api.post("/permissions/assign", { userId: selectedUserId, permissionId: selectedPermissionId }),
    onSuccess: () => {
      toast.success("Permission granted");
      queryClient.invalidateQueries({ queryKey: ["permissions", "users"] });
      setSelectedPermissionId("");
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to grant permission");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (permissionId: string) => api.post("/permissions/revoke", { userId: selectedUserId, permissionId }),
    onSuccess: () => {
      toast.success("Permission revoked");
      queryClient.invalidateQueries({ queryKey: ["permissions", "users"] });
    },
    onError: () => toast.error("Failed to revoke permission"),
  });

  const selectedUser = users?.find((u) => u.id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>User grants</CardTitle>
          <CardDescription>Super admins bypass permission checks by default — grants apply to teachers and students</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            <option value="">Select a user</option>
            {users?.map((u) => <option key={u.id} value={u.id}>{u.email} ({u.role})</option>)}
          </Select>
        )}

        {selectedUser && (
          <>
            <div className="flex flex-wrap gap-2">
              {selectedUser.permissions.length === 0 ? (
                <p className="text-sm text-ink-muted">No permissions granted.</p>
              ) : (
                selectedUser.permissions.map(({ permission }) => (
                  <Badge key={permission.id} tone="positive" className="gap-1.5 pr-1">
                    {permission.code}
                    <button onClick={() => revokeMutation.mutate(permission.id)} className="hover:text-danger transition-colors">
                      <X size={11} />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="grantPermission">Grant a permission</Label>
                <Select id="grantPermission" value={selectedPermissionId} onChange={(e) => setSelectedPermissionId(e.target.value)}>
                  <option value="">Select</option>
                  {permissions
                    ?.filter((p) => !selectedUser.permissions.some((sp) => sp.permission.id === p.id))
                    .map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
                </Select>
              </div>
              <Button disabled={!selectedPermissionId || assignMutation.isPending} onClick={() => assignMutation.mutate()}>
                <ShieldCheck size={15} /> Grant
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function RolesPermissionsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Roles & permissions</h1>
        <p className="text-sm text-ink-muted mt-0.5">Manage fine-grained access beyond the three core roles</p>
      </div>
      <PermissionCatalog />
      <UserGrants />
    </div>
  );
}
