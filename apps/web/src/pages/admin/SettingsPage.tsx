import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Database, Download, Plus, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

interface Setting { id: string; key: string; value: string; updatedAt: string }
interface Backup { filename: string; sizeBytes: number; createdAt: string }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function SettingsPanel() {
  const queryClient = useQueryClient();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await api.get("/settings")).data.data as Setting[],
  });

  const saveMutation = useMutation({
    mutationFn: () => api.put("/settings", { key, value }),
    onSuccess: () => {
      toast.success("Setting saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setKey("");
      setValue("");
    },
    onError: () => toast.error("Failed to save setting"),
  });

  const deleteMutation = useMutation({
    mutationFn: (k: string) => api.delete(`/settings/${k}`),
    onSuccess: () => {
      toast.success("Setting removed");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("Failed to remove setting"),
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>System settings</CardTitle>
          <CardDescription>Key-value configuration for platform-wide behavior</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <Label htmlFor="settingKey">Key</Label>
            <Input id="settingKey" placeholder="e.g. school.name" value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="settingValue">Value</Label>
            <Input id="settingValue" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <Button disabled={!key || !value || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save size={15} /> Save setting
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !settings || settings.length === 0 ? (
          <p className="text-sm text-ink-muted py-6 text-center">No custom settings configured yet.</p>
        ) : (
          <div className="space-y-1 pt-2 border-t border-border">
            {settings.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="figure text-sm text-ink">{s.key}</p>
                  <p className="text-xs text-ink-muted">{s.value}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.key)}>
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DownloadBackupButton({ filename }: { filename: string }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await api.get(`/settings/backups/${filename}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download backup");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={downloading} onClick={handleDownload}>
      <Download size={13} />
    </Button>
  );
}

function BackupPanel() {
  const queryClient = useQueryClient();

  const { data: backups, isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: async () => (await api.get("/settings/backups")).data.data as Backup[],
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/settings/backups"),
    onSuccess: () => {
      toast.success("Backup created");
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
    onError: () => toast.error("Failed to create backup"),
  });

  return (
    <Card>
      <CardHeader className="items-center">
        <div>
          <CardTitle>Database backup</CardTitle>
          <CardDescription>Portable JSON export of all core tables</CardDescription>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          <Plus size={15} /> Create backup
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !backups || backups.length === 0 ? (
          <div className="py-12 text-center">
            <Database className="mx-auto text-ink-muted mb-3" size={24} />
            <p className="text-sm text-ink-muted">No backups yet.</p>
          </div>
        ) : (
          backups.map((b) => (
            <div key={b.filename} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="figure text-sm text-ink">{b.filename}</p>
                <p className="text-xs text-ink-muted">
                  {new Date(b.createdAt).toLocaleString()} · {formatBytes(b.sizeBytes)}
                </p>
              </div>
              <DownloadBackupButton filename={b.filename} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Settings</h1>
        <p className="text-sm text-ink-muted mt-0.5">Platform configuration and data backup</p>
      </div>
      <SettingsPanel />
      <BackupPanel />
    </div>
  );
}
