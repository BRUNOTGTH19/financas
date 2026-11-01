# 2026-11-01 — Shell visual e tela de Fixos

## Ação

Implementação do shell responsivo (sidebar no desktop, bottom nav no mobile), rotas por mês, seletor de mês, biblioteca de componentes e tela completa de Fixos.

## Design

- Base creme, cards `paper`, verde profundo e acento lima, inspirados no kit Spendly.
- Tipografia Plus Jakarta Sans, números tabulares.
- Layout mobile-first com navegação inferior fixa e sidebar a partir de `lg`.
- Modais em bottom sheet no mobile e centralizados no desktop.

## Funcionalidades de Fixos

- Lista com abas Ativos/Todos, estados Ativo, Futuro, Quitado e Encerrado.
- Criar e editar nome, valor, início e término.
- Quitar a partir do mês selecionado e reativar.
- Excluir com confirmação.
- Resumo de total fixo e comprometimento da renda, com atalho para Ajustes.

## Testes

- Testes de navegação, shell responsivo no DOM, rotas inválidas, criação/validação/edição/quitação/exclusão de fixos.
- 86 testes passando; build de produção validado.

## Arquivos principais

- `src/components/AppShell.tsx`
- `src/components/MonthLayout.tsx`
- `src/components/MonthSwitcher.tsx`
- `src/pages/FixedExpensesPage.tsx`
- `src/components/FixedExpenseForm.tsx`
