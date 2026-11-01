import { describe, expect, it } from 'vitest';
import {
  expenseInputSchema,
  fixedExpenseInputSchema,
  persistedStateSchema,
  salaryInputSchema,
  savingsGoalSchema,
} from '../../src/schemas/finance';

describe('schemas de entrada', () => {
  it('aceita salário válido e rejeita valores inválidos', () => {
    expect(salaryInputSchema.safeParse({ month: '2026-11', amount: 500_000 }).success).toBe(true);
    expect(salaryInputSchema.safeParse({ month: '2026-13', amount: 500_000 }).success).toBe(false);
    expect(salaryInputSchema.safeParse({ month: '2026-11', amount: -1 }).success).toBe(false);
    expect(salaryInputSchema.safeParse({ month: '2026-11', amount: 10.5 }).success).toBe(false);
  });

  it('valida a meta de economia', () => {
    expect(savingsGoalSchema.safeParse(0).success).toBe(true);
    expect(savingsGoalSchema.safeParse(1_000).success).toBe(true);
    expect(savingsGoalSchema.safeParse(-1).success).toBe(false);
    expect(savingsGoalSchema.safeParse(1.2).success).toBe(false);
  });

  it('valida gasto simples', () => {
    const result = expenseInputSchema.safeParse({
      date: '2024-02-29',
      amount: 2_500,
      method: 'pix',
      description: '  Mercado  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Mercado');
    }
  });

  it('rejeita data inexistente em gasto', () => {
    const result = expenseInputSchema.safeParse({
      date: '2023-02-29',
      amount: 100,
      method: 'debito',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['date']);
  });

  it('exige número de parcelas no crédito parcelado', () => {
    const withoutCount = expenseInputSchema.safeParse({
      date: '2026-11-10',
      amount: 10_000,
      method: 'credito_parcelado',
    });
    const withCount = expenseInputSchema.safeParse({
      date: '2026-11-10',
      amount: 10_000,
      method: 'credito_parcelado',
      installmentCount: 8,
    });

    expect(withoutCount.success).toBe(false);
    expect(withoutCount.error?.issues[0]?.path).toEqual(['installmentCount']);
    expect(withCount.success).toBe(true);
  });

  it('rejeita parcelamento com menos de 2 parcelas', () => {
    const result = expenseInputSchema.safeParse({
      date: '2026-11-10',
      amount: 10_000,
      method: 'credito_parcelado',
      installmentCount: 1,
    });

    expect(result.success).toBe(false);
  });

  it('valida fixo e exige término depois do início', () => {
    expect(
      fixedExpenseInputSchema.safeParse({
        name: 'Internet',
        monthlyAmount: 9_900,
        startMonth: '2026-01',
        endMonth: '2026-12',
      }).success,
    ).toBe(true);

    const invalid = fixedExpenseInputSchema.safeParse({
      name: 'Internet',
      monthlyAmount: 9_900,
      startMonth: '2026-12',
      endMonth: '2026-01',
    });

    expect(invalid.success).toBe(false);
    expect(invalid.error?.issues[0]?.path).toEqual(['endMonth']);
  });

  it('rejeita fixo sem nome ou com valor zero', () => {
    expect(
      fixedExpenseInputSchema.safeParse({
        name: '   ',
        monthlyAmount: 1,
        startMonth: '2026-01',
      }).success,
    ).toBe(false);

    expect(
      fixedExpenseInputSchema.safeParse({
        name: 'Água',
        monthlyAmount: 0,
        startMonth: '2026-01',
      }).success,
    ).toBe(false);
  });
});

describe('schema de persistência', () => {
  const validState = {
    incomes: [{ id: 'inc_1', month: '2026-11', amount: 500_000 }],
    fixedExpenses: [
      {
        id: 'fix_1',
        name: 'Aluguel',
        monthlyAmount: 150_000,
        startMonth: '2026-01',
        endMonth: '2026-12',
        settledAt: '2026-11',
      },
    ],
    expenses: [
      {
        id: 'exp_1',
        date: '2026-11-05',
        amount: 5_000,
        method: 'credito_parcelado',
        installmentCount: 3,
        linkedFixedId: 'fix_1',
      },
    ],
    settings: { savingsGoal: 100_000 },
  };

  it('aceita estado completo', () => {
    expect(persistedStateSchema.safeParse(validState).success).toBe(true);
  });

  it('rejeita estado corrompido', () => {
    expect(
      persistedStateSchema.safeParse({ ...validState, incomes: [{ amount: 'muito' }] }).success,
    ).toBe(false);
    expect(persistedStateSchema.safeParse(null).success).toBe(false);
  });

  it('rejeita gasto parcelado persistido sem parcelas', () => {
    expect(
      persistedStateSchema.safeParse({
        ...validState,
        expenses: [{ ...validState.expenses[0], installmentCount: undefined }],
      }).success,
    ).toBe(false);
  });
});
