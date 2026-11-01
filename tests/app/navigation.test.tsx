import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App';
import { useFinanceStore } from '../../src/store/financeStore';

beforeEach(() => {
  localStorage.clear();
  useFinanceStore.getState().resetAll();
});

describe('navegação', () => {
  it('navega entre as seções mantendo o mês', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/mes/2026-11/inicio']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Seu mês em uma olhada' })).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: 'Semanas' })[0] as HTMLElement);
    expect(screen.getByRole('heading', { name: 'Semanas do mês' })).toBeInTheDocument();
    expect(screen.getByText('Novembro de 2026')).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: 'Fixos' })[0] as HTMLElement);
    expect(screen.getByRole('heading', { name: 'Fixos do mês' })).toBeInTheDocument();
  });

  it('troca de mês pelos controles do cabeçalho', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/mes/2026-11/inicio']}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByText('Dezembro de 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mês anterior' }));
    expect(screen.getByText('Novembro de 2026')).toBeInTheDocument();
  });

  it('redireciona mês inválido para o mês atual', () => {
    render(
      <MemoryRouter initialEntries={['/mes/2026-99/fixos']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Fixos do mês' })).toBeInTheDocument();
  });

  it('mostra página 404 para rota desconhecida', () => {
    render(
      <MemoryRouter initialEntries={['/rota-inexistente']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Esse plano não existe.' })).toBeInTheDocument();
  });
});
