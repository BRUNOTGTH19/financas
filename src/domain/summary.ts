import { formatCents } from '../lib/money';
import { monthLabel } from './calendar';
import { projectMonth } from './projection';
import type { MonthBudget, WeekStatus } from './types';

const statusLabel: Record<WeekStatus, string> = {
  ok: 'OK',
  attention: 'ATENÇÃO',
  over: 'SEGURE ESSA SEMANA',
};

function money(cents: number): string {
  return formatCents(cents).replace(/\u00A0/g, ' ');
}

function percent(value: number): string {
  return `${Math.round(value)}%`;
}

export interface AiSummaryInput {
  budget: MonthBudget;
  savingsGoal: number;
  today: string;
}

/**
 * Gera um resumo em texto do mês atual para o usuário colar em uma IA externa.
 * Não inclui backup, ids nem qualquer dado fora do mês consultado.
 */
export function buildAiSummary({ budget, savingsGoal, today }: AiSummaryInput): string {
  const month = monthLabel(budget.month);
  const fixedLines =
    budget.activeFixed.length > 0
      ? budget.activeFixed.map((fixed) => `- ${fixed.name}: ${money(fixed.monthlyAmount)}`)
      : ['- Nenhum fixo ativo neste mês.'];

  const weekLines = budget.weeks.map(
    (week) =>
      `Semana ${week.week.index} (dias ${week.week.label}): teto ${money(week.cap)}, ` +
      `gasto ${money(week.spent)} (${percent(week.percent)}), status ${statusLabel[week.status]}`,
  );

  const projection = projectMonth({ budget, savingsGoal, today });
  const projectionLines =
    projection.status === 'sem_renda'
      ? []
      : [
          '',
          'Projeção de fim de mês:',
          `- Gasto projetado: ${money(projection.projectedSpend)}`,
          `- Saldo projetado: ${money(projection.projectedBalance)}`,
          `- Meta de economia: ${projection.status === 'meta_atingida' ? 'atingida' : 'em risco'}`,
        ];

  return [
    `Resumo financeiro — ${month}`,
    '',
    `Salário do mês: ${money(budget.salary)}`,
    `Fixos do mês: ${money(budget.totalFixed)}`,
    ...fixedLines,
    `Disponível para as semanas: ${money(budget.availableForCaps)}`,
    '',
    'Semanas:',
    ...weekLines,
    '',
    `Saldo atual: ${money(budget.balance)}`,
    `Meta de economia: ${money(savingsGoal)}`,
    ...projectionLines,
    '',
    'Resumo gerado pelo Spendly. Nenhuma chave de API ou dado de backup foi enviado.',
  ].join('\n');
}
