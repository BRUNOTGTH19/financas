export type ProgressTone = 'brand' | 'amber' | 'rose' | 'lime' | 'ink';

const trackClasses: Record<ProgressTone, string> = {
  brand: 'bg-brand-100',
  amber: 'bg-amber-100',
  rose: 'bg-rose-100',
  lime: 'bg-lime/30',
  ink: 'bg-white/15',
};

const fillClasses: Record<ProgressTone, string> = {
  brand: 'bg-brand-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  lime: 'bg-lime',
  ink: 'bg-ink',
};

export default function ProgressBar({
  value,
  tone = 'brand',
  className = '',
  label,
}: {
  value: number;
  tone?: ProgressTone;
  className?: string;
  label?: string;
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const clamped = Math.max(0, Math.min(100, safeValue));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={`h-2 overflow-hidden rounded-full ${trackClasses[tone]} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${fillClasses[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
