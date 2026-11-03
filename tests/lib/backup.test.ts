import { describe, expect, it } from 'vitest';
import type { FinanceData } from '../../src/domain/types';
import {
  backupFileName,
  createBackup,
  mergeFinanceData,
  parseBackup,
  serializeBackup,
} from '../../src/lib/backup';

const exportedAt = new Date('2026-11-03T12:00:00.000Z');

function sampleData(): FinanceData {
  return {
    incomes: [{ id: 'inc_1', month: '2026-11', amount: 500_000 }],
    fixedExpenses: [
      {
        id: 'fix_1',
        name: 'Aluguel',
        monthlyAmount: 150_000,
        startMonth: '2026-01',
        endMonth: '2026-12',
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
}

describe('backup JSON', () => {
  it('faz round-trip dos mesmos dados', () => {
    const data = sampleData();
    const result = parseBackup(serializeBackup(data, exportedAt));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup).toEqual({
        version: 1,
        exportedAt: '2026-11-03T12:00:00.000Z',
        data,
      });
    }
  });

  it('gera o nome com a data do download', () => {
    expect(backupFileName(new Date(2026, 10, 3))).toBe('financas-2026-11-03.json');
    expect(backupFileName(exportedAt)).toMatch(/^financas-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('rejeita versão diferente de 1', () => {
    const payload = createBackup(sampleData(), exportedAt);
    const result = parseBackup(JSON.stringify({ ...payload, version: 2 }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Versão de backup incompatível');
  });

  it('rejeita valor monetário decimal', () => {
    const payload = createBackup(sampleData(), exportedAt);
    const result = parseBackup(
      JSON.stringify({
        ...payload,
        data: {
          ...payload.data,
          expenses: [{ ...payload.data.expenses[0], amount: 50.5 }],
        },
      }),
    );

    expect(result.ok).toBe(false);
  });

  it('rejeita datas e meses fora do formato', () => {
    const payload = createBackup(sampleData(), exportedAt);

    expect(
      parseBackup(
        JSON.stringify({
          ...payload,
          data: {
            ...payload.data,
            incomes: [{ ...payload.data.incomes[0], month: '11/2026' }],
          },
        }),
      ).ok,
    ).toBe(false);

    expect(
      parseBackup(
        JSON.stringify({
          ...payload,
          data: {
            ...payload.data,
            expenses: [{ ...payload.data.expenses[0], date: '05/11/2026' }],
          },
        }),
      ).ok,
    ).toBe(false);
  });

  it('rejeita JSON inválido e arquivo sem estrutura de backup', () => {
    expect(parseBackup('{')).toMatchObject({ ok: false });
    expect(parseBackup('{}')).toMatchObject({ ok: false });
  });

  it('não altera os dados quando a validação falha', () => {
    const current = sampleData();
    const invalid = parseBackup(
      JSON.stringify({ ...createBackup(current, exportedAt), version: 99 }),
    );

    expect(invalid.ok).toBe(false);
    expect(current).toEqual(sampleData());
  });

  it('mescla sem duplicar registros com o mesmo id', () => {
    const current = sampleData();
    const imported: FinanceData = {
      incomes: [
        { id: 'inc_1', month: '2026-11', amount: 999_999 },
        { id: 'inc_2', month: '2026-12', amount: 600_000 },
      ],
      fixedExpenses: [
        { id: 'fix_1', name: 'Aluguel antigo', monthlyAmount: 1, startMonth: '2026-01' },
        { id: 'fix_2', name: 'Internet', monthlyAmount: 10_000, startMonth: '2026-11' },
      ],
      expenses: [
        {
          id: 'exp_1',
          date: '2026-11-06',
          amount: 1,
          method: 'pix',
        },
        { id: 'exp_2', date: '2026-11-07', amount: 2_000, method: 'debito' },
      ],
      settings: { savingsGoal: 200_000 },
    };

    const merged = mergeFinanceData(current, imported);

    expect(merged.incomes.map((item) => item.id)).toEqual(['inc_1', 'inc_2']);
    expect(merged.fixedExpenses.map((item) => item.id)).toEqual(['fix_1', 'fix_2']);
    expect(merged.expenses.map((item) => item.id)).toEqual(['exp_1', 'exp_2']);
    expect(merged.incomes[0]?.amount).toBe(500_000);
    expect(merged.fixedExpenses[0]?.name).toBe('Aluguel');
    expect(merged.expenses[0]?.amount).toBe(5_000);
    expect(merged.settings.savingsGoal).toBe(100_000);
  });

  it('importa a meta do backup quando ainda não existe meta local', () => {
    const current = { ...sampleData(), settings: { savingsGoal: 0 } };
    const imported = { ...sampleData(), settings: { savingsGoal: 250_000 } };

    expect(mergeFinanceData(current, imported).settings.savingsGoal).toBe(250_000);
  });
});
