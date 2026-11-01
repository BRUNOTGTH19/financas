import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { useFinanceStore } from '../../src/store/financeStore';

const store = () => useFinanceStore.getState();

function setToday(date: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${date}T12:00:00`));
}

function renderDashboard(month = '2026-11') {
  return render(
    <MemoryRouter initialEntries={[`/mes/${month}/inicio`]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  store().resetAll();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('dashboard', () => {
  it('pede a renda quando o mês ainda não tem salário', () => {
    setToday('2026-11-10');
    renderDashboard();

    expect(screen.getByText('Falta informar a renda do mês')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Definir renda' })).toHaveAttribute(
      'href',
      '/mes/2026-11/configuracoes',
    );
    expect(screen.getByText('Informe a renda para projetar o mês.')).toBeInTheDocument();
    expect(screen.getByText('Os tetos e a projeção dependem da renda do mês.')).toBeInTheDocument();

    const week = screen.getByRole('region', { name: 'Semana atual' });
    expect(within(week).getByText('Semana 2 · dias 08–14')).toBeInTheDocument();
    expect(within(week).getByText('Sem teto')).toBeInTheDocument();
    expect(within(week).getByText('Sem teto definido para esta semana')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Informar renda/ })).toHaveAttribute(
      'href',
      '/mes/2026-11/configuracoes',
    );
  });

  it('mostra o resumo e a projeção quando a meta está garantida', () => {
    setToday('2026-11-10');
    store().setSalary('2026-11', 500_000);
    store().setSavingsGoal(100_000);
    store().addFixed({ name: 'Aluguel', monthlyAmount: 100_000, startMonth: '2026-11' });
    store().addExpense({
      date: '2026-11-10',
      amount: 100_000,
      method: 'pix',
      description: 'Mercado',
    });

    renderDashboard();

    expect(screen.getByText('R$ 4.000,00')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.000,00 gastos')).toBeInTheDocument();
    expect(screen.getByText('Sobra R$ 3.000,00')).toBeInTheDocument();

    expect(screen.getByText('Mês em andamento')).toBeInTheDocument();
    expect(screen.getByText('Meta R$ 1.000,00')).toBeInTheDocument();
    expect(screen.getByText('No ritmo atual, a meta está garantida.')).toBeInTheDocument();
    expect(
      screen.getByText('A meta de R$ 1.000,00 deve ser atingida no ritmo atual.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ritmo diário')).toBeInTheDocument();
    expect(screen.getByText('Pode gastar/dia')).toBeInTheDocument();

    const summary = screen.getByRole('region', { name: 'Resumo do mês' });
    expect(within(summary).getByText('Renda do mês')).toBeInTheDocument();
    expect(within(summary).getByText('Fixos ativos')).toBeInTheDocument();
    expect(within(summary).getByText('Gastos variáveis')).toBeInTheDocument();
    expect(within(summary).getByText('1 lançamento · ver gastos')).toBeInTheDocument();

    const week = screen.getByRole('region', { name: 'Semana atual' });
    expect(within(week).getByText('Semana 2 · dias 08–14')).toBeInTheDocument();
    expect(within(week).getByText('Atenção')).toBeInTheDocument();
    expect(within(week).getByText('Livre R$ 0,00')).toBeInTheDocument();
    expect(within(week).getByText('R$ 0,00 por dia até o dia 14')).toBeInTheDocument();
    expect(within(week).getByRole('link', { name: /Ver todas as semanas/ })).toHaveAttribute(
      'href',
      '/mes/2026-11/semanas',
    );
  });

  it('avisa quando a projeção coloca a meta em risco', () => {
    setToday('2026-11-10');
    store().setSalary('2026-11', 500_000);
    store().setSavingsGoal(100_000);
    store().addExpense({
      date: '2026-11-10',
      amount: 200_000,
      method: 'credito_vista',
      description: 'Celular',
    });

    renderDashboard();

    expect(screen.getByText('No ritmo atual, a meta fica em risco.')).toBeInTheDocument();
    expect(screen.getByText('Faltam R$ 2.000,00 para a meta de R$ 1.000,00.')).toBeInTheDocument();
    expect(screen.getByText('-R$ 1.000,00')).toBeInTheDocument();

    const week = screen.getByRole('region', { name: 'Semana atual' });
    expect(within(week).getByText('Estourou')).toBeInTheDocument();
    expect(within(week).getByText('Excedeu R$ 750,00')).toBeInTheDocument();
    expect(within(week).getByText('Segure os gastos até a virada da semana')).toBeInTheDocument();
  });

  it('adapta a projeção e a semana para um mês encerrado', () => {
    setToday('2026-12-10');
    store().setSalary('2026-11', 500_000);
    store().setSavingsGoal(100_000);
    store().addExpense({
      date: '2026-11-20',
      amount: 450_000,
      method: 'pix',
      description: 'Compra grande',
    });

    renderDashboard();

    expect(screen.getByText('A meta não foi atingida no fechamento.')).toBeInTheDocument();
    expect(screen.getByText('Faltam R$ 500,00 para a meta de R$ 1.000,00.')).toBeInTheDocument();
    expect(screen.getByText('Gasto total')).toBeInTheDocument();

    const week = screen.getByRole('region', { name: 'Semana atual' });
    expect(
      within(week).getByText(
        'O mês já fechou. Confira o teto e o gasto de cada semana no histórico.',
      ),
    ).toBeInTheDocument();
    expect(within(week).getByRole('link', { name: /Ver semanas/ })).toHaveAttribute(
      'href',
      '/mes/2026-11/semanas',
    );
  });
});
