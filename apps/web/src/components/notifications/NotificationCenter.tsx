import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export interface NotificationItem {
  id: string;
  type: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const SOUND_PREF_KEY = "edusphere:notif-sound";

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not available — never block the UI on it.
  }
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_PREF_KEY) === "1");
  const [interacted, setInteracted] = useState(false);
  const queryClient = useQueryClient();
  const lastSeenIdRef = useRef<string | null>(null);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    function markInteracted() {
      setInteracted(true);
      window.removeEventListener("click", markInteracted);
      window.removeEventListener("keydown", markInteracted);
    }
    window.addEventListener("click", markInteracted);
    window.addEventListener("keydown", markInteracted);
    return () => {
      window.removeEventListener("click", markInteracted);
      window.removeEventListener("keydown", markInteracted);
    };
  }, []);

  const { data } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const res = await api.get("/notifications", { params: { page: 1, limit: 20 } });
      return { items: res.data.data as NotificationItem[], unreadCount: (res.data.meta?.unreadCount as number) ?? 0 };
    },
    refetchInterval: 20_000,
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Toast + optional sound on genuinely new items (not on first load).
  useEffect(() => {
    if (!items.length) return;
    const newest = items[0];
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      lastSeenIdRef.current = newest.id;
      return;
    }
    if (lastSeenIdRef.current && newest.id !== lastSeenIdRef.current && !newest.isRead) {
      toast(newest.title, { description: newest.message });
      if (soundOn && interacted) playChime();
    }
    lastSeenIdRef.current = newest.id;
  }, [items, soundOn, interacted]);

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const removeNotification = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(SOUND_PREF_KEY, next ? "1" : "0");
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger animate-pulse" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-[22rem] max-w-[90vw] rounded-lg border border-border bg-surface shadow-popover animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleSound}
                  title={soundOn ? "Sound on" : "Sound off"}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                >
                  {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    title="Mark all as read"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto scrollbar-thin divide-y divide-border">
              {items.length === 0 ? (
                <EmptyState title="You're all caught up" description="No notifications yet." />
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={cn("px-4 py-3 flex items-start gap-3", !n.isRead && "bg-primary/5")}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                        n.priority === "HIGH" ? "bg-danger" : n.isRead ? "bg-transparent" : "bg-primary"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{n.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-ink-muted mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.isRead && (
                        <button
                          type="button"
                          title="Mark as read"
                          onClick={() => markRead.mutate(n.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => removeNotification.mutate(n.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="px-4 py-2 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
