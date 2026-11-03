import { format } from 'date-fns';
import type { FinanceData } from '../domain/types';
import { backupSchema, type FinanceBackup } from '../schemas/backup';

export type BackupParseResult =
  { ok: true; backup: FinanceBackup } | { ok: false; message: string };

function cloneData(data: FinanceData): FinanceData {
  return {
    incomes: data.incomes.map((income) => ({ ...income })),
    fixedExpenses: data.fixedExpenses.map((fixed) => ({ ...fixed })),
    expenses: data.expenses.map((expense) => ({ ...expense })),
    settings: { ...data.settings },
  };
}

/** Monta o objeto versionado que pode ser salvo em disco pelo usuário. */
export function createBackup(data: FinanceData, exportedAt = new Date()): FinanceBackup {
  return {
    version: 1,
    exportedAt: exportedAt.toISOString(),
    data: cloneData(data),
  };
}

export function serializeBackup(data: FinanceData, exportedAt = new Date()): string {
  return JSON.stringify(createBackup(data, exportedAt), null, 2);
}

export function backupFileName(date = new Date()): string {
  return `financas-${format(date, 'yyyy-MM-dd')}.json`;
}

function describeIssues(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  const issue = error.issues[0];
  if (!issue) return 'O arquivo de backup não é válido.';
  const path = issue.path.map(String).join('.');
  return path ? `Arquivo inválido em "${path}": ${issue.message}` : issue.message;
}

/**
 * Valida o JSON antes de qualquer alteração de estado. O retorno de erro nunca
 * contém dados parciais: a importação só grava depois de `safeParse` bem-sucedido.
 */
export function parseBackup(raw: string): BackupParseResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { ok: false, message: 'O arquivo não contém um JSON válido.' };
  }

  const result = backupSchema.safeParse(parsedJson);
  if (!result.success) {
    return { ok: false, message: describeIssues(result.error) };
  }

  return { ok: true, backup: result.data };
}

function mergeById<T extends { id: string }>(current: readonly T[], imported: readonly T[]): T[] {
  const currentIds = new Set(current.map((item) => item.id));
  return [...current, ...imported.filter((item) => !currentIds.has(item.id))];
}

/**
 * Mescla sem duplicar registros com o mesmo `id`. Os registros já existentes
 * prevalecem; a meta de economia só é importada quando ainda não há uma meta
 * definida no navegador.
 */
export function mergeFinanceData(current: FinanceData, imported: FinanceData): FinanceData {
  return {
    incomes: mergeById(current.incomes, imported.incomes),
    fixedExpenses: mergeById(current.fixedExpenses, imported.fixedExpenses),
    expenses: mergeById(current.expenses, imported.expenses),
    settings: current.settings.savingsGoal > 0 ? current.settings : { ...imported.settings },
  };
}

/** Dispara o download do backup no navegador, sem enviar nada para a rede. */
export function downloadBackup(data: FinanceData, date = new Date()): void {
  const blob = new Blob([serializeBackup(data, date)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = backupFileName(date);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
