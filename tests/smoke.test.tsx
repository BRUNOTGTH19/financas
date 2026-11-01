import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { useFinanceStore } from '../src/store/financeStore';

beforeEach(() => {
  localStorage.clear();
  useFinanceStore.getState().resetAll();
});

describe('App', () => {
  it('abre a tela de fixos do mês informado', () => {
    render(
      <MemoryRouter initialEntries={['/mes/2026-11/fixos']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Fixos do mês' })).toBeInTheDocument();
    expect(screen.getAllByText('Spendly').length).toBeGreaterThan(0);
  });
});
