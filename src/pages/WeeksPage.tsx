import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Badge, { type BadgeTone } from '../components/Badge';
import PageHeader from '../components/PageHeader';
import ProgressBar, { type ProgressTone } from '../components/ProgressBar';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarIcon,
  InfoIcon,
  PlusIcon,
  WalletIcon,
} from '../components/icons';
import { calculateMonthBudget } from '../domain/budget';
import { getCurrentWeekIndex } from '../domain/calendar';
import type { WeekBudget, WeekStatus } from '../domain/types';
import { useMonth } from '../hooks/useMonth';
import { currentMonthKey, todayIso } from '../lib/dates';
import { formatCents, formatPercent } from '../lib/money';
import { monthPath } from '../lib/navigation';
import { useFinanceStore } from '../store/financeStore';

const statusMeta: Record<WeekStatus, { label: string; tone: BadgeTone; progress: ProgressTone }> = {
  ok: { label: 'Dentro do teto', tone: 'ok', progress: 'brand' },
  attention: { label: 'Atenção', tone: 'attention', progress: 'amber' },
  over: { label: 'Estourou', tone: 'over', progress: 'rose' },
};

type WeekRelation = 'past' | 'current' | 'future';

function resolveWeekRelation(
  weekIndex: number,
  currentWeekIndex: number | null,
  month: string,
  todayMonth: string,
): WeekRelation {
  if (currentWeekIndex !== null) {
    if (weekIndex < currentWeekIndex) return 'past';
    if (weekIndex > currentWeekIndex) return 'future';
    return 'current';
  }
  return month < todayMonth ? 'past' : 'future';
}

function dailyHint(week: WeekBudget, relation: WeekRelation, todayDay: number): string {
  if (relation === 'past') return 'Semana encerrada.';
  if (week.cap <= 0) {
    return week.spent > 0 ? 'Não havia teto disponível para esta semana.' : 'Sem teto disponível.';
  }
  if (week.status === 'over') return 'O teto já foi ultrapassado. Segure os gastos até a virada.';

  const daysLeft =
    relation === 'current' ? Math.max(1, week.week.endDay - todayDay + 1) : week.week.dayCount;
  const perDay = Math.floor(Math.max(0, week.remaining) / daysLeft);

  return relation === 'current'
    ? `${formatCents(perDay)} por dia para os ${daysLeft} ${daysLeft === 1 ? 'dia restante' : 'dias restantes'}.`
    : `${formatCents(perDay)} por dia durante a semana.`;
}

function AlertCard({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'rose' | 'amber' | 'sky';
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const toneClasses = {
    rose: 'border-rose-200 bg-rose-50/80 text-rose-900',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-900',
    sky: 'border-sky-200 bg-sky-50/80 text-sky-900',
  };

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm ${toneClasses[tone]}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold tracking-tight">{title}</p>
        <div className="mt-0.5 text-[13px] font-medium opacity-75">{children}</div>
      </div>
    </div>
  );
}

