import { useQuery } from "@tanstack/react-query";
import { FileText, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

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

export function StudentMaterialsPage() {
  const { data: materials, isLoading } = useQuery({
    queryKey: ["study-materials", "student"],
    queryFn: async () => (await api.get("/study-materials", { params: { page: 1, limit: 30 } })).data.data as Material[],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Study material</h1>
        <p className="text-sm text-ink-muted mt-0.5">Notes and resources shared by your teachers</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !materials || materials.length === 0 ? (
        <Card className="py-16 text-center">
          <FileText className="mx-auto text-ink-muted mb-3" size={24} />
          <p className="text-sm text-ink-muted">No study material available yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {materials.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{m.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{m.subject.name} · {m.teacher.fullName}</p>
                    {m.description && <p className="text-sm text-ink-muted mt-2 line-clamp-2">{m.description}</p>}
                  </div>
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button variant="outline" size="icon"><Download size={14} /></Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
