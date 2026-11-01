import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import CurrencyInput from '../components/CurrencyInput';
import PageHeader from '../components/PageHeader';
import { BanknoteIcon, TargetIcon, TrashIcon } from '../components/icons';
import { monthLabel } from '../domain/calendar';
import { useMonth } from '../hooks/useMonth';
import { formatCents } from '../lib/money';
import { savingsGoalSchema, salaryInputSchema } from '../schemas/finance';
import { useFinanceStore } from '../store/financeStore';

function SalaryForm({ month, initialAmount }: { month: string; initialAmount: number }) {
  const setSalary = useFinanceStore((state) => state.setSalary);
  const [amount, setAmount] = useState(initialAmount);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = salaryInputSchema.safeParse({ month, amount });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Informe uma renda válida.');
      return;
    }

    setError('');
    setSalary(month, amount);
    setSaved(true);
  }

  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/35">
            Planejamento mensal
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight">Renda do mês</h2>
          <p className="mt-1 text-xs font-medium leading-relaxed text-ink/45">
            Informe a renda de {monthLabel(month)}. Ela vale só para este mês e define os tetos
            semanais.
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lime/40 text-brand-800">
          <BanknoteIcon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-5" noValidate>
        <label htmlFor="settings-salary" className="label">
          Renda do mês
        </label>
        <CurrencyInput
          id="settings-salary"
          value={amount}
          onChange={(cents) => {
            setAmount(cents);
            setSaved(false);
            if (error) setError('');
          }}
          invalid={!!error}
          describedBy={error ? 'settings-salary-error' : 'settings-salary-hint'}
        />
        {error ? (
          <p id="settings-salary-error" className="error-text">
            {error}
          </p>
        ) : (
          <p id="settings-salary-hint" className="hint mt-1.5">
            {initialAmount > 0
              ? `Salvo atualmente: ${formatCents(initialAmount)}.`
              : 'Nenhuma renda salva para este mês ainda.'}
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-xs font-semibold text-brand-700">
            {saved ? `Renda atualizada para ${formatCents(amount)}.` : ''}
          </p>
          <button type="submit" className="btn-primary btn-sm self-start sm:self-auto">
            Salvar renda
          </button>
        </div>
      </form>
    </div>
  );
}

function SavingsGoalForm({ initialAmount }: { initialAmount: number }) {
  const setSavingsGoal = useFinanceStore((state) => state.setSavingsGoal);
  const [amount, setAmount] = useState(initialAmount);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = savingsGoalSchema.safeParse(amount);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Informe uma meta válida.');
      return;
    }

    setError('');
    setSavingsGoal(amount);
    setSaved(true);
  }

  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/35">
            Reserva
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight">Meta de sobra</h2>
          <p className="mt-1 text-xs font-medium leading-relaxed text-ink/45">
            Quanto você quer que sobre no fim do mês. A meta aparece na projeção e vale para todos
            os meses.
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <TargetIcon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-5" noValidate>
        <label htmlFor="settings-goal" className="label">
          Meta de sobra
        </label>
        <CurrencyInput
          id="settings-goal"
          value={amount}
          onChange={(cents) => {
            setAmount(cents);
            setSaved(false);
            if (error) setError('');
          }}
          invalid={!!error}
          describedBy={error ? 'settings-goal-error' : 'settings-goal-hint'}
        />
        {error ? (
          <p id="settings-goal-error" className="error-text">
            {error}
          </p>
        ) : (
          <p id="settings-goal-hint" className="hint mt-1.5">
            {initialAmount > 0
              ? `Meta atual: ${formatCents(initialAmount)}.`
              : 'Sem meta definida. A projeção ainda mostra a sobra, mas não compara com uma meta.'}
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-xs font-semibold text-brand-700">
            {saved ? `Meta atualizada para ${formatCents(amount)}.` : ''}
          </p>
          <button type="submit" className="btn-primary btn-sm self-start sm:self-auto">
            Salvar meta
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const month = useMonth();
  const incomes = useFinanceStore((state) => state.incomes);
  const fixedExpenses = useFinanceStore((state) => state.fixedExpenses);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingsGoal = useFinanceStore((state) => state.settings.savingsGoal);
  const resetAll = useFinanceStore((state) => state.resetAll);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const salary = incomes.find((income) => income.month === month)?.amount ?? 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Ajustes"
        title="Configurações"
        description="Renda do mês, meta de sobra e controle dos dados salvos neste navegador."
      />

      <section className="grid gap-3 lg:grid-cols-2" aria-label="Ajustes financeiros">
        <SalaryForm key={`salary-${month}-${formVersion}`} month={month} initialAmount={salary} />
        <SavingsGoalForm key={`goal-${formVersion}`} initialAmount={savingsGoal} />
      </section>

      <section
        className="rounded-3xl border border-rose-200/80 bg-rose-50/40 p-5 sm:p-6"
        aria-label="Dados salvos"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rose-700/50">
              Privacidade
            </p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-rose-950">
              Dados deste dispositivo
            </h2>
            <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-rose-950/55">
              Tudo fica no localStorage deste navegador. Nada é enviado para servidores. Apagar os
              dados remove rendas, fixos, gastos e a meta de uma vez.
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <TrashIcon className="h-[18px] w-[18px]" />
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-rose-200/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-rose-950/45">
            {incomes.length} {incomes.length === 1 ? 'mês com renda' : 'meses com renda'} ·{' '}
            {fixedExpenses.length} {fixedExpenses.length === 1 ? 'fixo' : 'fixos'} ·{' '}
            {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}
          </p>
          <button
            type="button"
            className="btn-danger btn-sm self-start sm:self-auto"
            onClick={() => setResetOpen(true)}
          >
            <TrashIcon className="h-4 w-4" />
            Apagar todos os dados
          </button>
        </div>

        {resetDone ? (
          <p role="status" className="mt-3 text-xs font-semibold text-rose-700">
            Renda, fixos, gastos e meta foram apagados deste navegador.
          </p>
        ) : null}
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="Apagar todos os dados?"
        description="Renda, fixos, gastos, parcelamentos e meta serão removidos deste navegador. Essa ação não pode ser desfeita."
        confirmLabel="Apagar tudo"
        onConfirm={() => {
          resetAll();
          setResetDone(true);
          setFormVersion((version) => version + 1);
        }}
        onClose={() => setResetOpen(false)}
      />
    </div>
  );
}
