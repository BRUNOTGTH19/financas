---
tags: [plano, fonte]
status: ativo
data: 2026-10-23
---

# PLANO DE AÇÃO — Plano Semanal de Finanças

Documento normativo para o agente de código. Idioma da UI e dos textos: pt-BR. Idioma de código/commits: inglês.

## 0. Regras do agente
1. Siga este documento literalmente...
2. Só pare e pergunte nos casos da §18 (Bloqueios B1–B5)
3. Sem ações desnecessárias
4. Uma tarefa = um commit
5. Registre tudo no vault (§15)
6. Dados pessoais nunca entram no repositório
7. Terminal: PowerShell
8. Use `import type` para tipos
9. Não instale versões específicas
10. Autoria única: BRUNOTGTH19
11. Autonomia de criação

## 1. Visão
PWA de finanças: plano semanal de gastos.
disponível = salário − Σ fixos − meta de economia
Objetivo: zerar uso do crédito, quitar dívidas, fechar mês com superávit.

## 2. Decisões fechadas
D1: 100% estático, GitHub Pages. Sem backend/login real.
D2: Dados no navegador (IndexedDB via Dexie). Backup JSON manual.
D3: Calendário real brasileiro. Feriados nacionais fixos e móveis.
D4: diaInicio configurável (1-28). Padrão 1.
D5: Fixos têm inicio/fim. Parcela NxV é fixa até N-ésima.
D6: Superávit protegido: semana que gastou menos não libera teto extra.
D7: Crédito em queda: limite = % × disponível.
D8: Gasto no crédito conta na semana do lançamento.
D9: metaEconomia padrão 0.
D10: HashRouter.
D11: Tema claro por padrão (ajustado), dark mode opcional.
D12: Semana < 3 dias fundida com a seguinte.
D13: Peso: útil=1, folga=1.3.
D14: Fixos não passam por lançamento.

## 3. Fora de escopo
Backend própria; login real; sincronização; OFX/CSV; categorias; dívidas com juros; lista de desejos; notificações push; multi-usuário; i18n; testes E2E; Storybook; Docker.

## 4. Stack
Vite+React+TS, react-router-dom, dexie+dexie-react-hooks, recharts, vite-plugin-pwa, @fontsource-variable/inter, vitest, GitHub Actions+Pages, Obsidian.

## 5-10. Detalhes técnicos e telas
Ver documento original para detalhes completos de implementação.

> Nota: Este é um resumo do plano de ação. O documento completo foi fornecido pelo usuário.
