# 2026-11-01 — Dashboard

## Ação

Implementação da visão geral do mês com disponível, projeção de fechamento, resumo, semana atual e atalhos.

## Funcionalidades

- Hero com renda disponível após os fixos, gasto acumulado, percentual usado e saldo/estouro.
- Projeção de fim de mês com sobra projetada, ritmo diário, gasto diário seguro e alerta de meta.
- Tratamento das fases do mês: em andamento, encerrado e planejamento.
- Avisos para renda ausente e fixos acima da renda.
- Cards de renda, fixos ativos e gastos variáveis com links para suas telas.
- Card da semana atual com status, progresso, livre/excedido e valor diário restante.
- Estado alternativo da semana para meses passados e futuros.

## Testes

- 4 testes de UI cobrindo renda ausente, meta garantida, meta em risco e mês encerrado.
- 102 testes passando; typecheck, lint e build de produção validados.

## Arquivos principais

- `src/pages/DashboardPage.tsx`
- `tests/pages/dashboardPage.test.tsx`
