import { describe, expect, it } from 'vitest';
import { calculateMonthBudget } from '../../src/domain/budget';
import { projectMonth } from '../../src/domain/projection';
import type { FixedExpense, MonthBudget } from '../../src/domain/types';

function makeBudget(
  month: string,
  salary: number,
  expenses: { date: string; amount: number }[] = [],
  fixedExpenses: FixedExpense[] = [],
): MonthBudget {
  return calculateMonthBudget({ month, salary, expenses, fixedExpenses });
}

describe('projeção mensal', () => {
  it('projeta o fim do mês pelo ritmo diário atual', () => {
    const budget = makeBudget(
      '2026-11',
      600_000,
      [
        { date: '2026-11-05', amount: 100_000 },
        { date: '2026-11-10', amount: 50_000 },
      ],
      [
        {
          id: 'fixed-1',
          name: 'Aluguel',
          monthlyAmount: 100_000,
          startMonth: '2026-01',
        },
      ],
    );

    const projection = projectMonth({ budget, savingsGoal: 100_000, today: '2026-11-10' });

    expect(projection).toMatchObject({
      phase: 'current',
      daysInMonth: 30,
      elapsedDays: 10,
      remainingDays: 20,
      dailyPace: 15_000,
      projectedSpend: 450_000,
      projectedBalance: 50_000,
      savingsGoal: 100_000,
      goalGap: -50_000,
      safeDailySpend: 12_500,
      status: 'meta_em_risco',
    });
  });

  it('considera a meta batida quando a projeção alcança a economia', () => {
    const budget = makeBudget(
      '2026-11',
      600_000,
      [],
      [
        {
          id: 'fixed-1',
          name: 'Aluguel',
          monthlyAmount: 100_000,
          startMonth: '2026-01',
        },
      ],
    );

    const projection = projectMonth({ budget, savingsGoal: 100_000, today: '2026-11-01' });

    expect(projection.goalGap).toBe(400_000);
    expect(projection.status).toBe('meta_atingida');
  });

  it('usa o realizado em meses passados', () => {
    const budget = makeBudget('2026-11', 600_000, [{ date: '2026-11-05', amount: 100_000 }]);

    const projection = projectMonth({ budget, savingsGoal: 50_000, today: '2026-12-05' });

    expect(projection).toMatchObject({
      phase: 'past',
      elapsedDays: 30,
      remainingDays: 0,
      dailyPace: 3_333,
      projectedSpend: 100_000,
      projectedBalance: 500_000,
      goalGap: 450_000,
      safeDailySpend: 0,
      status: 'meta_atingida',
    });
  });

  it('não inventa gastos em meses futuros', () => {
    const budget = makeBudget('2026-11', 600_000);

    const projection = projectMonth({ budget, savingsGoal: 100_000, today: '2026-10-05' });

    expect(projection).toMatchObject({
      phase: 'future',
      elapsedDays: 0,
      remainingDays: 30,
      dailyPace: 0,
      projectedSpend: 0,
      projectedBalance: 600_000,
      safeDailySpend: 16_667,
      status: 'meta_atingida',
    });
  });

  it('calcula folga diária sem gastos no mês corrente', () => {
    const budget = makeBudget(
      '2026-11',
      600_000,
      [],
      [
        {
          id: 'fixed-1',
          name: 'Aluguel',
          monthlyAmount: 100_000,
          startMonth: '2026-01',
        },
      ],
    );

    const projection = projectMonth({ budget, savingsGoal: 100_000, today: '2026-11-10' });

    expect(projection.projectedSpend).toBe(0);
    expect(projection.safeDailySpend).toBe(20_000);
  });

  it('sinaliza falta de renda mesmo que a meta seja zero', () => {
    const budget = makeBudget('2026-11', 0);

    const projection = projectMonth({ budget, savingsGoal: 0, today: '2026-11-10' });

    expect(projection.status).toBe('sem_renda');
    expect(projection.goalGap).toBe(0);
  });

  it('arredonda projeção e folga diária', () => {
    const budget = makeBudget('2026-01', 3_100, [{ date: '2026-01-01', amount: 100 }]);

    const projection = projectMonth({ budget, savingsGoal: 100, today: '2026-01-03' });

    expect(projection.projectedSpend).toBe(1_033);
    expect(projection.dailyPace).toBe(33);
    expect(projection.safeDailySpend).toBe(104);
  });

  it('zera a folga diária quando a meta já exige mais que o disponível', () => {
    const budget = makeBudget('2026-11', 100_000, [{ date: '2026-11-01', amount: 90_000 }]);

    const projection = projectMonth({ budget, savingsGoal: 50_000, today: '2026-11-10' });

    expect(projection.goalGap).toBeLessThan(0);
    expect(projection.safeDailySpend).toBe(0);
  });

  it('no último dia do mês usa realizado e não ao ritmo extrapolado', () => {
    const budget = makeBudget('2026-11', 300_000, [{ date: '2026-11-30', amount: 10_000 }]);

    const projection = projectMonth({ budget, savingsGoal: 10_000, today: '2026-11-30' });

    expect(projection).toMatchObject({
      elapsedDays: 30,
      remainingDays: 0,
      dailyPace: 333,
      projectedSpend: 10_000,
      safeDailySpend: 0,
    });
  });

  it('rejeita data de referência inválida', () => {
    const budget = makeBudget('2026-11', 100_000);
    expect(() => projectMonth({ budget, savingsGoal: 0, today: '2026-02-30' })).toThrow(RangeError);
  });
});
