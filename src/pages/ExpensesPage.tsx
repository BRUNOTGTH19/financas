import { useState } from 'react';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ExpenseForm from '../components/ExpenseForm';
import PageHeader from '../components/PageHeader';
import ProgressBar from '../components/ProgressBar';
import {
  CreditCardIcon,
  PencilIcon,
  PaymentMethodIcon,
  PlusIcon,
  ReceiptIcon,
  TrashIcon,
  WalletIcon,
} from '../components/icons';
import { isDateInMonth } from '../domain/calendar';
import type { Expense, PaymentMethod } from '../domain/types';
import { useMonth } from '../hooks/useMonth';
import { formatDateShort } from '../lib/dates';
import { formatCents, formatPercent } from '../lib/money';
import { paymentLabel, isCreditMethod } from '../lib/payment';
import { useFinanceStore } from '../store/financeStore';

type FormState = { expense?: Expense } | null;

function methodIconClass(method: PaymentMethod): string {
  if (method === 'pix') return 'bg-lime/40 text-brand-900';
  if (method === 'debito') return 'bg-brand-50 text-brand-700';
  return 'bg-amber-50 text-amber-700';
}

function cashMessage(cashShare: number, hasExpenses: boolean): string {
  if (!hasExpenses)
    return 'Registre o primeiro gasto para acompanhar a escolha entre à vista e cartão.';
  if (cashShare >= 0.7) return 'Boa! A maior parte do mês está sendo paga à vista.';
  if (cashShare >= 0.4) return 'Equilíbrio razoável. Dá para aumentar o peso do débito e do PIX.';
  return 'O cartão está pesando mais que o à vista neste mês.';
}

export default function ExpensesPage() {
  const month = useMonth();
  const expenses = useFinanceStore((state) => state.expenses);
  const removeExpense = useFinanceStore((state) => state.removeExpense);

  const [formState, setFormState] = useState<FormState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const monthExpenses = [...expenses]
    .filter((expense) => isDateInMonth(expense.date, month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const cashTotal = monthExpenses
    .filter((expense) => !isCreditMethod(expense.method))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const creditTotal = total - cashTotal;
  const cashShare = total > 0 ? cashTotal / total : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Dia a dia"
        title="Gastos do mês"
        description="Cada lançamento entra no teto da semana. Prefira débito e PIX para reduzir o cartão aos poucos."
        action={
          <button type="button" className="btn-lime" onClick={() => setFormState({})}>
            <PlusIcon className="h-4 w-4" />
            Novo gasto
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Resumo dos gastos">
        <div className="relative overflow-hidden rounded-3xl bg-brand-950 p-5 text-white shadow-float sm:p-6">
          <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-lime/10 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
            <ReceiptIcon className="h-3.5 w-3.5" />
            Gasto acumulado
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight money">{formatCents(total)}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="chip bg-lime/15 text-lime">
              {monthExpenses.length} {monthExpenses.length === 1 ? 'lançamento' : 'lançamentos'}
            </span>
            <span className="text-xs text-white/45">no mês</span>
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/35">
              À vista ou cartão
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <WalletIcon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-semibold text-ink/55">
                <span className="h-2 w-2 rounded-full bg-brand-500" />À vista
              </span>
              <span className="font-extrabold money">{formatCents(cashTotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-semibold text-ink/55">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Cartão
              </span>
              <span className="font-extrabold money">{formatCents(creditTotal)}</span>
            </div>
          </div>

          <ProgressBar value={cashShare * 100} tone="brand" className="mt-4" />
          <p className="mt-2 text-[11px] font-semibold text-ink/40">
            {formatPercent(cashShare)} do mês foi à vista
          </p>
          <p className="mt-3 hint">{cashMessage(cashShare, total > 0)}</p>
        </div>
      </section>

      {monthExpenses.length === 0 ? (
        <EmptyState
          icon={<CreditCardIcon className="h-6 w-6" />}
          title="Nenhum gasto neste mês"
          description="Registre uma compra para ver o impacto no teto da semana. Débito e PIX contam como à vista."
          action={
            <button type="button" className="btn-primary" onClick={() => setFormState({})}>
              <PlusIcon className="h-4 w-4" />
              Registrar primeiro gasto
            </button>
          }
        />
      ) : (
        <section aria-label="Lançamentos do mês" className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink/[0.05] px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-extrabold tracking-tight">Lançamentos</h2>
            <span className="text-[11px] font-semibold text-ink/35">mais recentes primeiro</span>
          </div>
          <ul className="divide-y divide-ink/[0.05]">
            {monthExpenses.map((expense) => (
              <li key={expense.id} className="group flex items-center gap-2 px-3 py-2 sm:px-4">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-ink/[0.02]"
                  onClick={() => setFormState({ expense })}
                  aria-label={`Editar ${expense.description ?? paymentLabel(expense.method)}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${methodIconClass(
                      expense.method,
                    )}`}
                  >
                    <PaymentMethodIcon method={expense.method} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-ink">
                      {expense.description || paymentLabel(expense.method)}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-ink/40">
                      {formatDateShort(expense.date)}
                      <span className="text-ink/20">·</span>
                      {paymentLabel(expense.method)}
                      {expense.installmentCount ? (
                        <Badge tone="attention">{expense.installmentCount}x</Badge>
                      ) : null}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-extrabold tracking-tight money">
                      {formatCents(expense.amount)}
                    </span>
                  </span>
                  <PencilIcon className="hidden h-3.5 w-3.5 shrink-0 text-ink/15 transition group-hover:text-ink/40 sm:block" />
                </button>
                <button
                  type="button"
                  className="icon-btn h-8 w-8 shrink-0 border-transparent bg-transparent text-ink/25 hover:text-rose-600"
                  onClick={() => setDeleteTarget(expense)}
                  aria-label={`Excluir ${expense.description ?? paymentLabel(expense.method)}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {formState ? (
        <ExpenseForm
          expense={formState.expense}
          selectedMonth={month}
          onClose={() => setFormState(null)}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir gasto?"
        description={
          deleteTarget
            ? `"${deleteTarget.description ?? paymentLabel(deleteTarget.method)}" será removido do mês.${
                deleteTarget.linkedFixedId
                  ? ' As parcelas futuras geradas por ele também serão excluídas.'
                  : ''
              }`
            : ''
        }
        confirmLabel="Excluir gasto"
        onConfirm={() => {
          if (deleteTarget) removeExpense(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
