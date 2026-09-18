import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const options = [
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "dark" as const, icon: Moon, label: "Dark" },
  { value: "system" as const, icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-surface-2 p-0.5">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-label={`Use ${opt.label.toLowerCase()} theme`}
            aria-pressed={active}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              active ? "bg-surface text-ink shadow-soft" : "text-ink-muted hover:text-ink"
            )}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
