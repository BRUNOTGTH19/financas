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

function renderWeeksPage(month = '2026-11') {
  return render(
    <MemoryRouter initialEntries={[`/mes/${month}/semanas`]}>
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

describe('tela de semanas', () => {
  it('pede a renda e mostra os tetos zerados', () => {
    setToday('2026-11-10');
    renderWeeksPage();

    expect(screen.getByText('Defina sua renda para liberar os tetos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Informar renda do mês/ })).toHaveAttribute(
      'href',
      '/mes/2026-11/configuracoes',
    );
    expect(screen.getAllByText('Sem teto')).toHaveLength(4);
    expect(screen.getAllByText('Teto não definido')).toHaveLength(4);
  });

  it('distribui os tetos, destaca a semana atual e mostra os avisos', () => {
    setToday('2026-11-10');
    store().setSalary('2026-11', 400_000);
    store().addFixed({ name: 'Aluguel', monthlyAmount: 100_000, startMonth: '2026-11' });
    store().addExpense({
      date: '2026-11-03',
      amount: 30_000,
      method: 'pix',
      description: 'Mercado',
    });
    store().addExpense({
      date: '2026-11-10',
      amount: 65_000,
      method: 'debito',
      description: 'Feira',
    });
    store().addExpense({
      date: '2026-11-18',
      amount: 80_000,
      method: 'credito_vista',
      description: 'Farmácia',
    });

    renderWeeksPage();

    expect(screen.getByText('R$ 3.000,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.750,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.250,00 de saldo')).toBeInTheDocument();
    expect(screen.getByText('A semana 2 chegou a 87% do teto')).toBeInTheDocument();
    expect(screen.getByText(/Restam R\$ 100,00 até o dia 14/)).toBeInTheDocument();

    const weekOne = screen.getByRole('article', { name: 'Semana 1: 01–07' });
    const weekTwo = screen.getByRole('article', { name: 'Semana 2: 08–14' });
    const weekThree = screen.getByRole('article', { name: 'Semana 3: 15–21' });
    const weekFour = screen.getByRole('article', { name: 'Semana 4: 22–30' });

    expect(within(weekOne).getByText('Dentro do teto')).toBeInTheDocument();
    expect(within(weekOne).getByText('Livre R$ 450,00')).toBeInTheDocument();
    expect(within(weekTwo).getByText('Atual')).toBeInTheDocument();
    expect(within(weekTwo).getByText('Atenção')).toBeInTheDocument();
    expect(within(weekTwo).getByText('Livre R$ 100,00')).toBeInTheDocument();
    expect(
      within(weekTwo).getByText('R$ 20,00 por dia para os 5 dias restantes.'),
    ).toBeInTheDocument();
    expect(within(weekThree).getByText('Estourou')).toBeInTheDocument();
    expect(within(weekThree).getByText('Excedeu R$ 50,00')).toBeInTheDocument();
    expect(within(weekFour).getByText('Livre R$ 750,00')).toBeInTheDocument();
    expect(within(weekFour).getByText('R$ 83,33 por dia durante a semana.')).toBeInTheDocument();
    expect(screen.getAllByText('de R$ 750,00')).toHaveLength(4);
  });

  it('avisa quando a semana atual estoura o teto', () => {
    setToday('2026-11-12');
    store().setSalary('2026-11', 400_000);
    store().addExpense({
      date: '2026-11-10',
      amount: 130_000,
      method: 'credito_vista',
      description: 'Celular',
    });

    renderWeeksPage();

    expect(screen.getByText('A semana 2 passou do teto em R$ 300,00')).toBeInTheDocument();
    expect(
      screen.getByText('Segure os gastos até o dia 14 para não agravar o estouro.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Excedeu R$ 300,00')).toBeInTheDocument();
  });

  it('avisa quando os fixos consomem toda a renda', () => {
    setToday('2026-11-10');
    store().setSalary('2026-11', 100_000);
    store().addFixed({ name: 'Aluguel', monthlyAmount: 120_000, startMonth: '2026-11' });

    renderWeeksPage();

    expect(screen.getByText('Os fixos consomem toda a renda')).toBeInTheDocument();
    expect(
      screen.getByText(/São R\$ 1.200,00 em fixos para R\$ 1.000,00 de renda/),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Sem teto')).toHaveLength(4);
  });

  it('resume semanas estouradas em um mês passado', () => {
    setToday('2026-12-10');
    store().setSalary('2026-11', 400_000);
    store().addExpense({
      date: '2026-11-05',
      amount: 450_000,
      method: 'pix',
      description: 'Compra grande',
    });

    renderWeeksPage();

    expect(screen.getByText('1 semana estourou o teto')).toBeInTheDocument();
    expect(screen.getAllByText('Semana encerrada.')).toHaveLength(4);
  });
});