export default function WeeksPage() {
  const month = useMonth();
  const incomes = useFinanceStore((state) => state.incomes);
  const fixedExpenses = useFinanceStore((state) => state.fixedExpenses);
  const expenses = useFinanceStore((state) => state.expenses);

  const today = todayIso();
  const todayMonth = currentMonthKey();
  const todayDay = Number(today.slice(8, 10));
  const currentWeekIndex = getCurrentWeekIndex(today, month);
  const salary = incomes.find((income) => income.month === month)?.amount ?? 0;

  const budget = calculateMonthBudget({ month, salary, fixedExpenses, expenses });
  const currentWeek = currentWeekIndex
    ? budget.weeks.find((week) => week.week.index === currentWeekIndex)
    : undefined;
  const weeklyAverage = Math.floor(Math.max(0, budget.availableForCaps) / budget.weeks.length);
  const overWeeks = budget.weeks.filter((week) => week.status === 'over').length;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Ritmo do mês"
        title="Semanas do mês"
        description="O que sobra da renda depois dos fixos vira o teto de cada semana. A última absorve os dias extras do calendário."
        action={
          <Link to={monthPath(month, 'gastos')} className="btn-lime">
            <PlusIcon className="h-4 w-4" />
            Registrar gasto
          </Link>
        }
      />

      {budget.salary <= 0 ? (
        <AlertCard
          tone="sky"
          icon={<InfoIcon className="h-5 w-5" />}
          title="Defina sua renda para liberar os tetos"
        >
          <p>Sem salário informado, todas as semanas ficam com teto zerado.</p>
          <Link
            to={monthPath(month, 'configuracoes')}
            className="mt-1.5 inline-flex items-center gap-1 font-bold underline-offset-2 hover:underline"
          >
            Informar renda do mês
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </AlertCard>
      ) : budget.overcommitted ? (
        <AlertCard
          tone="rose"
          icon={<AlertTriangleIcon className="h-5 w-5" />}
          title="Os fixos consomem toda a renda"
        >
          <p>
            São {formatCents(budget.totalFixed)} em fixos para {formatCents(budget.salary)} de
            renda. Revise os compromissos antes de contar com os tetos semanais.
          </p>
        </AlertCard>
      ) : currentWeek?.status === 'over' ? (
        <AlertCard
          tone="rose"
          icon={<AlertTriangleIcon className="h-5 w-5" />}
          title={`A semana ${currentWeek.week.index} passou do teto em ${formatCents(
            Math.abs(currentWeek.remaining),
          )}`}
        >
          <p>Segure os gastos até o dia {currentWeek.week.endDay} para não agravar o estouro.</p>
        </AlertCard>
      ) : currentWeek?.status === 'attention' ? (
        <AlertCard
          tone="amber"
          icon={<AlertTriangleIcon className="h-5 w-5" />}
          title={`A semana ${currentWeek.week.index} chegou a ${formatPercent(
            currentWeek.percent / 100,
          )} do teto`}
        >
          <p>
            Restam {formatCents(Math.max(0, currentWeek.remaining))} até o dia{' '}
            {currentWeek.week.endDay}.
          </p>
        </AlertCard>
      ) : overWeeks > 0 ? (
        <AlertCard
          tone="amber"
          icon={<AlertTriangleIcon className="h-5 w-5" />}
          title={`${overWeeks} ${overWeeks === 1 ? 'semana estourou' : 'semanas estouraram'} o teto`}
        >
          <p>Confira abaixo o que aconteceu e ajuste o ritmo das próximas semanas.</p>
        </AlertCard>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Resumo das semanas">
        <div className="relative overflow-hidden rounded-3xl bg-brand-950 p-5 text-white shadow-float sm:p-6">
          <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-lime/10 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
            <CalendarIcon className="h-3.5 w-3.5" />
            Disponível para as semanas
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight money">
            {formatCents(Math.max(0, budget.availableForCaps))}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/45">
            {formatCents(budget.salary)} de renda − {formatCents(budget.totalFixed)} de fixos
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="chip bg-lime/15 text-lime">{budget.weeks.length} semanas</span>
            <span className="text-xs text-white/45">
              média de {formatCents(weeklyAverage)} por semana
            </span>
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/35">
              Uso do disponível
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <WalletIcon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-3xl font-extrabold tracking-tight money">
              {formatCents(budget.totalSpent)}
            </p>
            <p className="pb-1 text-xs font-semibold text-ink/40">
              de {formatCents(Math.max(0, budget.availableForCaps))}
            </p>
          </div>
          <ProgressBar
            value={budget.spentPercent}
            tone={budget.balance < 0 ? 'rose' : budget.spentPercent >= 80 ? 'amber' : 'brand'}
            className="mt-4"
            label="Uso do disponível do mês"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-ink/40">
            <span>{formatPercent(budget.spentPercent / 100)} usado</span>
            <span className={budget.balance < 0 ? 'text-rose-600' : 'text-brand-700'}>
              {budget.balance < 0
                ? `Estourou ${formatCents(Math.abs(budget.balance))}`
                : `${formatCents(budget.balance)} de saldo`}
            </span>
          </div>
          <p className="mt-3 hint">
            {budget.salary <= 0
              ? 'Informe sua renda para transformar o restante em tetos semanais.'
              : budget.balance < 0
                ? 'O gasto do mês já passou do que sobrava dos fixos. Priorize o essencial até o fim.'
                : 'Some os gastos da semana para saber quando o ritmo precisa diminuir.'}
          </p>
        </div>
      </section>

      <section aria-labelledby="weeks-title" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="weeks-title" className="text-sm font-extrabold tracking-tight">
              Teto por semana
            </h2>
            <p className="mt-0.5 text-xs font-medium text-ink/35">
              Semanas de 7 dias; a última fecha no fim do mês.
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge tone="ok">Dentro do teto</Badge>
            <Badge tone="attention">Atenção</Badge>
            <Badge tone="over">Estourou</Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {budget.weeks.map((week) => {
            const relation = resolveWeekRelation(
              week.week.index,
              currentWeekIndex,
              month,
              todayMonth,
            );
            const isCurrent = relation === 'current';
            const hasCap = week.cap > 0;
            const meta = statusMeta[week.status];
            const status =
              !hasCap && week.spent === 0
                ? { label: 'Sem teto', tone: 'neutral' as const, progress: 'ink' as const }
                : meta;

            return (
              <article
                key={week.week.index}
                aria-label={`Semana ${week.week.index}: ${week.week.label}`}
                className={`card p-4 transition sm:p-5 ${
                  isCurrent ? 'ring-2 ring-brand-950/10 ring-offset-2 ring-offset-cream' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-[15px] font-extrabold tracking-tight">
                        Semana {week.week.index}
                      </h3>
                      {isCurrent ? <Badge tone="lime">Atual</Badge> : null}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-ink/40">
                      Dias {week.week.label} · {week.week.dayCount} dias
                    </p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>

                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink/30">
                      Gasto
                    </p>
                    <p className="mt-1 text-xl font-extrabold tracking-tight money">
                      {formatCents(week.spent)}
                    </p>
                  </div>
                  <p className="pb-0.5 text-xs font-semibold text-ink/40">
                    de {formatCents(week.cap)}
                  </p>
                </div>

                <ProgressBar
                  value={week.percent}
                  tone={status.progress}
                  className="mt-3"
                  label={`Uso da semana ${week.week.index}`}
                />

                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold">
                  <span className="text-ink/35">
                    {hasCap || week.spent > 0
                      ? `${formatPercent(week.percent / 100)} do teto`
                      : 'Teto não definido'}
                  </span>
                  <span className={week.remaining < 0 ? 'text-rose-600' : 'text-brand-700'}>
                    {week.remaining < 0
                      ? `Excedeu ${formatCents(Math.abs(week.remaining))}`
                      : `Livre ${formatCents(week.remaining)}`}
                  </span>
                </div>

                <p className="mt-4 border-t border-ink/[0.05] pt-3 text-[11px] font-semibold text-ink/35">
                  {dailyHint(week, relation, todayDay)}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {budget.weeks.length === 0 ? null : (
        <p className="text-center text-xs font-medium text-ink/30">
          Os tetos mudam automaticamente quando a renda, os fixos ou os gastos são atualizados.
        </p>
      )}
    </div>
  );
}
