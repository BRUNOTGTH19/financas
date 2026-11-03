import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge, { type BadgeTone } from '../components/Badge';
import PageHeader from '../components/PageHeader';
import ProgressBar, { type ProgressTone } from '../components/ProgressBar';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BanknoteIcon,
  CalendarIcon,
  CopyIcon,
  InfoIcon,
  PlusIcon,
  ReceiptIcon,
  RepeatIcon,
  TrendUpIcon,
} from '../components/icons';
import { calculateMonthBudget } from '../domain/budget';
import { getCurrentWeekIndex } from '../domain/calendar';
import { projectMonth } from '../domain/projection';
import { buildAiSummary } from '../domain/summary';
import type { MonthProjection, WeekStatus } from '../domain/types';
import { useMonth } from '../hooks/useMonth';
import { todayIso } from '../lib/dates';
import { formatCents, formatPercent } from '../lib/money';
import { monthPath } from '../lib/navigation';
import { useFinanceStore } from '../store/financeStore';

const weekStatusMeta: Record<
  WeekStatus,
  { label: string; tone: BadgeTone; progress: ProgressTone }
> = {
  ok: { label: 'Dentro do teto', tone: 'ok', progress: 'brand' },
  attention: { label: 'Atenção', tone: 'attention', progress: 'amber' },
  over: { label: 'Estourou', tone: 'over', progress: 'rose' },
};

const phaseLabel = {
  past: 'Mês encerrado',
  current: 'Mês em andamento',
  future: 'Planejamento',
} as const;

function projectionHeadline(projection: MonthProjection, hasGoal: boolean): string {
  if (projection.status === 'sem_renda') return 'Informe a renda para projetar o mês.';
  if (!hasGoal) return 'Sobra projetada no ritmo atual.';
  if (projection.status === 'meta_atingida') {
    if (projection.phase === 'past') return 'Meta preservada no fechamento.';
    if (projection.phase === 'future') return 'O planejamento já cobre a meta.';
    return 'No ritmo atual, a meta está garantida.';
  }
  if (projection.phase === 'past') return 'A meta não foi atingida no fechamento.';
  if (projection.phase === 'future') return 'O planejamento ainda não cobre a meta.';
  return 'No ritmo atual, a meta fica em risco.';
}

function projectionDetail(projection: MonthProjection, hasGoal: boolean): string {
  if (projection.status === 'sem_renda') return 'Os tetos e a projeção dependem da renda do mês.';
  if (!hasGoal) {
    return 'Defina uma meta de sobra nos ajustes para acompanhar a folga do mês.';
  }
  if (projection.goalGap > 0) {
    return `${formatCents(projection.goalGap)} acima da meta de ${formatCents(
      projection.savingsGoal,
    )}.`;
  }
  if (projection.goalGap < 0) {
    return `Faltam ${formatCents(Math.abs(projection.goalGap))} para a meta de ${formatCents(
      projection.savingsGoal,
    )}.`;
  }
  return `A meta de ${formatCents(projection.savingsGoal)} deve ser atingida no ritmo atual.`;
}

function projectionTone(projection: MonthProjection, hasGoal: boolean): BadgeTone {
  if (!hasGoal || projection.status === 'sem_renda') return 'neutral';
  if (projection.status === 'meta_atingida') return 'ok';
  return projection.projectedBalance < 0 ? 'over' : 'attention';
}

