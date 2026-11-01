import { describe, expect, it } from 'vitest';
import {
  calculateMonthBudget,
  distributeWeeklyCaps,
  getWeekStatus,
  isFixedActiveInMonth,
  totalFixedForMonth,
} from '../../src/domain/budget';
import type { Expense, FixedExpense } from '../../src/domain/types';

function makeFixed(overrides: Partial<FixedExpense> = {}): FixedExpense {
  return {
    id: 'fixed-1',
    name: 'Aluguel',
    monthlyAmount: 100_000,
    startMonth: '2026-01',
    ...overrides,
  };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-1',
    date: '2026-11-05',
    amount: 10_000,
    method: 'pix',
    ...overrides,
  };
}

describe('fixos ativos', () => {
  it('respeita início, término e quitação', () => {
    const fixed = makeFixed({
      startMonth: '2026-03',
      endMonth: '2026-06',
      settledAt: '2026-05',
    });

    expect(isFixedActiveInMonth(fixed, '2026-02')).toBe(false);
    expect(isFixedActiveInMonth(fixed, '2026-03')).toBe(true);
    expect(isFixedActiveInMonth(fixed, '2026-04')).toBe(true);
    expect(isFixedActiveInMonth(fixed, '2026-05')).toBe(false);
    expect(isFixedActiveInMonth(fixed, '2026-06')).toBe(false);
    expect(isFixedActiveInMonth(fixed, '2026-07')).toBe(false);
  });

  it('mantém fixo recorrente ativo indefinidamente', () => {
    const fixed = makeFixed({ startMonth: '2026-01' });
    expect(isFixedActiveInMonth(fixed, '2026-01')).toBe(true);
    expect(isFixedActiveInMonth(fixed, '2030-12')).toBe(true);
  });

  it('continua ativo em mês anterior à quitação futura', () => {
    const fixed = makeFixed({ settledAt: '2026-12' });
    expect(isFixedActiveInMonth(fixed, '2026-11')).toBe(true);
    expect(isFixedActiveInMonth(fixed, '2026-12')).toBe(false);
  });

  it('soma somente os fixos ativos do mês', () => {
    const fixedExpenses = [
      makeFixed({ id: 'a', monthlyAmount: 50_000 }),
      makeFixed({ id: 'b', monthlyAmount: 20_000, startMonth: '2026-12' }),
      makeFixed({ id: 'c', monthlyAmount: 30_000, endMonth: '2026-10' }),
      makeFixed({ id: 'd', monthlyAmount: 40_000, settledAt: '2026-11' }),
    ];

    expect(totalFixedForMonth(fixedExpenses, '2026-11')).toBe(50_000);
  });
});

describe('distribuição de tetos semanais', () => {
  it('divide igualmente quando a conta é exata', () => {
    expect(distributeWeeklyCaps(400_000, 4)).toEqual([100_000, 100_000, 100_000, 100_000]);
  });

  it('distribui centavos restantes nas primeiras semanas', () => {
    expect(distributeWeeklyCaps(10_001, 4)).toEqual([2_501, 2_500, 2_500, 2_500]);
    expect(distributeWeeklyCaps(10_003, 4)).toEqual([2_501, 2_501, 2_501, 2_500]);
  });

  it('zera tetos quando não há valor disponível', () => {
    expect(distributeWeeklyCaps(0, 4)).toEqual([0, 0, 0, 0]);
    expect(distributeWeeklyCaps(-5_000, 4)).toEqual([0, 0, 0, 0]);
    expect(distributeWeeklyCaps(100, 0)).toEqual([]);
  });

  it('preserva o total distribuído', () => {
    const caps = distributeWeeklyCaps(123_457, 4);
    expect(caps.reduce((total, cap) => total + cap, 0)).toBe(123_457);
  });
});

describe('status semanal', () => {
  it('classifica abaixo de 80%, entre 80% e 100% e acima de 100%', () => {
    expect(getWeekStatus(100_000, 0)).toBe('ok');
    expect(getWeekStatus(100_000, 79_999)).toBe('ok');
    expect(getWeekStatus(100_000, 80_000)).toBe('attention');
    expect(getWeekStatus(100_000, 100_000)).toBe('attention');
    expect(getWeekStatus(100_000, 100_001)).toBe('over');
  });

  it('trata teto zerado', () => {
    expect(getWeekStatus(0, 0)).toBe('ok');
    expect(getWeekStatus(0, 1)).toBe('over');
  });
});

