import { formatCents, digitsToCents } from '../lib/money';

export default function CurrencyInput({
  id,
  value,
  onChange,
  invalid = false,
  describedBy,
  autoFocus = false,
  disabled = false,
}: {
  id?: string;
  value: number;
  onChange: (cents: number) => void;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const formatted = formatCents(value).replace(/^R\$\s?/, '');

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 transition focus-within:ring-2 ${
        invalid
          ? 'border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-400/20'
          : 'border-ink/10 focus-within:border-brand-500 focus-within:ring-brand-500/20'
      }`}
    >
      <span className="text-sm font-bold text-ink/40">R$</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={disabled}
        value={formatted}
        onChange={(event) => onChange(digitsToCents(event.target.value))}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="w-full bg-transparent text-lg font-extrabold tabular-nums text-ink outline-none disabled:opacity-50"
      />
    </div>
  );
}
