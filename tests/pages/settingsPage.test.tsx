import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App';
import { useFinanceStore } from '../../src/store/financeStore';

const store = () => useFinanceStore.getState();

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/mes/2026-11/configuracoes']}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  store().resetAll();
  localStorage.clear();
});

describe('tela de configurações', () => {
  it('salva a renda do mês e a meta de sobra', async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(screen.getByText('Nenhuma renda salva para este mês ainda.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Sem meta definida. A projeção ainda mostra a sobra, mas não compara com uma meta.',
      ),
    ).toBeInTheDocument();

    const salaryInput = screen.getByLabelText('Renda do mês');
    await user.clear(salaryInput);
    await user.type(salaryInput, '500000');
    await user.click(screen.getByRole('button', { name: 'Salvar renda' }));

    expect(store().incomes[0]).toMatchObject({ month: '2026-11', amount: 500_000 });
    expect(screen.getByText('Renda atualizada para R$ 5.000,00.')).toBeInTheDocument();
    expect(screen.getByText('Salvo atualmente: R$ 5.000,00.')).toBeInTheDocument();

    const goalInput = screen.getByLabelText('Meta de sobra');
    await user.clear(goalInput);
    await user.type(goalInput, '100000');
    await user.click(screen.getByRole('button', { name: 'Salvar meta' }));

    expect(store().settings.savingsGoal).toBe(100_000);
    expect(screen.getByText('Meta atualizada para R$ 1.000,00.')).toBeInTheDocument();
    expect(screen.getByText('Meta atual: R$ 1.000,00.')).toBeInTheDocument();
  });

  it('recarrega a renda ao trocar de mês', async () => {
    const user = userEvent.setup();
    store().setSalary('2026-11', 500_000);
    renderSettings();

    expect(screen.getByLabelText('Renda do mês')).toHaveValue('5.000,00');

    await user.click(screen.getByRole('button', { name: 'Próximo mês' }));

    const nextSalaryInput = screen.getByLabelText('Renda do mês');
    expect(nextSalaryInput).toHaveValue('0,00');

    await user.clear(nextSalaryInput);
    await user.type(nextSalaryInput, '300000');
    await user.click(screen.getByRole('button', { name: 'Salvar renda' }));

    expect(store().incomes.find((income) => income.month === '2026-12')?.amount).toBe(300_000);
    expect(screen.getByText('Renda atualizada para R$ 3.000,00.')).toBeInTheDocument();
  });

  it('apaga todos os dados após confirmação', async () => {
    const user = userEvent.setup();
    store().setSalary('2026-11', 500_000);
    store().setSavingsGoal(100_000);
    store().addFixed({ name: 'Aluguel', monthlyAmount: 100_000, startMonth: '2026-11' });
    store().addExpense({
      date: '2026-11-10',
      amount: 50_000,
      method: 'pix',
      description: 'Mercado',
    });

    renderSettings();

    expect(screen.getByText('1 mês com renda · 1 fixo · 1 gasto')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apagar todos os dados' }));
    const dialog = screen.getByRole('dialog', { name: 'Apagar todos os dados?' });
    expect(
      within(dialog).getByText(
        'Renda, fixos, gastos, parcelamentos e meta serão removidos deste navegador. Essa ação não pode ser desfeita.',
      ),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Apagar tudo' }));

    expect(store().incomes).toHaveLength(0);
    expect(store().fixedExpenses).toHaveLength(0);
    expect(store().expenses).toHaveLength(0);
    expect(store().settings.savingsGoal).toBe(0);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByText('Renda, fixos, gastos e meta foram apagados deste navegador.'),
    ).toBeInTheDocument();
    expect(screen.getByText('0 meses com renda · 0 fixos · 0 gastos')).toBeInTheDocument();
    expect(screen.getByLabelText('Renda do mês')).toHaveValue('0,00');
    expect(screen.getByLabelText('Meta de sobra')).toHaveValue('0,00');
  });
});
