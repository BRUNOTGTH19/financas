import { useState } from 'react';
import type { FixedExpense } from '../domain/types';
import { formatMonthShort } from '../lib/dates';
import { fieldErrors } from '../lib/validation';
import { fixedExpenseInputSchema } from '../schemas/finance';
import { useFinanceStore } from '../store/financeStore';
import CurrencyInput from './CurrencyInput';
import Modal from './Modal';
import { TrashIcon } from './icons';

export default function FixedExpenseForm({
  fixed,
  selectedMonth,
  onClose,
  onDelete,
}: {
  fixed?: FixedExpense;
  selectedMonth: string;
  onClose: () => void;
  onDelete?: (fixed: FixedExpense) => void;
}) {
  const addFixed = useFinanceStore((state) => state.addFixed);
  const updateFixed = useFinanceStore((state) => state.updateFixed);

  const [name, setName] = useState(fixed?.name ?? '');
  const [monthlyAmount, setMonthlyAmount] = useState(fixed?.monthlyAmount ?? 0);
  const [startMonth, setStartMonth] = useState(fixed?.startMonth ?? selectedMonth);
  const [endMonth, setEndMonth] = useState(fixed?.endMonth ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!fixed;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = fixedExpenseInputSchema.safeParse({
      name,
      monthlyAmount,
      startMonth,
      ...(endMonth ? { endMonth } : {}),
    });

    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }

    if (fixed) {
      updateFixed(fixed.id, result.data);
    } else {
      addFixed(result.data);
    }

    onClose();
  }

  return (
    <Modal
      title={isEditing ? 'Editar fixo' : 'Novo gasto fixo'}
      description={
        isEditing
          ? 'Ajuste valor, período ou encerre esse compromisso.'
          : 'Contas e parcelas que saem todo mês antes dos gastos do dia a dia.'
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="fixed-name" className="label">
            Nome
          </label>
          <input
            id="fixed-name"
            className="field"
            placeholder="Ex.: Aluguel, internet, celular"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'fixed-name-error' : undefined}
            autoFocus
          />
          {errors.name ? (
            <p id="fixed-name-error" className="error-text">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="fixed-amount" className="label">
            Valor mensal
          </label>
          <CurrencyInput
            id="fixed-amount"
            value={monthlyAmount}
            onChange={setMonthlyAmount}
            invalid={!!errors.monthlyAmount}
            describedBy={errors.monthlyAmount ? 'fixed-amount-error' : undefined}
          />
          {errors.monthlyAmount ? (
            <p id="fixed-amount-error" className="error-text">
              {errors.monthlyAmount}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fixed-start" className="label">
              Começa em
            </label>
            <input
              id="fixed-start"
              type="month"
              className="field"
              value={startMonth}
              onChange={(event) => setStartMonth(event.target.value)}
              aria-invalid={!!errors.startMonth}
              aria-describedby={errors.startMonth ? 'fixed-start-error' : undefined}
            />
            {errors.startMonth ? (
              <p id="fixed-start-error" className="error-text">
                {errors.startMonth}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="fixed-end" className="label">
              Termina em
            </label>
            <input
              id="fixed-end"
              type="month"
              className="field"
              value={endMonth}
              min={startMonth}
              onChange={(event) => setEndMonth(event.target.value)}
              aria-invalid={!!errors.endMonth}
              aria-describedby={errors.endMonth ? 'fixed-end-error' : 'fixed-end-hint'}
            />
            {errors.endMonth ? (
              <p id="fixed-end-error" className="error-text">
                {errors.endMonth}
              </p>
            ) : null}
          </div>
        </div>

        {!errors.endMonth ? (
          <p id="fixed-end-hint" className="hint">
            {endMonth && startMonth
              ? `${formatMonthShort(startMonth)} até ${formatMonthShort(endMonth)}. Depois disso, o valor volta para os tetos semanais.`
              : 'Deixe vazio para um fixo recorrente, sem data para acabar.'}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-ink/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          {fixed && onDelete ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 self-start rounded-full px-2 py-1 text-xs font-bold text-rose-600 transition hover:text-rose-700 sm:self-auto"
              onClick={() => onDelete(fixed)}
            >
              <TrashIcon className="h-4 w-4" />
              Excluir fixo
            </button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Salvar alterações' : 'Adicionar fixo'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
