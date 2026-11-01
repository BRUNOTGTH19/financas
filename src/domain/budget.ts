import { compareMonths, getWeekIndexForDate, getWeeksOfMonth, isDateInMonth } from './calendar';
import type { FixedExpense, MonthBudget, MonthKey, WeekBudget, WeekStatus } from './types';

export interface MonthBudgetInput {
  month: MonthKey;
  salary: number;
  fixedExpenses: readonly FixedExpense[];
  expenses: readonly { date: string; amount: number }[];
}

/**
 * Um fixo só entra no mês quando:
 * - já começou;
 * - ainda não terminou (quando há término);
 * - não foi quitado nesse mês ou antes.
 */
export function isFixedActiveInMonth(fixed: FixedExpense, month: MonthKey): boolean {
  if (compareMonths(fixed.startMonth, month) > 0) return false;
  if (fixed.endMonth && compareMonths(month, fixed.endMonth) > 0) return false;
  if (fixed.settledAt && compareMonths(month, fixed.settledAt) >= 0) return false;
  return true;
}

export function totalFixedForMonth(
  fixedExpenses: readonly FixedExpense[],
  month: MonthKey,
): number {
  return fixedExpenses
    .filter((fixed) => isFixedActiveInMonth(fixed, month))
    .reduce((total, fixed) => total + fixed.monthlyAmount, 0);
}

/**
 * Divide o valor disponível entre as semanas, distribuindo os centavos restantes
 * nas primeiras semanas para que a soma dos tetos seja exata.
 */
export function distributeWeeklyCaps(total: number, weekCount: number): number[] {
  if (weekCount <= 0) return [];
  if (total <= 0) return Array.from({ length: weekCount }, () => 0);

  const base = Math.floor(total / weekCount);
  const remainder = total % weekCount;

  return Array.from({ length: weekCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function getWeekStatus(cap: number, spent: number): WeekStatus {
  if (cap <= 0) return spent > 0 ? 'over' : 'ok';

  const ratio = spent / cap;
  if (ratio > 1) return 'over';
  if (ratio >= 0.8) return 'attention';
  return 'ok';
}

export function calculateMonthBudget(input: MonthBudgetInput): MonthBudget {
  const { month, salary, fixedExpenses, expenses } = input;

  const activeFixed = fixedExpenses.filter((fixed) => isFixedActiveInMonth(fixed, month));
  const totalFixed = activeFixed.reduce((total, fixed) => total + fixed.monthlyAmount, 0);
  const availableForCaps = salary - totalFixed;
  const weeks = getWeeksOfMonth(month);
  const caps = distributeWeeklyCaps(Math.max(0, availableForCaps), weeks.length);

  const spentByWeek = new Map<number, number>();
  let totalSpent = 0;

  for (const expense of expenses) {
    if (!isDateInMonth(expense.date, month)) continue;

    const weekIndex = getWeekIndexForDate(expense.date);
    if (weekIndex === null) continue;

    spentByWeek.set(weekIndex, (spentByWeek.get(weekIndex) ?? 0) + expense.amount);
    totalSpent += expense.amount;
  }

  const weekBudgets: WeekBudget[] = weeks.map((week, index) => {
    const cap = caps[index] ?? 0;
    const spent = spentByWeek.get(week.index) ?? 0;

    return {
      week,
      cap,
      spent,
      remaining: cap - spent,
      percent: cap > 0 ? (spent / cap) * 100 : spent > 0 ? 100 : 0,
      status: getWeekStatus(cap, spent),
    };
  });

  const balance = availableForCaps - totalSpent;

  return {
    month,
    salary,
    totalFixed,
    availableForCaps,
    totalSpent,
    balance,
    overcommitted: availableForCaps < 0,
    spentPercent:
      availableForCaps > 0 ? (totalSpent / availableForCaps) * 100 : totalSpent > 0 ? 100 : 0,
    activeFixed,
    weeks: weekBudgets,
  };
}
