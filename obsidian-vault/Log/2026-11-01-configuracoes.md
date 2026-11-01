# 2026-11-01 — Configurações

## Ação

Implementação dos ajustes de renda mensal, meta de sobra e limpeza dos dados locais.

## Funcionalidades

- Renda específica do mês selecionado, com recarga automática ao trocar de mês.
- Meta de sobra global usada pela projeção do Dashboard.
- Feedback de sucesso após salvar renda ou meta.
- Resumo da quantidade de rendas, fixos e gastos salvos.
- Explicação de privacidade: dados apenas no localStorage do navegador.
- Exclusão total dos dados com confirmação e reset imediato dos formulários.

## Testes

- 3 testes de UI cobrindo renda e meta, troca de mês e exclusão total.
- 105 testes passando; typecheck, lint e build de produção validados.

## Arquivos principais

- `src/pages/SettingsPage.tsx`
- `tests/pages/settingsPage.test.tsx`
