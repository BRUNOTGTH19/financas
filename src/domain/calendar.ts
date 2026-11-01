import { addMonths, format, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MonthKey, WeekPeriod } from './types';

/**
 * Regra fixa de semanas do Spendly:
 * - Semana 1: dias 1 a 7
 * - Semana 2: dias 8 a 14
 * - Semana 3: dias 15 a 21
 * - Semana 4: dias 22 até o fim do mês (28, 29, 30 ou 31)
 *
 * O número de semanas é calculado a partir dos dias reais do mês.
 */
export const DAYS_PER_WEEK = 7;

const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isMonthKey(value: string): value is MonthKey {
  return MONTH_KEY_PATTERN.test(value);
}

export function parseMonthKey(month: MonthKey): Date {
  if (!isMonthKey(month)) {
    throw new RangeError(`Mês inválido: "${month}". Use o formato AAAA-MM.`);
  }

  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));

  return new Date(year, monthNumber - 1, 1);
}

export function formatMonthKey(date: Date): MonthKey {
  return format(date, 'yyyy-MM');
}

export function monthLabel(month: MonthKey): string {
  const label = format(parseMonthKey(month), "MMMM 'de' yyyy", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function daysInMonth(month: MonthKey): number {
  return getDaysInMonth(parseMonthKey(month));
}

export function addMonthsToMonthKey(month: MonthKey, amount: number): MonthKey {
  return formatMonthKey(addMonths(parseMonthKey(month), amount));
}

export function compareMonths(a: MonthKey, b: MonthKey): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function monthStartDate(month: MonthKey): string {
  return `${month}-01`;
}

export function monthEndDate(month: MonthKey): string {
  return `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;
}

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || monthNumber < 1 || monthNumber > 12 || day < 1) return false;

  const date = new Date(0);
  date.setFullYear(year, monthNumber, 0);
  return day <= date.getDate();
}

export function isDateInMonth(date: string, month: MonthKey): boolean {
  return isIsoDate(date) && date.slice(0, 7) === month;
}

export function getWeeksOfMonth(month: MonthKey): WeekPeriod[] {
  const totalDays = daysInMonth(month);
  const chunks: { startDay: number; endDay: number }[] = [];

  for (let startDay = 1; startDay <= totalDays; startDay += DAYS_PER_WEEK) {
    chunks.push({
      startDay,
      endDay: Math.min(startDay + DAYS_PER_WEEK - 1, totalDays),
    });
  }

  // A última semana absorve os dias restantes (ex.: 22–29, 22–30 ou 22–31)
  // em vez de criar uma semana final com menos de 7 dias.
  const lastChunk = chunks[chunks.length - 1];
  if (chunks.length > 1 && lastChunk && lastChunk.endDay - lastChunk.startDay + 1 < DAYS_PER_WEEK) {
    const previousChunk = chunks[chunks.length - 2];
    if (previousChunk) {
      previousChunk.endDay = lastChunk.endDay;
      chunks.pop();
    }
  }

  return chunks.map(({ startDay, endDay }, position) => ({
    index: position + 1,
    startDay,
    endDay,
    startDate: `${month}-${String(startDay).padStart(2, '0')}`,
    endDate: `${month}-${String(endDay).padStart(2, '0')}`,
    label: `${String(startDay).padStart(2, '0')}–${String(endDay).padStart(2, '0')}`,
    dayCount: endDay - startDay + 1,
  }));
}

export function getWeekIndexForDate(date: string): number | null {
  if (!isIsoDate(date)) return null;

  const day = Number(date.slice(8, 10));
  const month = date.slice(0, 7);
  const weekCount = getWeeksOfMonth(month).length;
  const naturalIndex = Math.ceil(day / DAYS_PER_WEEK);

  return Math.min(naturalIndex, weekCount);
}

export function getWeekForDate(date: string): WeekPeriod | null {
  const weekIndex = getWeekIndexForDate(date);
  if (weekIndex === null) return null;

  const month = date.slice(0, 7);
  return getWeeksOfMonth(month).find((week) => week.index === weekIndex) ?? null;
}

export function getCurrentWeekIndex(today: string, month: MonthKey): number | null {
  if (!isDateInMonth(today, month)) return null;
  return getWeekIndexForDate(today);
}
