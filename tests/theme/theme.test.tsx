import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from '../../src/theme/ThemeContext';
import ThemeProvider from '../../src/theme/ThemeProvider';
import {
  applyTheme,
  getStoredTheme,
  getSystemPrefersDark,
  resolveTheme,
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
} from '../../src/theme/theme';

function ThemeProbe() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <div>
      <span data-testid="preference">{preference}</span>
      <span data-testid="resolved">{resolved}</span>
      <button type="button" onClick={() => setPreference('dark')}>
        Trocar para escuro
      </button>
      <button type="button" onClick={() => setPreference('system')}>
        Seguir sistema
      </button>
    </div>
  );
}

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const media = {
    matches,
    media: THEME_MEDIA_QUERY,
    onchange: null,
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'change') listeners.delete(listener);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  );

  return media;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('preferência de tema', () => {
  it('usa o sistema quando não há preferência salva ou o valor é inválido', () => {
    expect(getStoredTheme({ getItem: () => null })).toBe('system');
    expect(getStoredTheme({ getItem: () => 'sepia' })).toBe('system');
    expect(getStoredTheme({ getItem: () => 'dark' })).toBe('dark');
    expect(
      getStoredTheme({
        getItem: () => {
          throw new Error('armazenamento bloqueado');
        },
      }),
    ).toBe('system');
  });

  it('resolve as três preferências e aplica a classe no documento', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');

    const root = document.createElement('div');
    applyTheme('dark', root);
    expect(root).toHaveClass('dark');
    expect(root.style.colorScheme).toBe('dark');

    applyTheme('light', root);
    expect(root).not.toHaveClass('dark');
    expect(root.style.colorScheme).toBe('light');
  });

  it('lê a preferência do sistema pelo matchMedia', () => {
    expect(getSystemPrefersDark()).toBe(false);

    stubMatchMedia(true);
    expect(getSystemPrefersDark()).toBe(true);
  });

  it('segue o sistema por padrão e persiste a escolha', async () => {
    const user = userEvent.setup();
    stubMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('preference')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');

    await user.click(screen.getByRole('button', { name: 'Trocar para escuro' }));

    expect(screen.getByTestId('preference')).toHaveTextContent('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Seguir sistema' }));

    expect(screen.getByTestId('preference')).toHaveTextContent('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('carrega o tema escuro salvo mesmo com o sistema claro', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    stubMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('preference')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
  });
});
