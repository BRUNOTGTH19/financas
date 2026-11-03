import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import type { FinanceData } from '../../src/domain/types';
import { createBackup } from '../../src/lib/backup';
import { useFinanceStore } from '../../src/store/financeStore';

const store = () => useFinanceStore.getState();
const exportedAt = new Date('2026-11-03T12:00:00.000Z');

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/mes/2026-11/configuracoes']}>
      <App />
    </MemoryRouter>,
  );
}

function backupFile(data: FinanceData, version = 1) {
  const payload = { ...createBackup(data, exportedAt), version };
  return new File([JSON.stringify(payload)], 'meu-backup.json', { type: 'application/json' });
}

function incomingData(overrides: Partial<FinanceData> = {}): FinanceData {
  return {
    incomes: [{ id: 'inc_importada', month: '2026-12', amount: 700_000 }],
    fixedExpenses: [
      { id: 'fix_importado', name: 'Internet', monthlyAmount: 10_000, startMonth: '2026-12' },
    ],
    expenses: [],
    settings: { savingsGoal: 200_000 },
    ...overrides,
  };
}

async function uploadBackup(file: File) {
  fireEvent.change(screen.getByLabelText('Arquivo de backup JSON'), {
    target: { files: [file] },
  });
  return screen.findByRole('dialog', { name: 'Importar backup' });
}

beforeEach(() => {
  localStorage.clear();
  store().resetAll();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it('exporta o backup com nome datado', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:backup');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      configurable: true,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    store().setSalary('2026-11', 500_000);
    renderSettings();

    await user.click(screen.getByRole('button', { name: 'Exportar backup' }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/Backup exportado como financas-\d{4}-\d{2}-\d{2}\.json\./),
    ).toBeInTheDocument();
  });

  it('rejeita arquivo inválido sem alterar os dados', async () => {
    store().setSalary('2026-11', 500_000);
    const file = backupFile(incomingData(), 2);

    renderSettings();
    fireEvent.change(screen.getByLabelText('Arquivo de backup JSON'), {
      target: { files: [file] },
    });

    expect(await screen.findByText(/Versão de backup incompatível/)).toBeInTheDocument();
    expect(store().incomes).toHaveLength(1);
    expect(store().incomes[0]?.amount).toBe(500_000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mescla o backup sem duplicar registros', async () => {
    const user = userEvent.setup();
    store().setSalary('2026-11', 500_000);
    const currentIncomeId = store().incomes[0]?.id ?? '';
    const file = backupFile(
      incomingData({
        incomes: [
          { id: currentIncomeId, month: '2026-11', amount: 900_000 },
          { id: 'inc_nova', month: '2026-12', amount: 700_000 },
        ],
        expenses: [{ id: 'exp_nova', date: '2026-11-20', amount: 5_000, method: 'pix' }],
      }),
    );

    renderSettings();
    const dialog = await uploadBackup(file);
    expect(within(dialog).getByText('Conteúdo do arquivo')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Mesclar' }));

    expect(store().incomes).toHaveLength(2);
    expect(store().incomes.find((income) => income.id === currentIncomeId)?.amount).toBe(500_000);
    expect(store().expenses).toHaveLength(1);
    expect(store().fixedExpenses).toHaveLength(1);
    expect(
      screen.getByText('Backup mesclado sem duplicar registros já existentes.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exige confirmação explícita antes de substituir tudo', async () => {
    const user = userEvent.setup();
    store().setSalary('2026-11', 500_000);
    const file = backupFile(incomingData());

    renderSettings();
    const dialog = await uploadBackup(file);

    await user.click(within(dialog).getByRole('button', { name: 'Substituir tudo' }));

    expect(screen.getByText(/Substituir apaga todos os dados atuais/)).toBeInTheDocument();
    expect(store().incomes[0]?.amount).toBe(500_000);

    await user.click(screen.getByRole('button', { name: 'Confirmar substituição' }));

    expect(store().incomes).toEqual([{ id: 'inc_importada', month: '2026-12', amount: 700_000 }]);
    expect(store().settings.savingsGoal).toBe(200_000);
    expect(
      screen.getByText('Backup importado: os dados anteriores foram substituídos.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Renda do mês')).toHaveValue('0,00');
    expect(screen.getByLabelText('Meta de sobra')).toHaveValue('2.000,00');
  });
});
