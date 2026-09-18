import { cn } from "@/lib/utils";

interface GradeRingProps {
  /** 0-100 */
  value: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function toneForValue(value: number): string {
  if (value >= 85) return "rgb(var(--accent))";
  if (value >= 70) return "rgb(var(--positive))";
  if (value >= 50) return "rgb(var(--warning))";
  return "rgb(var(--danger))";
}

/**
 * The signature visual motif of EduSphere AI: every percentage-based metric
 * (GPA normalized to 100, attendance %, assignment completion) renders
 * through this same ring, so a student, teacher, or admin learns to read
 * "the ring" once and recognizes it everywhere in the product.
 */
export function GradeRing({ value, label, sublabel, size = 96, strokeWidth = 8, className }: GradeRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = toneForValue(clamped);

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="figure text-lg font-semibold text-ink leading-none">{Math.round(clamped)}</span>
          {sublabel && <span className="text-[10px] text-ink-muted mt-0.5">{sublabel}</span>}
        </div>
      </div>
      <span className="text-xs font-medium text-ink-muted text-center">{label}</span>
    </div>
  );
}
