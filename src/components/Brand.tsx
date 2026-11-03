import { Link } from 'react-router-dom';
import { WalletIcon } from './icons';

export default function Brand({ to, compact = false }: { to: string; compact?: boolean }) {
  return (
    <Link to={to} className="group flex items-center gap-3" aria-label="Spendly — início">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-950 text-lime shadow-sm transition group-hover:bg-brand-900 dark:bg-lime dark:text-brand-950 dark:group-hover:bg-lime/90">
        <WalletIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[17px] font-extrabold leading-none tracking-[-0.02em] text-ink">
          Spendly
        </span>
        {!compact ? (
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
            Plano semanal
          </span>
        ) : null}
      </span>
    </Link>
  );
}
