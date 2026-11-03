import { beforeEach, describe, expect, it } from 'vitest';
import {
  createEmptyFinanceData,
  mergePersistedState,
  STORAGE_KEY,
  STORAGE_VERSION,
  useFinanceStore,
} from '../../src/store/financeStore';

const store = () => useFinanceStore.getState();

beforeEach(() => {
  localStorage.clear();
  store().resetAll();
  localStorage.clear();
});

describe('salário e configurações', () => {
  it('cria e atualiza o salário do mês sem duplicar', () => {
    store().setSalary('2026-11', 500_000);
    const firstId = store().incomes[0]?.id;

    store().setSalary('2026-11', 600_000);

    expect(store().incomes).toHaveLength(1);
    expect(store().incomes[0]).toMatchObject({
      id: firstId,
      month: '2026-11',
      amount: 600_000,
    });

    store().setSalary('2026-12', 700_000);
    expect(store().incomes).toHaveLength(2);
  });

  it('atualiza a meta de economia', () => {
    store().setSavingsGoal(150_000);
    expect(store().settings.savingsGoal).toBe(150_000);
  });

  it('rejeita dados inválidos nas ações', () => {
    expect(() => store().setSalary('2026-13', 100)).toThrow();
    expect(() => store().setSavingsGoal(-1)).toThrow();
  });
});

describe('fixos', () => {
  it('cria, edita, quita, reativa e remove um fixo', () => {
    const id = store().addFixed({
      name: 'Aluguel',
      monthlyAmount: 150_000,
      startMonth: '2026-01',
    });

    expect(store().fixedExpenses).toHaveLength(1);
    expect(store().fixedExpenses[0]).toMatchObject({ id, name: 'Aluguel' });

    store().updateFixed(id, {
      name: 'Aluguel novo',
      monthlyAmount: 160_000,
      startMonth: '2026-02',
      endMonth: '2027-01',
    });

    expect(store().fixedExpenses[0]).toMatchObject({
      id,
      name: 'Aluguel novo',
      monthlyAmount: 160_000,
      startMonth: '2026-02',
      endMonth: '2027-01',
    });

    store().setFixedSettled(id, '2026-08', true);
    expect(store().fixedExpenses[0]?.settledAt).toBe('2026-08');

    store().setFixedSettled(id, '2026-08', false);
    expect(store().fixedExpenses[0]?.settledAt).toBeUndefined();

    store().removeFixed(id);
    expect(store().fixedExpenses).toHaveLength(0);
  });

  it('rejeita fixos inválidos', () => {
    expect(() =>
      store().addFixed({
        name: '',
        monthlyAmount: 1,
        startMonth: '2026-01',
      }),
    ).toThrow();

    expect(() =>
      store().addFixed({
        name: 'Internet',
        monthlyAmount: 1,
        startMonth: '2026-10',
        endMonth: '2026-01',
      }),
    ).toThrow();
  });
});

