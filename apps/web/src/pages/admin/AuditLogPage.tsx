import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationMeta } from "@/types";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  ipAddress: string | null;
  user: { id: string; email: string; role: string } | null;
}

function actionTone(action: string): "danger" | "warning" | "positive" | "neutral" {
  if (action.includes("FAILED") || action.includes("REJECTED") || action.includes("DELETED")) return "danger";
  if (action.includes("CHANGED") || action.includes("UPDATED")) return "warning";
  if (action.includes("CREATED") || action.includes("APPROVED") || action.includes("LOGIN") && !action.includes("FAILED")) return "positive";
  return "neutral";
}

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("");

  const { data: entities } = useQuery({
    queryKey: ["audit-logs", "entities"],
    queryFn: async () => (await api.get("/audit-logs/entities")).data.data as string[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, search, entity],
    queryFn: async () => {
      const res = await api.get("/audit-logs", {
        params: { page, limit: 20, search: search || undefined, entity: entity || undefined },
      });
      return { items: res.data.data as AuditLog[], meta: res.data.meta as PaginationMeta };
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Audit log</h1>
        <p className="text-sm text-ink-muted mt-0.5">Security-relevant activity across EduSphere AI.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search actions…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="sm:max-w-xs" />
        <Select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className="sm:max-w-[180px]">
          <option value="">All entities</option>
          {(entities ?? []).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </Select>
      </div>

      <Card>
        <CardContent className="pt-5 overflow-x-auto scrollbar-thin">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState icon={ScrollText} title="No activity found" description="Nothing matches your filters." />
          ) : (
            <>
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs text-ink-muted border-b border-border">
                    <th className="py-2 font-medium">User</th>
                    <th className="py-2 font-medium">Action</th>
                    <th className="py-2 font-medium">Entity</th>
                    <th className="py-2 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="py-2 text-ink">{log.user?.email ?? "System"}</td>
                      <td className="py-2">
                        <Badge tone={actionTone(log.action)}>{log.action}</Badge>
                      </td>
                      <td className="py-2 text-ink-muted">
                        {log.entity}
                        {log.entityId && <span className="figure text-xs ml-1">#{log.entityId.slice(0, 8)}</span>}
                      </td>
                      <td className="py-2 figure text-ink-muted text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
                limit={data.meta.limit}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
