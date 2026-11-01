import { Navigate, Route, Routes } from 'react-router-dom';
import MonthLayout from './components/MonthLayout';
import { currentMonthKey } from './lib/dates';
import { monthPath } from './lib/navigation';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import FixedExpensesPage from './pages/FixedExpensesPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';
import WeeksPage from './pages/WeeksPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={monthPath(currentMonthKey(), 'inicio')} replace />} />
      <Route path="/mes/:month" element={<MonthLayout />}>
        <Route index element={<Navigate to="inicio" replace />} />
        <Route path="inicio" element={<DashboardPage />} />
        <Route path="semanas" element={<WeeksPage />} />
        <Route path="gastos" element={<ExpensesPage />} />
        <Route path="fixos" element={<FixedExpensesPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
