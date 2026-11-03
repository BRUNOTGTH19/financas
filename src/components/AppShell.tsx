import { NavLink, Outlet } from 'react-router-dom';
import { monthPath, NAV_ITEMS, type Section } from '../lib/navigation';
import Brand from './Brand';
import MonthSwitcher from './MonthSwitcher';
import {
  CalendarIcon,
  HomeIcon,
  ReceiptIcon,
  RepeatIcon,
  SettingsIcon,
  SparklesIcon,
} from './icons';

const navIcons: Record<Section, (props: { className?: string }) => JSX.Element> = {
  inicio: HomeIcon,
  semanas: CalendarIcon,
  gastos: ReceiptIcon,
  fixos: RepeatIcon,
  configuracoes: SettingsIcon,
};

export default function AppShell({ month }: { month: string }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-ink/[0.06] bg-cream/60 px-5 py-7 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="px-2">
          <Brand to={monthPath(month, 'inicio')} />
        </div>

        <nav aria-label="Navegação principal" className="mt-10 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = navIcons[item.section];
            return (
              <NavLink
                key={item.section}
                to={monthPath(month, item.section)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition ${
                    isActive
                      ? 'bg-brand-950 text-white shadow-card dark:bg-lime dark:text-brand-950 dark:shadow-none'
                      : 'text-ink/55 hover:bg-white/70 hover:text-ink dark:hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-[18px] w-[18px] ${isActive ? 'text-lime dark:text-brand-900' : ''}`}
                    />
                    <span>{item.label}</span>
                    {isActive ? (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-lime dark:bg-brand-900" />
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl bg-brand-900 p-5 text-white dark:border dark:border-white/10">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/15 text-lime">
            <SparklesIcon className="h-4 w-4" />
          </span>
          <p className="mt-4 text-sm font-extrabold leading-snug">Pague à vista.</p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            PIX e débito mantêm seu teto semanal sob controle.
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-ink/[0.05] bg-cream/85 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
            <div className="lg:hidden">
              <Brand to={monthPath(month, 'inicio')} compact />
            </div>
            <p className="hidden text-[11px] font-extrabold uppercase tracking-[0.18em] text-ink/35 lg:block">
              Planejamento do mês
            </p>
            <MonthSwitcher month={month} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          <Outlet />
        </main>

        <nav
          aria-label="Navegação principal"
          className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-ink/[0.06] bg-paper/95 backdrop-blur-md lg:hidden"
        >
          <div className="grid grid-cols-5 px-1.5 py-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = navIcons[item.section];
              return (
                <NavLink
                  key={item.section}
                  to={monthPath(month, item.section)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-bold transition ${
                      isActive ? 'text-brand-950 dark:text-lime' : 'text-ink/40'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-8 w-11 items-center justify-center rounded-xl transition ${
                          isActive ? 'bg-lime/70 text-brand-950 dark:bg-lime' : 'text-ink/40'
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span>{item.shortLabel}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
