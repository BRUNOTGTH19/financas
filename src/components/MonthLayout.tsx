import { Navigate, useLocation, useParams } from 'react-router-dom';
import { isMonthKey } from '../domain/calendar';
import { currentMonthKey } from '../lib/dates';
import { monthPath, sectionFromPath } from '../lib/navigation';
import AppShell from './AppShell';

export default function MonthLayout() {
  const { month } = useParams<{ month: string }>();
  const location = useLocation();

  if (!month || !isMonthKey(month)) {
    return (
      <Navigate to={monthPath(currentMonthKey(), sectionFromPath(location.pathname))} replace />
    );
  }

  return <AppShell month={month} />;
}
