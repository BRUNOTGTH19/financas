import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('App', () => {
  it('renderiza a marca Spendly', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Spendly' })).toBeInTheDocument();
  });
});
