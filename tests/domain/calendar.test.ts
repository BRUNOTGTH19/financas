import { describe, expect, it } from 'vitest';
import {
  addMonthsToMonthKey,
  compareMonths,
  daysInMonth,
  formatMonthKey,
  getCurrentWeekIndex,
  getWeekForDate,
  getWeekIndexForDate,
  getWeeksOfMonth,
  isDateInMonth,
  isIsoDate,
  isMonthKey,
  monthEndDate,
  monthLabel,
  monthStartDate,
  parseMonthKey,
} from '../../src/domain/calendar';

describe('month keys', () => {
  it('valida chaves de mês', () => {
    expect(isMonthKey('2026-11')).toBe(true);
    expect(isMonthKey('2024-02')).toBe(true);
    expect(isMonthKey('2024-00')).toBe(false);
    expect(isMonthKey('2024-13')).toBe(false);
    expect(isMonthKey('2024-1')).toBe(false);
    expect(isMonthKey('')).toBe(false);
  });

  it('converte chave de mês em data e vice-versa', () => {
    const date = parseMonthKey('2024-02');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(1);
    expect(formatMonthKey(date)).toBe('2024-02');
  });

  it('lança erro para mês inválido', () => {
    expect(() => parseMonthKey('2024-13')).toThrow(RangeError);
    expect(() => parseMonthKey('fevereiro')).toThrow(RangeError);
  });

  it('formata o rótulo em português', () => {
    expect(monthLabel('2026-03')).toBe('Março de 2026');
  });

  it('calcula dias reais do mês, incluindo fevereiro bissexto', () => {
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2023-02')).toBe(28);
    expect(daysInMonth('2024-04')).toBe(30);
    expect(daysInMonth('2024-01')).toBe(31);
    expect(daysInMonth('2000-02')).toBe(29);
    expect(daysInMonth('1900-02')).toBe(28);
  });

  it('soma meses atravessando a virada do ano', () => {
    expect(addMonthsToMonthKey('2024-12', 1)).toBe('2025-01');
    expect(addMonthsToMonthKey('2024-01', -1)).toBe('2023-12');
    expect(addMonthsToMonthKey('2024-01', 13)).toBe('2025-02');
    expect(addMonthsToMonthKey('2024-08', 0)).toBe('2024-08');
  });

  it('compara meses cronologicamente', () => {
    expect(compareMonths('2024-01', '2024-02')).toBe(-1);
    expect(compareMonths('2024-02', '2024-01')).toBe(1);
    expect(compareMonths('2024-02', '2024-02')).toBe(0);
    expect(compareMonths('2023-12', '2024-01')).toBe(-1);
  });

  it('retorna início e fim do mês', () => {
    expect(monthStartDate('2024-02')).toBe('2024-02-01');
    expect(monthEndDate('2024-02')).toBe('2024-02-29');
    expect(monthEndDate('2024-04')).toBe('2024-04-30');
    expect(monthEndDate('2024-01')).toBe('2024-01-31');
  });
});

describe('datas ISO', () => {
  it('valida datas reais', () => {
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2023-02-28')).toBe(true);
    expect(isIsoDate('2024-12-31')).toBe(true);
    expect(isIsoDate('2023-02-29')).toBe(false);
    expect(isIsoDate('2024-04-31')).toBe(false);
    expect(isIsoDate('2024-00-10')).toBe(false);
    expect(isIsoDate('2024-13-10')).toBe(false);
    expect(isIsoDate('2024-01-00')).toBe(false);
    expect(isIsoDate('2024-1-01')).toBe(false);
    expect(isIsoDate('ontem')).toBe(false);
  });

  it('verifica se a data pertence ao mês', () => {
    expect(isDateInMonth('2024-02-29', '2024-02')).toBe(true);
    expect(isDateInMonth('2024-03-01', '2024-02')).toBe(false);
    expect(isDateInMonth('2023-02-29', '2023-02')).toBe(false);
  });
});

describe('semanas do mês', () => {
  it('calcula 4 semanas para fevereiro bissexto', () => {
    const weeks = getWeeksOfMonth('2024-02');

    expect(weeks).toHaveLength(4);
    expect(weeks.map((week) => [week.startDay, week.endDay])).toEqual([
      [1, 7],
      [8, 14],
      [15, 21],
      [22, 29],
    ]);
    expect(weeks[3]).toMatchObject({
      startDate: '2024-02-22',
      endDate: '2024-02-29',
      label: '22–29',
      dayCount: 8,
    });
  });

  it.each([
    ['2023-02', 28],
    ['2024-04', 30],
    ['2024-01', 31],
  ])('faz a última semana de %s terminar no dia %i', (month, lastDay) => {
    const weeks = getWeeksOfMonth(month);
    expect(weeks).toHaveLength(4);
    expect(weeks[0]?.startDay).toBe(1);
    expect(weeks[0]?.endDay).toBe(7);
    expect(weeks[1]?.startDay).toBe(8);
    expect(weeks[1]?.endDay).toBe(14);
    expect(weeks[2]?.startDay).toBe(15);
    expect(weeks[2]?.endDay).toBe(21);
    expect(weeks[3]?.startDay).toBe(22);
    expect(weeks[3]?.endDay).toBe(lastDay);
    expect(weeks[3]?.endDate).toBe(`${month}-${lastDay}`);
  });

  it('mapeia qualquer dia para a semana correta, inclusive dias 29 a 31', () => {
    expect(getWeekIndexForDate('2024-02-01')).toBe(1);
    expect(getWeekIndexForDate('2024-02-07')).toBe(1);
    expect(getWeekIndexForDate('2024-02-08')).toBe(2);
    expect(getWeekIndexForDate('2024-02-14')).toBe(2);
    expect(getWeekIndexForDate('2024-02-15')).toBe(3);
    expect(getWeekIndexForDate('2024-02-21')).toBe(3);
    expect(getWeekIndexForDate('2024-02-22')).toBe(4);
    expect(getWeekIndexForDate('2024-02-28')).toBe(4);
    expect(getWeekIndexForDate('2024-02-29')).toBe(4);
    expect(getWeekIndexForDate('2024-01-31')).toBe(4);
    expect(getWeekIndexForDate('inválida')).toBeNull();
  });

  it('retorna a semana correspondente à data', () => {
    expect(getWeekForDate('2024-04-30')).toMatchObject({
      index: 4,
      startDate: '2024-04-22',
      endDate: '2024-04-30',
    });
    expect(getWeekForDate('2024-04-08')?.index).toBe(2);
    expect(getWeekForDate('2024-04-31')).toBeNull();
  });

  it('descobre a semana atual apenas quando a data está no mês', () => {
    expect(getCurrentWeekIndex('2024-02-29', '2024-02')).toBe(4);
    expect(getCurrentWeekIndex('2024-02-10', '2024-02')).toBe(2);
    expect(getCurrentWeekIndex('2024-03-01', '2024-02')).toBeNull();
    expect(getCurrentWeekIndex('data-ruim', '2024-02')).toBeNull();
  });
});
