import type { ReactNode } from 'react';

export type BadgeTone = 'ok' | 'attention' | 'over' | 'neutral' | 'info' | 'lime';

const toneClasses: Record<BadgeTone, string> = {
  ok: 'bg-brand-50 text-brand-700',
  attention: 'bg-amber-50 text-amber-700',
  over: 'bg-rose-50 text-rose-700',
  neutral: 'bg-ink/5 text-ink/50',
  info: 'bg-sky-50 text-sky-700',
  lime: 'bg-lime/60 text-brand-950',
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
