import { Construction } from "lucide-react";

export function NotYetBuilt({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 rounded-lg border border-dashed border-border">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-muted mb-4">
        <Construction size={20} />
      </div>
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      <p className="text-sm text-ink-muted mt-1 max-w-sm">
        This screen is scheduled for the next build phase and isn't wired up yet. The API endpoints
        behind it are already live.
      </p>
    </div>
  );
}
