export type MonthKey = string;

export type PaymentMethod = 'debito' | 'pix' | 'credito_vista' | 'credito_parcelado';

export interface Income {
  id: string;
  month: MonthKey;
  amount: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  monthlyAmount: number;
  startMonth: MonthKey;
  endMonth?: MonthKey;
  settledAt?: MonthKey;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  description?: string;
  installmentCount?: number;
  linkedFixedId?: string;
}

export interface Settings {
  savingsGoal: number;
}

export interface WeekPeriod {
  index: number;
  startDay: number;
  endDay: number;
  startDate: string;
  endDate: string;
  label: string;
  dayCount: number;
}

export type WeekStatus = 'ok' | 'attention' | 'over';

export interface WeekBudget {
  week: WeekPeriod;
  cap: number;
  spent: number;
  remaining: number;
  percent: number;
  status: WeekStatus;
}

export interface MonthBudget {
  month: MonthKey;
  salary: number;
  totalFixed: number;
  availableForCaps: number;
  totalSpent: number;
  balance: number;
  overcommitted: boolean;
  spentPercent: number;
  activeFixed: FixedExpense[];
  weeks: WeekBudget[];
}

export type ProjectionPhase = 'past' | 'current' | 'future';

export type ProjectionStatus = 'sem_renda' | 'meta_em_risco' | 'meta_atingida';

export interface MonthProjection {
  phase: ProjectionPhase;
  daysInMonth: number;
  elapsedDays: number;
  remainingDays: number;
  dailyPace: number;
  projectedSpend: number;
  projectedBalance: number;
  savingsGoal: number;
  goalGap: number;
  safeDailySpend: number;
  status: ProjectionStatus;
}
