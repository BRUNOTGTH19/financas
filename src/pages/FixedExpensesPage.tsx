import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge, { type BadgeTone } from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import FixedExpenseForm from '../components/FixedExpenseForm';
import PageHeader from '../components/PageHeader';
import ProgressBar, { type ProgressTone } from '../components/ProgressBar';
import {
  ArrowRightIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  RepeatIcon,
  WalletIcon,
} from '../components/icons';
import { isFixedActiveInMonth, totalFixedForMonth } from '../domain/budget';
import type { FixedExpense } from '../domain/types';
import { useMonth } from '../hooks/useMonth';
import { formatMonthShort } from '../lib/dates';
import { formatCents, formatPercent } from '../lib/money';
import { monthPath } from '../lib/navigation';
import { useFinanceStore } from '../store/financeStore';

type FixedState = 'active' | 'future' | 'settled' | 'ended';

type FormState = { fixed?: FixedExpense } | null;

function resolveFixedState(fixed: FixedExpense, month: string): FixedState {
  if (fixed.startMonth > month) return 'future';
  if (fixed.endMonth && fixed.endMonth < month) return 'ended';
  if (fixed.settledAt && fixed.settledAt <= month) return 'settled';
  return 'active';
}

const stateRank: Record<FixedState, number> = {
  active: 0,
  future: 1,
  settled: 2,
  ended: 3,
};

const stateBadge: Record<FixedState, { label: string; tone: BadgeTone }> = {
  active: { label: 'Ativo', tone: 'ok' },
  future: { label: 'Começa depois', tone: 'info' },
  settled: { label: 'Quitado', tone: 'neutral' },
  ended: { label: 'Encerrado', tone: 'neutral' },
};

function periodLabel(fixed: FixedExpense): string {
  if (fixed.endMonth) {
    return `${formatMonthShort(fixed.startMonth)} até ${formatMonthShort(fixed.endMonth)}`;
  }
  return `Desde ${formatMonthShort(fixed.startMonth)} · recorrente`;
}

