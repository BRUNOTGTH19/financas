import { useLocation, useNavigate } from 'react-router-dom';
import { addMonthsToMonthKey, monthLabel } from '../domain/calendar';
import { currentMonthKey, formatMonthShort } from '../lib/dates';
import { monthPath, sectionFromPath } from '../lib/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

export default function MonthSwitcher({ month }: { month: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const section = sectionFromPath(location.pathname);
  const currentMonth = currentMonthKey();

  const goToMonth = (targetMonth: string) => {
    navigate(monthPath(targetMonth, section));
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-ink/[0.07] bg-paper p-1 shadow-sm">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/5 hover:text-ink"
          onClick={() => goToMonth(addMonthsToMonthKey(month, -1))}
          aria-label="Mês anterior"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span
          aria-live="polite"
          className="min-w-[5.5rem] px-1 text-center text-sm font-extrabold tracking-tight text-ink sm:min-w-[8.5rem]"
        >
          <span className="hidden sm:inline">{monthLabel(month)}</span>
          <span className="sm:hidden">{formatMonthShort(month)}</span>
        </span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/5 hover:text-ink"
          onClick={() => goToMonth(addMonthsToMonthKey(month, 1))}
          aria-label="Próximo mês"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      {month !== currentMonth ? (
        <button
          type="button"
          className="btn-ghost btn-sm hidden px-3 sm:inline-flex"
          onClick={() => goToMonth(currentMonth)}
        >
          Hoje
        </button>
      ) : null}
    </div>
  );
}
