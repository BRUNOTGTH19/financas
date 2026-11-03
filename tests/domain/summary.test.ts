import { describe, expect, it } from 'vitest';
import { calculateMonthBudget } from '../../src/domain/budget';
import { buildAiSummary } from '../../src/domain/summary';

function budgetFor(
  month: string,
  salary: number,
  fixedExpenses: Parameters<typeof calculateMonthBudget>[0]['fixedExpenses'],
  expenses: Parameters<typeof calculateMonthBudget>[0]['expenses'],
) {
  return calculateMonthBudget({ month, salary, fixedExpenses, expenses });
}

describe('resumo para IA', () => {
  it('gera o resumo de um mês com todas as semanas e status', () => {
    const budget = budgetFor(
      '2026-11',
      500_000,
      [{ id: 'fix_1', name: 'Aluguel', monthlyAmount: 100_000, startMonth: '2026-01' }],
      [
        { date: '2026-11-03', amount: 90_000 },
        { date: '2026-11-10', amount: 120_000 },
      ],
    );
    const summary = buildAiSummary({
      budget,
      savingsGoal: 50_000,
      today: '2026-11-15',
    });

    expect(summary).toContain('Resumo financeiro — Novembro de 2026');
    expect(summary).toContain('Salário do mês: R$ 5.000,00');
    expect(summary).toContain('Fixos do mês: R$ 1.000,00');
    expect(summary).toContain('- Aluguel: R$ 1.000,00');
    expect(summary).toContain('Disponível para as semanas: R$ 4.000,00');
    expect(summary).toContain(
      'Semana 1 (dias 01–07): teto R$ 1.000,00, gasto R$ 900,00 (90%), status ATENÇÃO',
    );
    expect(summary).toContain(
      'Semana 2 (dias 08–14): teto R$ 1.000,00, gasto R$ 1.200,00 (120%), status SEGURE ESSA SEMANA',
    );
    expect(summary).toContain(
      'Semana 3 (dias 15–21): teto R$ 1.000,00, gasto R$ 0,00 (0%), status OK',
    );
    expect(summary).toContain(
      'Semana 4 (dias 22–30): teto R$ 1.000,00, gasto R$ 0,00 (0%), status OK',
    );
    expect(summary).toContain('Saldo atual: R$ 1.900,00');
    expect(summary).toContain('Meta de economia: R$ 500,00');
    expect(summary).toContain('Projeção de fim de mês:');
    expect(summary).toContain('- Gasto projetado: R$ 4.200,00');
    expect(summary).toContain('- Saldo projetado: -R$ 200,00');
    expect(summary).toContain('- Meta de economia: em risco');
    expect(summary).not.toContain('"version"');
    expect(summary).not.toContain('exportedAt');
  });

  it('mostra todas as semanas zeradas em um mês sem gastos', () => {
    const budget = budgetFor('2026-11', 300_000, [], []);
    const summary = buildAiSummary({
      budget,
      savingsGoal: 0,
      today: '2026-11-10',
    });

    expect(summary).toContain('Fixos do mês: R$ 0,00');
    expect(summary).toContain('- Nenhum fixo ativo neste mês.');
    expect(summary.match(/gasto R\$ 0,00 \(0%\), status OK/g)).toHaveLength(4);
    expect(summary).toContain('Saldo atual: R$ 3.000,00');
    expect(summary).toContain('Meta de economia: R$ 0,00');
  });

  it('não inclui no mês seguinte um fixo que terminou', () => {
    const fixedExpenses = [
      {
        id: 'fix_1',
        name: 'Assinatura antiga',
        monthlyAmount: 5_000,
        startMonth: '2026-01',
        endMonth: '2026-10',
      },
      { id: 'fix_2', name: 'Aluguel', monthlyAmount: 100_000, startMonth: '2026-01' },
    ];
    const october = buildAiSummary({
      budget: budgetFor('2026-10', 500_000, fixedExpenses, []),
      savingsGoal: 0,
      today: '2026-10-15',
    });
    const november = buildAiSummary({
      budget: budgetFor('2026-11', 500_000, fixedExpenses, []),
      savingsGoal: 0,
      today: '2026-11-15',
    });

    expect(october).toContain('Assinatura antiga');
    expect(november).not.toContain('Assinatura antiga');
    expect(november).toContain('Aluguel');
    expect(november).toContain('Fixos do mês: R$ 1.000,00');
  });

  it('omite a projeção quando o mês ainda não tem renda', () => {
    const budget = budgetFor('2026-11', 0, [], []);
    const summary = buildAiSummary({ budget, savingsGoal: 0, today: '2026-11-10' });

    expect(summary).toContain('Salário do mês: R$ 0,00');
    expect(summary).not.toContain('Projeção de fim de mês:');
  });
});
