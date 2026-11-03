import type { ReactNode } from 'react';

export type BadgeTone = 'ok' | 'attention' | 'over' | 'neutral' | 'info' | 'lime';

const toneClasses: Record<BadgeTone, string> = {
  ok: 'bg-brand-50 text-brand-700 dark:bg-brand-400/15 dark:text-brand-200',
  attention: 'bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200',
  over: 'bg-rose-50 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200',
  neutral: 'bg-ink/5 text-ink/50',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200',
  lime: 'bg-lime/60 text-brand-950 dark:bg-lime dark:text-brand-950',
};

export default function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`chip ${toneClasses[tone]} ${className}`}>{children}</span>;
}
