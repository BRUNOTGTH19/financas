import { useState } from 'react';
import {
  addMonthsToMonthKey,
  isDateInMonth,
  monthEndDate,
  monthStartDate,
} from '../domain/calendar';
import type { Expense, PaymentMethod } from '../domain/types';
import { currentMonthKey, formatMonthShort, todayIso } from '../lib/dates';
import { formatCents } from '../lib/money';
import { PAYMENT_LABELS, PAYMENT_METHODS, paymentLabel } from '../lib/payment';
import { fieldErrors } from '../lib/validation';
import { expenseInputSchema } from '../schemas/finance';
import { useFinanceStore } from '../store/financeStore';
import CurrencyInput from './CurrencyInput';
import Modal from './Modal';
import { PaymentMethodIcon } from './icons';

function defaultDateForMonth(month: string): string {
  const today = todayIso();
  if (month === currentMonthKey() && isDateInMonth(today, month)) return today;
  return monthStartDate(month);
}

export default function ExpenseForm({
  expense,
  selectedMonth,
  onClose,
}: {
  expense?: Expense;
  selectedMonth: string;
  onClose: () => void;
}) {
  const addExpense = useFinanceStore((state) => state.addExpense);
  const updateExpense = useFinanceStore((state) => state.updateExpense);

  const [amount, setAmount] = useState(expense?.amount ?? 0);
  const [date, setDate] = useState(expense?.date ?? defaultDateForMonth(selectedMonth));
  const [method, setMethod] = useState<PaymentMethod>(expense?.method ?? 'pix');
  const [description, setDescription] = useState(expense?.description ?? '');
  const [installmentCount, setInstallmentCount] = useState(String(expense?.installmentCount ?? 2));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!expense;
  const isInstallment = method === 'credito_parcelado';
  const parsedInstallments = Number(installmentCount);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = expenseInputSchema.safeParse({
      amount,
      date,
      method,
      ...(description.trim() ? { description } : {}),
      ...(isInstallment ? { installmentCount: Number(installmentCount) || undefined } : {}),
    });

    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }

    if (expense) {
      updateExpense(expense.id, result.data);
    } else {
      addExpense(result.data);
    }

    onClose();
  }

  const showsInstallmentPreview =
    isInstallment &&
    amount > 0 &&
    date.length === 10 &&
    Number.isInteger(parsedInstallments) &&
    parsedInstallments >= 2 &&
    parsedInstallments <= 60;

  return (
    <Modal
      title={isEditing ? 'Editar gasto' : 'Novo gasto'}
      description={
        isEditing
          ? 'Atualize o lançamento. Se for parcelado, as parcelas futuras serão recalculadas.'
          : 'Registre o que saiu do seu bolso e mantenha o teto da semana fiel à realidade.'
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="expense-amount" className="label">
            Valor
          </label>
          <CurrencyInput
            id="expense-amount"
            value={amount}
            onChange={setAmount}
            invalid={!!errors.amount}
            describedBy={errors.amount ? 'expense-amount-error' : undefined}
            autoFocus
          />
          {errors.amount ? (
            <p id="expense-amount-error" className="error-text">
              {errors.amount}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="expense-date" className="label">
              Data
            </label>
            <input
              id="expense-date"
              type="date"
              className="field"
              value={date}
              min={monthStartDate(selectedMonth)}
              max={monthEndDate(selectedMonth)}
              onChange={(event) => setDate(event.target.value)}
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? 'expense-date-error' : undefined}
            />
            {errors.date ? (
              <p id="expense-date-error" className="error-text">
                {errors.date}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="expense-method" className="label">
              Forma de pagamento
            </label>
            <select
              id="expense-method"
              className="field pr-8"
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((option) => (
                <option key={option} value={option}>
                  {PAYMENT_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isInstallment ? (
          <div>
            <label htmlFor="expense-installments" className="label">
              Parcelas
            </label>
            <input
              id="expense-installments"
              type="number"
              inputMode="numeric"
              min={2}
              max={60}
              className="field max-w-[9rem]"
              value={installmentCount}
              onChange={(event) => setInstallmentCount(event.target.value)}
              aria-invalid={!!errors.installmentCount}
              aria-describedby={
                errors.installmentCount ? 'expense-installments-error' : 'expense-installments-hint'
              }
            />
            {errors.installmentCount ? (
              <p id="expense-installments-error" className="error-text">
                {errors.installmentCount}
              </p>
            ) : null}
            <p id="expense-installments-hint" className="hint mt-1.5">
              {showsInstallmentPreview
                ? `A 1ª parcela entra agora. As outras ${parsedInstallments - 1} viram um fixo de ${formatMonthShort(
                    addMonthsToMonthKey(date.slice(0, 7), 1),
                  )} a ${formatMonthShort(addMonthsToMonthKey(date.slice(0, 7), parsedInstallments - 1))}, de ${formatCents(
                    amount,
                  )} por mês.`
                : 'No crédito parcelado, informe o valor de cada parcela. As parcelas futuras viram um gasto fixo automático.'}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl bg-brand-50/70 px-3.5 py-3 text-xs font-semibold text-brand-800 dark:bg-brand-400/10 dark:text-brand-200">
            <PaymentMethodIcon method={method} className="h-4 w-4 shrink-0" />
            {method === 'debito' || method === 'pix'
              ? 'Boa escolha: pagar à vista mantém o cartão longe do próximo mês.'
              : 'Compra à vista no cartão ainda pesa só neste mês.'}
          </div>
        )}

        <div>
          <label htmlFor="expense-description" className="label">
            Descrição{' '}
            <span className="font-medium normal-case tracking-normal text-ink/30">(opcional)</span>
          </label>
          <input
            id="expense-description"
            className="field"
            placeholder="Ex.: Mercado da semana"
            value={description}
            maxLength={120}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'expense-description-error' : undefined}
          />
          {errors.description ? (
            <p id="expense-description-error" className="error-text">
              {errors.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-ink/[0.06] pt-5 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            {isEditing ? 'Salvar alterações' : 'Registrar gasto'}
          </button>
        </div>

        {isEditing && expense?.installmentCount ? (
          <p className="hint text-right">
            Gasto parcelado em {expense.installmentCount}x · forma atual:{' '}
            {paymentLabel(expense.method)}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