describe('orçamento mensal', () => {
  it('subtrai fixos e divide o disponível entre as semanas', () => {
    const budget = calculateMonthBudget({
      month: '2026-11',
      salary: 500_000,
      fixedExpenses: [makeFixed({ monthlyAmount: 100_000 })],
      expenses: [],
    });

    expect(budget.salary).toBe(500_000);
    expect(budget.totalFixed).toBe(100_000);
    expect(budget.availableForCaps).toBe(400_000);
    expect(budget.weeks.map((week) => week.cap)).toEqual([100_000, 100_000, 100_000, 100_000]);
    expect(budget.totalSpent).toBe(0);
    expect(budget.balance).toBe(400_000);
    expect(budget.overcommitted).toBe(false);
    expect(budget.activeFixed).toHaveLength(1);
  });

  it('distribui sobras de centavos entre as semanas', () => {
    const budget = calculateMonthBudget({
      month: '2026-11',
      salary: 100_001,
      fixedExpenses: [],
      expenses: [],
    });

    expect(budget.weeks.map((week) => week.cap)).toEqual([25_001, 25_000, 25_000, 25_000]);
  });

  it('agrupa gastos por semana e calcula estouro', () => {
    const budget = calculateMonthBudget({
      month: '2026-11',
      salary: 400_000,
      fixedExpenses: [],
      expenses: [
        makeExpense({ id: '1', date: '2026-11-01', amount: 50_000 }),
        makeExpense({ id: '2', date: '2026-11-07', amount: 30_000 }),
        makeExpense({ id: '3', date: '2026-11-15', amount: 110_000 }),
        makeExpense({ id: '4', date: '2026-11-30', amount: 10_000 }),
        makeExpense({ id: '5', date: '2026-10-31', amount: 999_000 }),
        makeExpense({ id: '6', date: '2026-12-01', amount: 999_000 }),
        makeExpense({ id: '7', date: '2026-11-31', amount: 999_000 }),
      ],
    });

    expect(budget.totalSpent).toBe(200_000);
    expect(budget.balance).toBe(200_000);
    expect(budget.weeks[0]).toMatchObject({
      spent: 80_000,
      remaining: 20_000,
      status: 'attention',
    });
    expect(budget.weeks[1]).toMatchObject({ spent: 0, remaining: 100_000, status: 'ok' });
    expect(budget.weeks[2]).toMatchObject({
      spent: 110_000,
      remaining: -10_000,
      status: 'over',
    });
    expect(budget.weeks[2]?.percent).toBeCloseTo(110);
    expect(budget.weeks[3]).toMatchObject({ spent: 10_000, remaining: 90_000 });
  });

  it('ignora gastos fora do mês e datas inválidas', () => {
    const budget = calculateMonthBudget({
      month: '2026-02',
      salary: 200_000,
      fixedExpenses: [],
      expenses: [
        makeExpense({ date: '2026-02-29', amount: 100 }),
        makeExpense({ date: '2025-02-01', amount: 200 }),
        makeExpense({ date: '2026-03-01', amount: 300 }),
        makeExpense({ date: 'sem-data', amount: 400 }),
      ],
    });

    expect(budget.totalSpent).toBe(0);
  });

  it('suporta fevereiro bissexto e aloca o dia 29 na semana 4', () => {
    const budget = calculateMonthBudget({
      month: '2024-02',
      salary: 400_000,
      fixedExpenses: [],
      expenses: [makeExpense({ date: '2024-02-29', amount: 15_000 })],
    });

    expect(budget.weeks[3]).toMatchObject({ spent: 15_000 });
    expect(budget.weeks[3]?.week.endDate).toBe('2024-02-29');
  });

  it('marca comprometimento maior que a renda', () => {
    const budget = calculateMonthBudget({
      month: '2026-11',
      salary: 100_000,
      fixedExpenses: [makeFixed({ monthlyAmount: 150_000 })],
      expenses: [makeExpense({ amount: 5_000 })],
    });

    expect(budget.availableForCaps).toBe(-50_000);
    expect(budget.overcommitted).toBe(true);
    expect(budget.weeks.every((week) => week.cap === 0)).toBe(true);
    expect(budget.balance).toBe(-55_000);
    expect(budget.spentPercent).toBe(100);
  });

  it('calcula percentual de gasto sobre o disponível', () => {
    const budget = calculateMonthBudget({
      month: '2026-11',
      salary: 400_000,
      fixedExpenses: [],
      expenses: [makeExpense({ amount: 100_000 })],
    });

    expect(budget.spentPercent).toBe(25);
  });

  it('lida com mês sem renda', () => {
    const budget = calculateMonthBudget({
      month: '2026-11',
      salary: 0,
      fixedExpenses: [],
      expenses: [],
    });

    expect(budget.availableForCaps).toBe(0);
    expect(budget.spentPercent).toBe(0);
    expect(budget.weeks[0]?.status).toBe('ok');
  });

  it('marca semana com teto zero e gasto positivo como estourada', () => {
    const budget = calculateMonthBudget({
      month: '2026-11',
      salary: 1,
      fixedExpenses: [],
      expenses: [makeExpense({ date: '2026-11-10', amount: 1 })],
    });

    expect(budget.weeks[0]?.cap).toBe(1);
    expect(budget.weeks[1]).toMatchObject({
      cap: 0,
      spent: 1,
      percent: 100,
      remaining: -1,
      status: 'over',
    });
    expect(budget.weeks[2]).toMatchObject({ cap: 0, spent: 0, status: 'ok' });
  });
});
