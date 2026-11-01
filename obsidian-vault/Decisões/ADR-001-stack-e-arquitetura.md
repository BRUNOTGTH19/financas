# ADR-001 — Stack e arquitetura

- **Status:** aceita
- **Data:** 2026-11-01

## Contexto

Aplicativo pessoal, sem backend, com deploy estático no GitHub Pages. O foco é previsão semanal de gastos, não contabilidade completa.

## Decisão

- React 18 + TypeScript strict + Vite.
- `HashRouter` (React Router 7) para funcionar no GitHub Pages sem regra de rewrite.
- Tailwind CSS 3 com identidade própria inspirada no kit Spendly.
- Zustand + `persist` em `localStorage` (chave `fin:v1`).
- Zod nas fronteiras de entrada e na validação da persistência.
- date-fns com locale `pt-BR`.
- Testes com Vitest + Testing Library; cobertura mínima de 90% em `src/domain/`.

## Limites

- `src/domain/` é puro: não importa React nem store.
- Dinheiro é sempre inteiro em centavos; a formatação acontece apenas na camada de UI.
- Sem categorias, relatórios, gráficos, contas bancárias ou integração bancária.

## Consequências

- Dados vivem apenas no navegador do usuário; limpar o storage apaga o plano.
- Migrações futuras do formato precisam versionar a chave de persistência.
- O deploy é simples e gratuito, mas exige base de assets coerente com o repositório.