export default function DashboardPage() {
  const month = useMonth();
  const incomes = useFinanceStore((state) => state.incomes);
  const fixedExpenses = useFinanceStore((state) => state.fixedExpenses);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingsGoal = useFinanceStore((state) => state.settings.savingsGoal);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const today = todayIso();
  const todayDay = Number(today.slice(8, 10));
  const salary = incomes.find((income) => income.month === month)?.amount ?? 0;
  const budget = calculateMonthBudget({ month, salary, fixedExpenses, expenses });
  const projection = projectMonth({ budget, savingsGoal, today });
  const currentWeekIndex = getCurrentWeekIndex(today, month);
  const currentWeek = currentWeekIndex
    ? budget.weeks.find((week) => week.week.index === currentWeekIndex)
    : undefined;
  const hasGoal = savingsGoal > 0;
  const monthExpenseCount = expenses.filter((expense) => expense.date.slice(0, 7) === month).length;
  const currentWeekMeta = !currentWeek
    ? null
    : currentWeek.cap <= 0 && currentWeek.spent === 0
      ? { label: 'Sem teto', tone: 'neutral' as const, progress: 'ink' as const }
      : weekStatusMeta[currentWeek.status];
  const currentWeekRemaining = currentWeek ? Math.max(0, currentWeek.remaining) : 0;
  const currentWeekDaysLeft = currentWeek ? Math.max(1, currentWeek.week.endDay - todayDay + 1) : 0;
  const currentWeekDaily =
    currentWeek && currentWeek.cap > 0 ? Math.floor(currentWeekRemaining / currentWeekDaysLeft) : 0;

  async function handleCopySummary() {
    const summary = buildAiSummary({ budget, savingsGoal, today });

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard indisponível');
      }
      await navigator.clipboard.writeText(summary);
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Visão geral"
        title="Seu mês em uma olhada"
        description="Renda, fixos e o ritmo das semanas juntos para você decidir com calma antes de gastar."
        action={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={handleCopySummary}>
                <CopyIcon className="h-4 w-4" />
                Copiar resumo para IA
              </button>
              <Link to={monthPath(month, 'gastos')} className="btn-lime">
                <PlusIcon className="h-4 w-4" />
                Registrar gasto
              </Link>
            </div>
            {copyStatus === 'success' ? (
              <p role="status" className="text-xs font-semibold text-brand-700">
                Copiado!
              </p>
            ) : copyStatus === 'error' ? (
              <p role="alert" className="text-xs font-semibold text-rose-600">
                Não foi possível copiar. Verifique a permissão do navegador.
              </p>
            ) : null}
          </div>
        }
      />

      {budget.salary <= 0 ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3.5 text-sky-900 sm:flex-row sm:items-center"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100">
            <InfoIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold tracking-tight">Falta informar a renda do mês</p>
            <p className="mt-0.5 text-[13px] font-medium opacity-70">
              Sem ela, os tetos ficam zerados e a projeção não consegue calcular a sobra.
            </p>
          </div>
          <Link
            to={monthPath(month, 'configuracoes')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-900 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-sky-800"
          >
            Definir renda
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : budget.overcommitted ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3.5 text-rose-900"
        >
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-extrabold tracking-tight">Os fixos passam da renda</p>
            <p className="mt-0.5 text-[13px] font-medium opacity-70">
              Reduza ou negocie os compromissos antes de contar com os tetos semanais.
            </p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="relative overflow-hidden rounded-3xl bg-brand-950 p-5 text-white shadow-float sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-lime/10 blur-3xl" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              <BanknoteIcon className="h-3.5 w-3.5" />
              Disponível após os fixos
            </div>
            <span className="chip bg-lime/15 text-lime">{budget.weeks.length} semanas</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold tracking-tight money">
            {formatCents(budget.availableForCaps)}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/45">
            {formatCents(budget.salary)} de renda − {formatCents(budget.totalFixed)} de fixos
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-white/45">
              <span>Gasto até agora</span>
              <span>{formatPercent(budget.spentPercent / 100)}</span>
            </div>
            <ProgressBar
              value={budget.spentPercent}
              tone={budget.balance < 0 ? 'rose' : 'lime'}
              className="mt-2"
              label="Uso do disponível do mês"
            />
            <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold">
              <span className="text-white/60">{formatCents(budget.totalSpent)} gastos</span>
              <span className={budget.balance < 0 ? 'text-rose-300' : 'text-lime'}>
                {budget.balance < 0
                  ? `Estourou ${formatCents(Math.abs(budget.balance))}`
                  : `Sobra ${formatCents(budget.balance)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/35">
              Projeção de fim de mês
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <TrendUpIcon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge tone={projectionTone(projection, hasGoal)}>{phaseLabel[projection.phase]}</Badge>
            {hasGoal ? <Badge tone="lime">Meta {formatCents(savingsGoal)}</Badge> : null}
          </div>

          <p className="mt-3 text-[15px] font-extrabold leading-snug tracking-tight">
            {projectionHeadline(projection, hasGoal)}
          </p>

          {projection.status !== 'sem_renda' ? (
            <>
              <p className="mt-2 text-2xl font-extrabold tracking-tight money">
                {formatCents(projection.projectedBalance)}
              </p>
              <p className="text-[11px] font-semibold text-ink/35">de sobra projetada</p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-ink/45">
                {projectionDetail(projection, hasGoal)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-ink/[0.05] pt-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink/30">
                    Ritmo diário
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold money">
                    {formatCents(projection.dailyPace)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink/30">
                    {projection.phase === 'past' ? 'Gasto total' : 'Pode gastar/dia'}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold money">
                    {formatCents(
                      projection.phase === 'past' ? budget.totalSpent : projection.safeDailySpend,
                    )}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs font-medium leading-relaxed text-ink/45">
              {projectionDetail(projection, hasGoal)}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumo do mês">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink/35">
              Renda do mês
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime/40 text-brand-800">
              <BanknoteIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-xl font-extrabold tracking-tight money">
            {formatCents(budget.salary)}
          </p>
          <Link
            to={monthPath(month, 'configuracoes')}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 transition hover:text-brand-900"
          >
            {budget.salary > 0 ? 'Ajustar renda' : 'Informar renda'}
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink/35">
              Fixos ativos
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <RepeatIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-xl font-extrabold tracking-tight money">
            {formatCents(budget.totalFixed)}
          </p>
          <Link
            to={monthPath(month, 'fixos')}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 transition hover:text-brand-900"
          >
            {budget.activeFixed.length} {budget.activeFixed.length === 1 ? 'fixo' : 'fixos'} · ver
            todos
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink/35">
              Gastos variáveis
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ReceiptIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-xl font-extrabold tracking-tight money">
            {formatCents(budget.totalSpent)}
          </p>
          <Link
            to={monthPath(month, 'gastos')}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 transition hover:text-brand-900"
          >
            {monthExpenseCount} {monthExpenseCount === 1 ? 'lançamento' : 'lançamentos'} · ver
            gastos
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      </section>

      <section className="card p-4 sm:p-5" aria-label="Semana atual">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <CalendarIcon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">Semana atual</h2>
              <p className="mt-0.5 text-xs font-medium text-ink/35">
                {currentWeek
                  ? `Semana ${currentWeek.week.index} · dias ${currentWeek.week.label}`
                  : phaseLabel[projection.phase]}
              </p>
            </div>
          </div>
          {currentWeek && currentWeekMeta ? (
            <Badge tone={currentWeekMeta.tone}>{currentWeekMeta.label}</Badge>
          ) : null}
        </div>

        {currentWeek ? (
          <div className="mt-4">
            <div className="flex items-end justify-between gap-3">
              <p className="text-xl font-extrabold tracking-tight money">
                {formatCents(currentWeek.spent)}
              </p>
              <p className="pb-0.5 text-xs font-semibold text-ink/40">
                de {formatCents(currentWeek.cap)}
              </p>
            </div>
            <ProgressBar
              value={currentWeek.percent}
              tone={currentWeekMeta?.progress ?? 'ink'}
              className="mt-2"
              label="Uso da semana atual"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold">
              <span className={currentWeek.remaining < 0 ? 'text-rose-600' : 'text-brand-700'}>
                {currentWeek.remaining < 0
                  ? `Excedeu ${formatCents(Math.abs(currentWeek.remaining))}`
                  : `Livre ${formatCents(currentWeek.remaining)}`}
              </span>
              <span className="text-ink/35">
                {currentWeek.cap > 0 && currentWeek.remaining >= 0
                  ? `${formatCents(currentWeekDaily)} por dia até o dia ${currentWeek.week.endDay}`
                  : currentWeek.remaining < 0
                    ? 'Segure os gastos até a virada da semana'
                    : 'Sem teto definido para esta semana'}
              </span>
            </div>
            <Link
              to={monthPath(month, 'semanas')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-700 transition hover:text-brand-900"
            >
              Ver todas as semanas
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3 border-t border-ink/[0.05] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-ink/45">
              {projection.phase === 'past'
                ? 'O mês já fechou. Confira o teto e o gasto de cada semana no histórico.'
                : 'As semanas ainda vão começar. Veja como o disponível foi dividido.'}
            </p>
            <Link
              to={monthPath(month, 'semanas')}
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-extrabold text-brand-700 transition hover:text-brand-900"
            >
              Ver semanas
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
