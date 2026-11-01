import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App';
import { useFinanceStore } from '../../src/store/financeStore';

const store = () => useFinanceStore.getState();

function renderExpensesPage() {
  return render(
    <MemoryRouter initialEntries={['/mes/2026-11/gastos']}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  store().resetAll();
  localStorage.clear();
});

describe('tela de gastos', () => {
  it('registra um gasto à vista e atualiza o resumo', async () => {
    const user = userEvent.setup();
    renderExpensesPage();

    expect(screen.getByText('Nenhum gasto neste mês')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Novo gasto' }));
    const dialog = screen.getByRole('dialog', { name: 'Novo gasto' });

    await user.type(within(dialog).getByLabelText('Valor'), '4500');
    fireEvent.change(within(dialog).getByLabelText('Data'), {
      target: { value: '2026-11-12' },
    });
    await user.type(within(dialog).getByLabelText(/Descrição/), 'Padaria');
    await user.click(within(dialog).getByRole('button', { name: 'Registrar gasto' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByText('R$ 45,00').length).toBeGreaterThan(0);
    expect(screen.getByText('Padaria')).toBeInTheDocument();
    expect(store().expenses[0]).toMatchObject({
      amount: 4_500,
      date: '2026-11-12',
      method: 'pix',
      description: 'Padaria',
    });
    expect(store().fixedExpenses).toHaveLength(0);
  });

  it('valida valor e data obrigatórios', async () => {
    const user = userEvent.setup();
    renderExpensesPage();

    await user.click(screen.getByRole('button', { name: 'Novo gasto' }));
    await user.click(screen.getByRole('button', { name: 'Registrar gasto' }));

    expect(screen.getByText('O valor deve ser maior que zero.')).toBeInTheDocument();
    expect(store().expenses).toHaveLength(0);
  });

  it('registra crédito parcelado e gera fixo futuro', async () => {
    const user = userEvent.setup();
    renderExpensesPage();

    await user.click(screen.getByRole('button', { name: 'Novo gasto' }));
    const dialog = screen.getByRole('dialog', { name: 'Novo gasto' });

    await user.type(within(dialog).getByLabelText('Valor'), '10000');
    fireEvent.change(within(dialog).getByLabelText('Data'), {
      target: { value: '2026-11-20' },
    });
    await user.selectOptions(
      within(dialog).getByLabelText('Forma de pagamento'),
      'credito_parcelado',
    );

    const installments = within(dialog).getByLabelText('Parcelas');
    await user.clear(installments);
    await user.type(installments, '8');
    await user.type(within(dialog).getByLabelText(/Descrição/), 'Notebook');

    expect(within(dialog).getByText(/viram um fixo de/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Registrar gasto' }));

    const expense = store().expenses[0];
    const fixed = store().fixedExpenses[0];

    expect(expense).toMatchObject({
      amount: 10_000,
      method: 'credito_parcelado',
      description: 'Notebook',
      installmentCount: 8,
      linkedFixedId: fixed?.id,
    });
    expect(fixed).toMatchObject({
      name: 'Notebook (8x)',
      monthlyAmount: 10_000,
      startMonth: '2026-12',
      endMonth: '2027-06',
    });
    expect(screen.getByText('8x')).toBeInTheDocument();
  });

  it('exige número de parcelas no crédito parcelado', async () => {
    const user = userEvent.setup();
    renderExpensesPage();

    await user.click(screen.getByRole('button', { name: 'Novo gasto' }));
    const dialog = screen.getByRole('dialog', { name: 'Novo gasto' });

    await user.type(within(dialog).getByLabelText('Valor'), '10000');
    await user.selectOptions(
      within(dialog).getByLabelText('Forma de pagamento'),
      'credito_parcelado',
    );
    await user.clear(within(dialog).getByLabelText('Parcelas'));
    await user.click(within(dialog).getByRole('button', { name: 'Registrar gasto' }));

    expect(screen.getByText('Informe em quantas parcelas foi a compra.')).toBeInTheDocument();
    expect(store().expenses).toHaveLength(0);
  });

  it('edita um gasto existente', async () => {
    const user = userEvent.setup();
    store().addExpense({
      date: '2026-11-08',
      amount: 3_000,
      method: 'debito',
      description: 'Mercado',
    });
    renderExpensesPage();

    await user.click(screen.getByRole('button', { name: 'Editar Mercado' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar gasto' });

    await user.clear(within(dialog).getByLabelText('Valor'));
    await user.type(within(dialog).getByLabelText('Valor'), '5590');
    await user.selectOptions(within(dialog).getByLabelText('Forma de pagamento'), 'credito_vista');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    expect(store().expenses[0]).toMatchObject({
      amount: 5_590,
      method: 'credito_vista',
      description: 'Mercado',
    });
    expect(screen.getAllByText('R$ 55,90').length).toBeGreaterThan(0);
  });

  it('exclui um gasto parcelado e o fixo gerado', async () => {
    const user = userEvent.setup();
    store().addExpense({
      date: '2026-11-10',
      amount: 10_000,
      method: 'credito_parcelado',
      description: 'Notebook',
      installmentCount: 4,
    });
    renderExpensesPage();

    await user.click(screen.getByRole('button', { name: 'Excluir Notebook' }));
    expect(screen.getByRole('dialog', { name: 'Excluir gasto?' })).toBeInTheDocument();
    expect(
      screen.getByText(/parcelas futuras geradas por ele também serão excluídas/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir gasto' }));

    expect(store().expenses).toHaveLength(0);
    expect(store().fixedExpenses).toHaveLength(0);
    expect(screen.getByText('Nenhum gasto neste mês')).toBeInTheDocument();
  });

  it('ignora gastos de outros meses e mostra a divisão à vista/cartão', () => {
    store().addExpense({
      date: '2026-11-03',
      amount: 7_500,
      method: 'pix',
      description: 'Feira',
    });
    store().addExpense({
      date: '2026-11-18',
      amount: 2_500,
      method: 'credito_vista',
      description: 'Farmácia',
    });
    store().addExpense({
      date: '2026-10-30',
      amount: 9_900,
      method: 'credito_vista',
      description: 'Mês passado',
    });
    renderExpensesPage();

    expect(screen.getByText('Feira')).toBeInTheDocument();
    expect(screen.getByText('Farmácia')).toBeInTheDocument();
    expect(screen.queryByText('Mês passado')).not.toBeInTheDocument();
    expect(screen.getByText('75% do mês foi à vista')).toBeInTheDocument();
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
  });
});
