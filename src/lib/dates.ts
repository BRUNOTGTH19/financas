import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatMonthKey, isIsoDate } from '../domain/calendar';

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function currentMonthKey(): string {
  return formatMonthKey(new Date());
}

export function formatDateShort(date: string): string {
  if (!isIsoDate(date)) return date;
  return format(parseISO(date), "dd 'de' MMM", { locale: ptBR });
}

export function formatDateFull(date: string): string {
  if (!isIsoDate(date)) return date;
  return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateWithWeekday(date: string): string {
  if (!isIsoDate(date)) return date;
  return format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export function formatMonthShort(month: string): string {
  if (!isIsoDate(`${month}-01`)) return month;
  return format(parseISO(`${month}-01`), "MMM 'de' yyyy", { locale: ptBR });
}
