import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addMonthsToMonthKey } from '../domain/calendar';
import type { Expense, FinanceData, FixedExpense, Income, MonthKey } from '../domain/types';
import { mergeFinanceData } from '../lib/backup';
import { createId } from '../lib/id';
import {
  expenseInputSchema,
  fixedExpenseInputSchema,
  monthKeySchema,
  persistedStateSchema,
  salaryInputSchema,
  savingsGoalSchema,
  type ExpenseFormInput,
  type FixedExpenseFormInput,
} from '../schemas/finance';

export const STORAGE_KEY = 'fin:v1';
export const STORAGE_VERSION = 1;

export type { FinanceData };

export interface FinanceActions {
  setSalary: (month: MonthKey, amount: number) => void;
  setSavingsGoal: (amount: number) => void;
  addFixed: (input: FixedExpenseFormInput) => string;
  updateFixed: (id: string, input: FixedExpenseFormInput) => void;
  removeFixed: (id: string) => void;
  setFixedSettled: (id: string, month: MonthKey, settled: boolean) => void;
  addExpense: (input: ExpenseFormInput) => string;
  updateExpense: (id: string, input: ExpenseFormInput) => void;
  removeExpense: (id: string) => void;
  replaceData: (data: FinanceData) => void;
  mergeData: (data: FinanceData) => void;
  resetAll: () => void;
}

export type FinanceState = FinanceData & FinanceActions;

export function createEmptyFinanceData(): FinanceData {
  return {
    incomes: [],
    fixedExpenses: [],
    expenses: [],
    settings: { savingsGoal: 0 },
  };
}

function buildGeneratedInstallmentFixed(
  input: ExpenseFormInput,
): { fixed: FixedExpense; installmentCount: number } | null {
  if (input.method !== 'credito_parcelado' || !input.installmentCount) return null;

  const installmentCount = input.installmentCount;
  const purchaseMonth = input.date.slice(0, 7);
  const label = input.description?.trim()
    ? `${input.description.trim()} (${installmentCount}x)`
    : `Compra parcelada (${installmentCount}x)`;

  return {
    installmentCount,
    fixed: {
      id: createId('fix_'),
      name: label,
      monthlyAmount: input.amount,
      startMonth: addMonthsToMonthKey(purchaseMonth, 1),
      endMonth: addMonthsToMonthKey(purchaseMonth, installmentCount - 1),
    },
  };
}

function withoutFixedLink(expense: Expense): Expense {
  if (!expense.linkedFixedId) return expense;
  const copy = { ...expense };
  delete copy.linkedFixedId;
  return copy;
}

function buildExpense(id: string, input: ExpenseFormInput, linkedFixedId?: string): Expense {
  return {
    id,
    date: input.date,
    amount: input.amount,
    method: input.method,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(linkedFixedId ? { linkedFixedId } : {}),
    ...(input.method === 'credito_parcelado' && input.installmentCount
      ? { installmentCount: input.installmentCount }
      : {}),
  };
}

export function mergePersistedState(persisted: unknown, current: FinanceState): FinanceState {
  const parsed = persistedStateSchema.safeParse(persisted);
  if (!parsed.success) return current;
  return { ...current, ...parsed.data };
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...createEmptyFinanceData(),

      setSalary: (month, amount) => {
        const parsed = salaryInputSchema.parse({ month, amount });
        const existing = get().incomes.find((income) => income.month === parsed.month);
        const income: Income = {
          id: existing?.id ?? createId('inc_'),
          month: parsed.month,
          amount: parsed.amount,
        };

        set((state) => ({
          incomes: existing
            ? state.incomes.map((item) => (item.month === parsed.month ? income : item))
            : [...state.incomes, income],
        }));
      },

      setSavingsGoal: (amount) => {
        const parsed = savingsGoalSchema.parse(amount);
        set((state) => ({ settings: { ...state.settings, savingsGoal: parsed } }));
      },

      addFixed: (input) => {
        const parsed = fixedExpenseInputSchema.parse(input);
        const fixed: FixedExpense = { id: createId('fix_'), ...parsed };
        set((state) => ({ fixedExpenses: [...state.fixedExpenses, fixed] }));
        return fixed.id;
      },

      updateFixed: (id, input) => {
        const parsed = fixedExpenseInputSchema.parse(input);
        set((state) => ({
          fixedExpenses: state.fixedExpenses.map((fixed) =>
            fixed.id === id
              ? {
                  ...fixed,
                  name: parsed.name,
                  monthlyAmount: parsed.monthlyAmount,
                  startMonth: parsed.startMonth,
                  endMonth: parsed.endMonth,
                }
              : fixed,
          ),
        }));
      },

      removeFixed: (id) => {
        set((state) => ({
          fixedExpenses: state.fixedExpenses.filter((fixed) => fixed.id !== id),
          expenses: state.expenses.map((expense) =>
            expense.linkedFixedId === id ? withoutFixedLink(expense) : expense,
          ),
        }));
      },

      setFixedSettled: (id, month, settled) => {
        const parsedMonth = monthKeySchema.parse(month);
        set((state) => ({
          fixedExpenses: state.fixedExpenses.map((fixed) =>
            fixed.id === id ? { ...fixed, settledAt: settled ? parsedMonth : undefined } : fixed,
          ),
        }));
      },

      addExpense: (input) => {
        const parsed = expenseInputSchema.parse(input);
        const generated = buildGeneratedInstallmentFixed(parsed);
        const id = createId('exp_');
        const expense = buildExpense(id, parsed, generated?.fixed.id);

        set((state) => ({
          expenses: [...state.expenses, expense],
          fixedExpenses: generated
            ? [...state.fixedExpenses, generated.fixed]
            : state.fixedExpenses,
        }));

        return id;
      },

      updateExpense: (id, input) => {
        const parsed = expenseInputSchema.parse(input);
        const existing = get().expenses.find((expense) => expense.id === id);
        if (!existing) return;

        const generated = buildGeneratedInstallmentFixed(parsed);
        const updated = buildExpense(id, parsed, generated?.fixed.id);

        set((state) => {
          const fixedWithoutOldLink = state.fixedExpenses.filter(
            (fixed) => fixed.id !== existing.linkedFixedId,
          );

          return {
            expenses: state.expenses.map((expense) => (expense.id === id ? updated : expense)),
            fixedExpenses: generated
              ? [...fixedWithoutOldLink, generated.fixed]
              : fixedWithoutOldLink,
          };
        });
      },

      removeExpense: (id) => {
        const existing = get().expenses.find((expense) => expense.id === id);
        if (!existing) return;

        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
          fixedExpenses: existing.linkedFixedId
            ? state.fixedExpenses.filter((fixed) => fixed.id !== existing.linkedFixedId)
            : state.fixedExpenses,
        }));
      },

      replaceData: (data) => {
        set(persistedStateSchema.parse(data));
      },

      mergeData: (data) => {
        const parsed = persistedStateSchema.parse(data);
        set((state) => mergeFinanceData(state, parsed));
      },

      resetAll: () => {
        set(createEmptyFinanceData());
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): FinanceData => ({
        incomes: state.incomes,
        fixedExpenses: state.fixedExpenses,
        expenses: state.expenses,
        settings: state.settings,
      }),
      merge: (persisted, current) => mergePersistedState(persisted, current),
    },
  ),
);
