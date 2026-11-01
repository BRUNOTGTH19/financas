import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App';
import { useFinanceStore } from '../../src/store/financeStore';

const store = () => useFinanceStore.getState();

function renderFixedPage() {
  return render(
    <MemoryRouter initialEntries={['/mes/2026-11/fixos']}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  store().resetAll();
  localStorage.clear();
});

describe('tela de fixos', () => {
  it('mostra estado vazio e cria um fixo', async () => {
    const user = userEvent.setup();
    renderFixedPage();

    expect(screen.getByText('Nenhum fixo cadastrado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Novo fixo' }));
    const dialog = screen.getByRole('dialog', { name: 'Novo gasto fixo' });

    await user.type(within(dialog).getByLabelText('Nome'), 'Aluguel');
    await user.type(within(dialog).getByLabelText('Valor mensal'), '150000');
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar fixo' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aluguel' })).toBeInTheDocument();
    expect(screen.getAllByText('R$ 1.500,00').length).toBeGreaterThan(0);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(store().fixedExpenses[0]).toMatchObject({
      name: 'Aluguel',
      monthlyAmount: 150_000,
      startMonth: '2026-11',
    });
  });

  it('valida campos obrigatórios', async () => {
    const user = userEvent.setup();
    renderFixedPage();

    await user.click(screen.getByRole('button', { name: 'Novo fixo' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar fixo' }));

    expect(screen.getByText('Dê um nome ao fixo.')).toBeInTheDocument();
    expect(screen.getByText('O valor deve ser maior que zero.')).toBeInTheDocument();
    expect(store().fixedExpenses).toHaveLength(0);
  });

  it('edita o nome e o valor de um fixo', async () => {
    const user = userEvent.setup();
    store().addFixed({
      name: 'Internet',
      monthlyAmount: 9_900,
      startMonth: '2026-11',
    });
    renderFixedPage();

    await user.click(screen.getByRole('button', { name: 'Editar Internet' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar fixo' });
    const nameInput = within(dialog).getByLabelText('Nome');
    const amountInput = within(dialog).getByLabelText('Valor mensal');

    await user.clear(nameInput);
    await user.type(nameInput, 'Internet fibra');
    await user.clear(amountInput);
    await user.type(amountInput, '12990');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    expect(screen.getByRole('heading', { name: 'Internet fibra' })).toBeInTheDocument();
    expect(store().fixedExpenses[0]).toMatchObject({
      name: 'Internet fibra',
      monthlyAmount: 12_990,
    });
  });

  it('quita e reativa um fixo no mês', async () => {
    const user = userEvent.setup();
    const id = store().addFixed({
      name: 'Academia',
      monthlyAmount: 12_000,
      startMonth: '2026-11',
    });
    renderFixedPage();

    await user.click(screen.getByRole('button', { name: 'Quitar Academia a partir deste mês' }));

    expect(store().fixedExpenses.find((fixed) => fixed.id === id)?.settledAt).toBe('2026-11');
    expect(screen.getByText('Nenhum fixo ativo neste mês')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver todos os fixos' }));
    expect(screen.getByText('Quitado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reativar Academia' }));

    expect(store().fixedExpenses.find((fixed) => fixed.id === id)?.settledAt).toBeUndefined();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('exclui um fixo com confirmação', async () => {
    const user = userEvent.setup();
    store().addFixed({
      name: 'Celular',
      monthlyAmount: 5_000,
      startMonth: '2026-11',
    });
    renderFixedPage();

    await user.click(screen.getByRole('button', { name: 'Editar Celular' }));
    await user.click(screen.getByRole('button', { name: 'Excluir fixo' }));

    expect(screen.getByRole('dialog', { name: 'Excluir fixo?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Excluir fixo' }));

    expect(store().fixedExpenses).toHaveLength(0);
    expect(screen.getByText('Nenhum fixo cadastrado')).toBeInTheDocument();
  });

  it('mostra todos os fixos e o peso na renda', async () => {
    const user = userEvent.setup();
    store().setSalary('2026-11', 500_000);
    store().addFixed({
      name: 'Aluguel',
      monthlyAmount: 150_000,
      startMonth: '2026-11',
    });
    store().addFixed({
      name: 'Curso antigo',
      monthlyAmount: 10_000,
      startMonth: '2026-08',
      endMonth: '2026-10',
    });
    renderFixedPage();

    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('Aluguel')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Todos/ }));

    expect(screen.getByText('Curso antigo')).toBeInTheDocument();
    expect(screen.getByText('Encerrado')).toBeInTheDocument();
  });
});
