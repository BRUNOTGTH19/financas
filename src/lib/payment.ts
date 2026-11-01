import type { PaymentMethod } from '../domain/types';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'debito',
  'pix',
  'credito_vista',
  'credito_parcelado',
];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  debito: 'Débito',
  pix: 'PIX',
  credito_vista: 'Crédito à vista',
  credito_parcelado: 'Crédito parcelado',
};

export const PAYMENT_SHORT_LABELS: Record<PaymentMethod, string> = {
  debito: 'Débito',
  pix: 'PIX',
  credito_vista: 'Crédito',
  credito_parcelado: 'Parcelado',
};

export function paymentLabel(method: PaymentMethod): string {
  return PAYMENT_LABELS[method];
}

export function isCreditMethod(method: PaymentMethod): boolean {
  return method === 'credito_vista' || method === 'credito_parcelado';
}
