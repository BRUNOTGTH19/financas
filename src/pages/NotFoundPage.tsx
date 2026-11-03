import { Link } from 'react-router-dom';
import { currentMonthKey } from '../lib/dates';
import { monthPath } from '../lib/navigation';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
        Página não encontrada
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight">Esse plano não existe.</h1>
      <p className="max-w-sm text-sm leading-relaxed text-ink/50">
        Volte para o painel do mês e continue de onde parou.
      </p>
      <Link to={monthPath(currentMonthKey(), 'inicio')} className="btn-primary">
        Ir para o início
      </Link>
    </main>
  );
}
