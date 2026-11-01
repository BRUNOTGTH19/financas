import { z } from 'zod';
import { isIsoDate } from '../domain/calendar';

const MONTH_MESSAGE = 'Use um mês no formato AAAA-MM.';
const DATE_MESSAGE = 'Informe uma data válida.';

export const monthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, MONTH_MESSAGE);

export const isoDateSchema = z.string().refine(isIsoDate, DATE_MESSAGE);

export const moneySchema = z
  .number({ message: 'Informe um valor.' })
  .int('Use um valor inteiro em centavos.')
  .nonnegative('O valor não pode ser negativo.');

export const positiveMoneySchema = moneySchema.positive('O valor deve ser maior que zero.');

export const paymentMethodSchema = z.enum(['debito', 'pix', 'credito_vista', 'credito_parcelado']);

export const incomeSchema = z.object({
  id: z.string().min(1),
  month: monthKeySchema,
  amount: moneySchema,
});

export const fixedExpenseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, 'Dê um nome ao fixo.').max(80, 'Nome muito longo.'),
    monthlyAmount: positiveMoneySchema,
    startMonth: monthKeySchema,
    endMonth: monthKeySchema.optional(),
    settledAt: monthKeySchema.optional(),
  })
  .refine((fixed) => !fixed.endMonth || fixed.endMonth >= fixed.startMonth, {
    message: 'O término não pode ser anterior ao início.',
    path: ['endMonth'],
  });

export const expenseSchema = z
  .object({
    id: z.string().min(1),
    date: isoDateSchema,
    amount: positiveMoneySchema,
    method: paymentMethodSchema,
    description: z.string().trim().max(120, 'Descrição muito longa.').optional(),
    installmentCount: z
      .number()
      .int('Use um número inteiro de parcelas.')
      .min(2, 'Parcelamento exige ao menos 2 parcelas.')
      .max(60, 'Máximo de 60 parcelas.')
      .optional(),
    linkedFixedId: z.string().min(1).optional(),
  })
  .refine((expense) => expense.method !== 'credito_parcelado' || expense.installmentCount, {
    message: 'Informe em quantas parcelas foi a compra.',
    path: ['installmentCount'],
  });

export const settingsSchema = z.object({
  savingsGoal: moneySchema,
});

export const persistedStateSchema = z.object({
  incomes: z.array(incomeSchema),
  fixedExpenses: z.array(fixedExpenseSchema),
  expenses: z.array(expenseSchema),
  settings: settingsSchema,
});

export const salaryInputSchema = z.object({
  month: monthKeySchema,
  amount: moneySchema,
});

export const savingsGoalSchema = moneySchema;

export const fixedExpenseInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Dê um nome ao fixo.').max(80, 'Nome muito longo.'),
    monthlyAmount: positiveMoneySchema,
    startMonth: monthKeySchema,
    endMonth: monthKeySchema.optional(),
  })
  .refine((fixed) => !fixed.endMonth || fixed.endMonth >= fixed.startMonth, {
    message: 'O término não pode ser anterior ao início.',
    path: ['endMonth'],
  });

export const expenseInputSchema = z
  .object({
    date: isoDateSchema,
    amount: positiveMoneySchema,
    method: paymentMethodSchema,
    description: z.string().trim().max(120, 'Descrição muito longa.').optional(),
    installmentCount: z
      .number()
      .int('Use um número inteiro de parcelas.')
      .min(2, 'Parcelamento exige ao menos 2 parcelas.')
      .max(60, 'Máximo de 60 parcelas.')
      .optional(),
  })
  .refine((expense) => expense.method !== 'credito_parcelado' || expense.installmentCount, {
    message: 'Informe em quantas parcelas foi a compra.',
    path: ['installmentCount'],
  });

export type SalaryFormInput = z.infer<typeof salaryInputSchema>;
export type FixedExpenseFormInput = z.infer<typeof fixedExpenseInputSchema>;
export type ExpenseFormInput = z.infer<typeof expenseInputSchema>;
export type PersistedState = z.infer<typeof persistedStateSchema>;