describe('gastos', () => {
  it('registra, edita e remove gasto à vista sem criar fixo', () => {
    const id = store().addExpense({
      date: '2026-11-05',
      amount: 4_500,
      method: 'debito',
      description: 'Padaria',
    });

    expect(store().expenses).toHaveLength(1);
    expect(store().fixedExpenses).toHaveLength(0);
    expect(store().expenses[0]).toMatchObject({
      id,
      amount: 4_500,
      method: 'debito',
      description: 'Padaria',
    });
    expect(store().expenses[0]?.installmentCount).toBeUndefined();

    store().updateExpense(id, {
      date: '2026-11-06',
      amount: 5_000,
      method: 'pix',
      description: 'Padaria nova',
    });

    expect(store().expenses[0]).toMatchObject({
      id,
      amount: 5_000,
      method: 'pix',
      description: 'Padaria nova',
    });

    store().removeExpense(id);
    expect(store().expenses).toHaveLength(0);
  });

  it('gera fixo com término automático para crédito parcelado', () => {
    const id = store().addExpense({
      date: '2026-11-20',
      amount: 10_000,
      method: 'credito_parcelado',
      description: 'Notebook',
      installmentCount: 8,
    });

    const expense = store().expenses[0];
    const fixed = store().fixedExpenses[0];

    expect(expense).toMatchObject({
      id,
      amount: 10_000,
      installmentCount: 8,
      linkedFixedId: fixed?.id,
    });
    expect(fixed).toMatchObject({
      name: 'Notebook (8x)',
      monthlyAmount: 10_000,
      startMonth: '2026-12',
      endMonth: '2027-06',
    });
  });

  it('gera uma única parcela futura no parcelamento em 2x', () => {
    store().addExpense({
      date: '2026-11-20',
      amount: 5_000,
      method: 'credito_parcelado',
      installmentCount: 2,
    });

    expect(store().fixedExpenses[0]).toMatchObject({
      startMonth: '2026-12',
      endMonth: '2026-12',
    });
  });

  it('remove o fixo antigo ao editar um parcelamento', () => {
    const id = store().addExpense({
      date: '2026-11-20',
      amount: 10_000,
      method: 'credito_parcelado',
      description: 'Notebook',
      installmentCount: 8,
    });
    const oldFixedId = store().expenses[0]?.linkedFixedId;

    store().updateExpense(id, {
      date: '2026-12-05',
      amount: 20_000,
      method: 'credito_parcelado',
      description: 'Notebook novo',
      installmentCount: 3,
    });

    expect(store().fixedExpenses).toHaveLength(1);
    expect(store().fixedExpenses[0]?.id).not.toBe(oldFixedId);
    expect(store().fixedExpenses[0]).toMatchObject({
      name: 'Notebook novo (3x)',
      startMonth: '2027-01',
      endMonth: '2027-02',
    });
    expect(store().expenses[0]).toMatchObject({
      id,
      date: '2026-12-05',
      amount: 20_000,
      linkedFixedId: store().fixedExpenses[0]?.id,
    });
  });

  it('remove o fixo gerado ao remover o gasto parcelado', () => {
    const id = store().addExpense({
      date: '2026-11-20',
      amount: 10_000,
      method: 'credito_parcelado',
      installmentCount: 4,
    });

    store().removeExpense(id);

    expect(store().expenses).toHaveLength(0);
    expect(store().fixedExpenses).toHaveLength(0);
  });

  it('limpa vínculo ao remover o fixo e ainda permite remover o gasto', () => {
    const expenseId = store().addExpense({
      date: '2026-11-20',
      amount: 10_000,
      method: 'credito_parcelado',
      installmentCount: 4,
    });
    const fixedId = store().fixedExpenses[0]?.id;
    if (!fixedId) throw new Error('Fixo não gerado');

    store().removeFixed(fixedId);

    expect(store().expenses[0]?.linkedFixedId).toBeUndefined();

    store().removeExpense(expenseId);
    expect(store().expenses).toHaveLength(0);
  });

  it('ignora edição e remoção de gasto inexistente', () => {
    expect(() =>
      store().updateExpense('inexistente', {
        date: '2026-11-01',
        amount: 100,
        method: 'pix',
      }),
    ).not.toThrow();
    expect(() => store().removeExpense('inexistente')).not.toThrow();
  });

  it('rejeita parcelamento sem número de parcelas', () => {
    expect(() =>
      store().addExpense({
        date: '2026-11-20',
        amount: 10_000,
        method: 'credito_parcelado',
      }),
    ).toThrow();
  });

  it('descarta campos de parcelamento em compra à vista', () => {
    store().addExpense({
      date: '2026-11-20',
      amount: 10_000,
      method: 'credito_vista',
      installmentCount: 3,
    });

    expect(store().expenses[0]?.installmentCount).toBeUndefined();
    expect(store().expenses[0]?.linkedFixedId).toBeUndefined();
    expect(store().fixedExpenses).toHaveLength(0);
  });
});

