const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 0,
});

export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function formatPercent(ratio: number): string {
  return percentFormatter.format(ratio);
}

export function digitsToCents(value: string): number {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (!digits) return 0;

  const cents = Number(digits);
  return Number.isSafeInteger(cents) ? cents : 0;
}

export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function parseCentsInput(value: string): number {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  if (!normalized) return 0;

  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return Number.NaN;

  return Math.round(amount * 100);
}
