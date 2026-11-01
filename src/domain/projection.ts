import { compareMonths, isIsoDate } from './calendar';
import type { MonthBudget, MonthKey, MonthProjection, ProjectionPhase } from './types';

export interface ProjectionInput {
  budget: MonthBudget;
  savingsGoal: number;
  today: string;
}

function resolvePhase(month: MonthKey, todayMonth: MonthKey): ProjectionPhase {
  const comparison = compareMonths(todayMonth, month);
  if (comparison < 0) return 'future';
  if (comparison > 0) return 'past';
  return 'current';
}

/**
 * Projeta o fim do mês mantendo o ritmo diário atual.
 * Em meses passados a projeção equivale ao realizado; em meses futuros ainda não há dados.
 */
export function projectMonth(input: ProjectionInput): MonthProjection {
  const { budget, savingsGoal, today } = input;

  if (!isIsoDate(today)) {
    throw new RangeError(`Data inválida: "${today}". Use o formato AAAA-MM-DD.`);
  }

  const month = budget.month;
  const todayMonth = today.slice(0, 7);
  const phase = resolvePhase(month, todayMonth);
  const daysInMonth = budget.weeks.reduce((total, week) => total + week.week.dayCount, 0);

  const elapsedDays =
    phase === 'past' ? daysInMonth : phase === 'future' ? 0 : Number(today.slice(8, 10));
  const remainingDays = daysInMonth - elapsedDays;
  const dailyPace = elapsedDays > 0 ? Math.round(budget.totalSpent / elapsedDays) : 0;

  let projectedSpend: number;
  if (phase === 'past') {
    projectedSpend = budget.totalSpent;
  } else if (phase === 'future') {
    projectedSpend = 0;
  } else {
    projectedSpend =
      elapsedDays > 0
        ? Math.round((budget.totalSpent * daysInMonth) / elapsedDays)
        : budget.totalSpent;
  }

  const projectedBalance = budget.availableForCaps - projectedSpend;
  const goalGap = projectedBalance - savingsGoal;
  const spendingRoom = budget.availableForCaps - savingsGoal - budget.totalSpent;
  const safeDailySpend =
    remainingDays > 0 && spendingRoom > 0 ? Math.round(spendingRoom / remainingDays) : 0;

  let status: MonthProjection['status'];
  if (budget.salary <= 0) {
    status = 'sem_renda';
  } else if (goalGap >= 0) {
    status = 'meta_atingida';
  } else {
    status = 'meta_em_risco';
  }

  return {
    phase,
    daysInMonth,
    elapsedDays,
    remainingDays,
    dailyPace,
    projectedSpend,
    projectedBalance,
    savingsGoal,
    goalGap,
    safeDailySpend,
    status,
  };
}