describe('persistência', () => {
  it('grava estado versionado no localStorage sem ações', () => {
    store().setSalary('2026-11', 500_000);
    store().setSavingsGoal(100_000);
    store().addFixed({ name: 'Água', monthlyAmount: 8_000, startMonth: '2026-11' });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();

    const stored = JSON.parse(raw ?? '{}') as {
      version: number;
      state: Record<string, unknown>;
    };

    expect(stored.version).toBe(STORAGE_VERSION);
    expect(stored.state.incomes).toHaveLength(1);
    expect(stored.state.fixedExpenses).toHaveLength(1);
    expect(stored.state.settings).toEqual({ savingsGoal: 100_000 });
    expect(stored.state).not.toHaveProperty('resetAll');
  });

  it('faz merge de estado persistido válido', () => {
    const current = store();
    const merged = mergePersistedState(
      {
        ...createEmptyFinanceData(),
        incomes: [{ id: 'inc_1', month: '2026-11', amount: 400_000 }],
        settings: { savingsGoal: 50_000 },
      },
      current,
    );

    expect(merged.incomes).toHaveLength(1);
    expect(merged.settings.savingsGoal).toBe(50_000);
    expect(merged.addExpense).toBe(current.addExpense);
  });

  it('mantém o estado atual quando o persistido é inválido', () => {
    const current = store();
    expect(mergePersistedState({ incomes: 'quebrado' }, current)).toBe(current);
    expect(mergePersistedState(null, current)).toBe(current);
  });

  it('limpa todo o estado com resetAll', () => {
    store().setSalary('2026-11', 500_000);
    store().resetAll();

    expect(store().incomes).toEqual([]);
    expect(store().fixedExpenses).toEqual([]);
    expect(store().expenses).toEqual([]);
    expect(store().settings.savingsGoal).toBe(0);
  });

  it('substitui todos os dados importados', () => {
    store().setSalary('2026-11', 500_000);
    store().setSavingsGoal(100_000);

    store().replaceData({
      incomes: [{ id: 'inc_2', month: '2026-12', amount: 700_000 }],
      fixedExpenses: [
        { id: 'fix_2', name: 'Internet', monthlyAmount: 10_000, startMonth: '2026-12' },
      ],
      expenses: [],
      settings: { savingsGoal: 200_000 },
    });

    expect(store().incomes).toEqual([{ id: 'inc_2', month: '2026-12', amount: 700_000 }]);
    expect(store().fixedExpenses[0]?.name).toBe('Internet');
    expect(store().settings.savingsGoal).toBe(200_000);
  });

  it('mescla dados importados sem duplicar ids', () => {
    store().setSalary('2026-11', 500_000);

    store().mergeData({
      incomes: [
        { id: 'inc_1', month: '2026-12', amount: 700_000 },
        { id: store().incomes[0]?.id ?? '', month: '2026-11', amount: 900_000 },
      ],
      fixedExpenses: [],
      expenses: [],
      settings: { savingsGoal: 50_000 },
    });

    expect(store().incomes).toHaveLength(2);
    expect(store().incomes.find((income) => income.id === 'inc_1')?.amount).toBe(700_000);
    expect(store().settings.savingsGoal).toBe(50_000);
  });

  it('rejeita dados importados inválidos sem alterar o estado', () => {
    store().setSalary('2026-11', 500_000);

    expect(() =>
      store().replaceData({
        incomes: [{ id: 'inc_1', month: '2026-11', amount: 10.5 }],
        fixedExpenses: [],
        expenses: [],
        settings: { savingsGoal: 0 },
      }),
    ).toThrow();

    expect(store().incomes).toHaveLength(1);
    expect(store().incomes[0]?.amount).toBe(500_000);
  });
});
