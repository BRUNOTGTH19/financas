import type { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
        {icon}
      </div>
      <h2 className="text-lg font-extrabold tracking-tight text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink/50">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
