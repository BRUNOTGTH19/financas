import { useParams } from 'react-router-dom';
import { isMonthKey } from '../domain/calendar';
import { currentMonthKey } from '../lib/dates';

export function useMonth(): string {
  const { month } = useParams<{ month: string }>();
  return month && isMonthKey(month) ? month : currentMonthKey();
}
