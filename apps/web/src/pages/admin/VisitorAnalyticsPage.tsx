import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from "recharts";
import { Users, Clock, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface Analytics {
  visitorsToday: number;
  visitorsThisWeek: number;
  visitorsThisMonth: number;
  avgSessionDurationSeconds: number;
  mostVisitedPages: Array<{ path: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  trend: Array<{ date: string; visitors: number }>;
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-5 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-ink-muted">{label}</p>
          <p className="figure text-xl font-semibold text-ink">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

export function VisitorAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["visitor-analytics"],
    queryFn: async () => (await api.get("/visitor/analytics")).data.data as Analytics,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Visitor analytics</h1>
        <p className="text-sm text-ink-muted mt-0.5">Anonymous, privacy-conscious traffic on the public landing pages.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Visitors today" value={data.visitorsToday} />
        <StatCard icon={Users} label="This week" value={data.visitorsThisWeek} />
        <StatCard icon={Users} label="This month" value={data.visitorsThisMonth} />
        <StatCard icon={Clock} label="Avg. session" value={formatDuration(data.avgSessionDurationSeconds)} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Visitors — last 14 days</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "rgb(var(--ink-muted))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <RTooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="visitors" stroke="rgb(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Most visited pages</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.mostVisitedPages.length === 0 ? (
              <EmptyState icon={Globe} title="No page views yet" />
            ) : (
              data.mostVisitedPages.map((p) => (
                <div key={p.path} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="text-ink truncate">{p.path}</span>
                  <span className="figure text-ink-muted">{p.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Device breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.deviceBreakdown.length === 0 ? (
              <EmptyState title="No sessions yet" />
            ) : (
              data.deviceBreakdown.map((d) => (
                <div key={d.device} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="text-ink">{d.device}</span>
                  <span className="figure text-ink-muted">{d.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