export default function FixedExpensesPage() {
  const month = useMonth();
  const fixedExpenses = useFinanceStore((state) => state.fixedExpenses);
  const incomes = useFinanceStore((state) => state.incomes);
  const setFixedSettled = useFinanceStore((state) => state.setFixedSettled);
  const removeFixed = useFinanceStore((state) => state.removeFixed);

  const [tab, setTab] = useState<'active' | 'all'>('active');
  const [formState, setFormState] = useState<FormState>(null);
  const [deleteTarget, setDeleteTarget] = useState<FixedExpense | null>(null);

  const activeFixed = fixedExpenses.filter((fixed) => isFixedActiveInMonth(fixed, month));
  const totalFixed = totalFixedForMonth(fixedExpenses, month);
  const salary = incomes.find((income) => income.month === month)?.amount ?? 0;
  const commitment = salary > 0 ? (totalFixed / salary) * 100 : 0;
  const commitmentTone: ProgressTone =
    commitment > 100 ? 'rose' : commitment >= 80 ? 'amber' : 'brand';

  const sortedFixed = [...fixedExpenses].sort((a, b) => {
    const rankDifference =
      stateRank[resolveFixedState(a, month)] - stateRank[resolveFixedState(b, month)];
    return rankDifference !== 0 ? rankDifference : a.name.localeCompare(b.name, 'pt-BR');
  });

  const visibleFixed = tab === 'active' ? activeFixed : sortedFixed;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Compromissos"
        title="Fixos do mês"
        description="Parcelas, contas e assinaturas que saem antes do dia a dia. Ao quitar ou encerrar, o valor volta para os tetos das semanas."
        action={
          <button type="button" className="btn-lime" onClick={() => setFormState({})}>
            <PlusIcon className="h-4 w-4" />
            Novo fixo
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Resumo dos fixos">
        <div className="relative overflow-hidden rounded-3xl bg-brand-950 p-5 text-white shadow-float dark:border dark:border-white/10 sm:p-6">
          <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-lime/10 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
            <RepeatIcon className="h-3.5 w-3.5" />
            Fixos ativos no mês
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight money">
            {formatCents(totalFixed)}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="chip bg-lime/15 text-lime">
              {activeFixed.length} {activeFixed.length === 1 ? 'fixo' : 'fixos'}
            </span>
            <span className="text-xs text-white/45">somados antes dos tetos</span>
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/35">
              Comprometimento da renda
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
              <WalletIcon className="h-4 w-4" />
            </span>
          </div>

          {salary > 0 ? (
            <>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-extrabold tracking-tight money">
                  {formatPercent(commitment / 100)}
                </p>
                <p className="pb-1 text-xs font-semibold text-ink/40">de {formatCents(salary)}</p>
              </div>
              <ProgressBar value={commitment} tone={commitmentTone} className="mt-4" />
              <p className="mt-3 hint">
                {commitment > 100
                  ? 'Os fixos passam da renda do mês. Vale revisar antes de seguir.'
                  : 'O que sobra é dividido entre as semanas do mês.'}
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-lg font-extrabold leading-snug tracking-tight">
                Informe seu salário para ver o peso dos fixos.
              </p>
              <Link
                to={monthPath(month, 'configuracoes')}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200"
              >
                Ir para ajustes
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-full border border-ink/[0.07] bg-paper p-1 shadow-sm self-start">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
              tab === 'active'
                ? 'bg-brand-950 text-white dark:bg-lime dark:text-brand-950'
                : 'text-ink/45 hover:text-ink'
            }`}
            aria-pressed={tab === 'active'}
            onClick={() => setTab('active')}
          >
            Ativos ({activeFixed.length})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
              tab === 'all'
                ? 'bg-brand-950 text-white dark:bg-lime dark:text-brand-950'
                : 'text-ink/45 hover:text-ink'
            }`}
            aria-pressed={tab === 'all'}
            onClick={() => setTab('all')}
          >
            Todos ({fixedExpenses.length})
          </button>
        </div>
        <p className="text-xs font-semibold text-ink/35">
          Quitado ou encerrado deixa de pesar no mês escolhido.
        </p>
      </div>

      {visibleFixed.length === 0 ? (
        fixedExpenses.length === 0 ? (
          <EmptyState
            icon={<RepeatIcon className="h-6 w-6" />}
            title="Nenhum fixo cadastrado"
            description="Comece pelo aluguel, energia, internet ou por uma compra parcelada. Eles entram no cálculo antes dos tetos semanais."
            action={
              <button type="button" className="btn-primary" onClick={() => setFormState({})}>
                <PlusIcon className="h-4 w-4" />
                Adicionar primeiro fixo
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={<CheckIcon className="h-6 w-6" />}
            title="Nenhum fixo ativo neste mês"
            description="Tudo que pesava neste mês foi quitado ou encerrado. Você pode conferir o histórico completo."
            action={
              <button type="button" className="btn-ghost" onClick={() => setTab('all')}>
                Ver todos os fixos
              </button>
            }
          />
        )
      ) : (
        <ul className="space-y-3">
          {visibleFixed.map((fixed) => {
            const state = resolveFixedState(fixed, month);
            const badge = stateBadge[state];
            const settledInFuture =
              state === 'active' && fixed.settledAt && fixed.settledAt > month;

            return (
              <li key={fixed.id} className="card p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                    <RepeatIcon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-[15px] font-extrabold tracking-tight text-ink">
                          {fixed.name}
                        </h2>
                        <p className="mt-0.5 text-xs font-medium text-ink/40">
                          {periodLabel(fixed)}
                        </p>
                      </div>
                      <p className="shrink-0 text-base font-extrabold tracking-tight money">
                        {formatCents(fixed.monthlyAmount)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                      {settledInFuture && fixed.settledAt ? (
                        <Badge tone="info">Quita em {formatMonthShort(fixed.settledAt)}</Badge>
                      ) : null}
                      {state === 'settled' && fixed.settledAt ? (
                        <span className="text-[11px] font-semibold text-ink/35">
                          desde {formatMonthShort(fixed.settledAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink/[0.05] pt-3">
                  <span className="text-[11px] font-semibold text-ink/30">Fixo mensal</span>
                  <div className="flex items-center gap-1">
                    {state === 'active' ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-ink/45 transition hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-400/15 dark:hover:text-brand-200"
                        onClick={() => setFixedSettled(fixed.id, month, true)}
                        aria-label={`Quitar ${fixed.name} a partir deste mês`}
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        Quitar
                      </button>
                    ) : null}
                    {state === 'settled' ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-ink/45 transition hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-400/15 dark:hover:text-brand-200"
                        onClick={() => setFixedSettled(fixed.id, month, false)}
                        aria-label={`Reativar ${fixed.name}`}
                      >
                        Reativar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="icon-btn h-8 w-8"
                      onClick={() => setFormState({ fixed })}
                      aria-label={`Editar ${fixed.name}`}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {formState ? (
        <FixedExpenseForm
          fixed={formState.fixed}
          selectedMonth={month}
          onClose={() => setFormState(null)}
          onDelete={(fixed) => {
            setFormState(null);
            setDeleteTarget(fixed);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir fixo?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" será removido do planejamento dos próximos meses.`
            : ''
        }
        confirmLabel="Excluir fixo"
        onConfirm={() => {
          if (deleteTarget) removeFixed(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
