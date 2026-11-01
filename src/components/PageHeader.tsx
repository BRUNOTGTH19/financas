import type { ReactNode } from 'react';

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-balance text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink/55 sm:text-[15px]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
