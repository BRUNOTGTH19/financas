# 2026-11-03 — Tema escuro

## Ação

Implementação do tema claro, escuro e automático, com preferência persistida no navegador e aplicação antes da primeira renderização.

## Funcionalidades

- Seletor **Aparência** em Configurações com as opções Claro, Escuro e Sistema.
- Preferência salva em `fin:theme` (`light`, `dark` ou `system`), com `system` como padrão.
- `ThemeProvider` resolve a preferência e acompanha mudanças de `prefers-color-scheme` em tempo real.
- Script inline em `index.html` aplica a classe `dark` antes do React para evitar flash de tema.
- `tailwind.config.js` usa `darkMode: 'class'`; `cream`, `paper` e `ink` são variáveis CSS.
- Variantes escuras em cards, navegação, formulários, modais, badges, barras de progresso e todos os estados de alerta (OK, atenção e estouro), com contraste AA.
- O tema não altera nem exporta os dados financeiros.

## Testes

- 5 testes de tema: leitura e validação da preferência, resolução das três opções, aplicação da classe, integração com `matchMedia` e persistência.
- 1 teste de UI em Configurações: seleção de tema, `aria-pressed`, classe no documento e persistência.
- Total do projeto: 133 testes em 15 arquivos.

## Arquivos principais

- `src/theme/theme.ts`
- `src/theme/ThemeProvider.tsx`
- `src/theme/ThemeContext.ts`
- `src/components/ThemeSelector.tsx`
- `src/index.css`
- `tailwind.config.js`
- `index.html`
- `tests/theme/theme.test.tsx`
- `tests/pages/settingsPage.test.tsx`
