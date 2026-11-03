import type { ComponentType } from 'react';
import type { ThemePreference } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

const options: Array<{
  value: ThemePreference;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: 'light', label: 'Claro', icon: SunIcon },
  { value: 'dark', label: 'Escuro', icon: MoonIcon },
  { value: 'system', label: 'Sistema', icon: MonitorIcon },
];

export default function ThemeSelector() {
  const { preference, resolved, setPreference } = useTheme();
  const CurrentIcon = resolved === 'dark' ? MoonIcon : SunIcon;

  return (
    <section className="card card-pad" aria-labelledby="appearance-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/35">
            Preferência visual
          </p>
          <h2 id="appearance-title" className="mt-1 text-lg font-extrabold tracking-tight">
            Aparência
          </h2>
          <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-ink/45">
            Escolha o tema deste navegador. A opção Sistema acompanha automaticamente a preferência
            do seu dispositivo.
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
          <CurrentIcon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div role="group" aria-label="Tema" className="mt-5 grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = preference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setPreference(option.value)}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-3.5 py-3 text-sm font-bold transition ${
                selected
                  ? 'border-brand-950 bg-brand-950 text-white shadow-card dark:border-lime dark:bg-lime dark:text-brand-950 dark:shadow-none'
                  : 'border-ink/10 bg-white/60 text-ink/55 hover:border-ink/20 hover:bg-white hover:text-ink dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <p role="status" className="mt-3 text-xs font-semibold text-ink/40">
        Tema em uso: {resolved === 'dark' ? 'escuro' : 'claro'}
        {preference === 'system' ? ' (definido pelo sistema)' : ''}.
      </p>
    </section>
  );
}
