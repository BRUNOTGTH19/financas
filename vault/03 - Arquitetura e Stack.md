---
tags: [docs]
status: ativo
data: 2025-05-14
---
# 03 - Arquitetura e Stack

## Stack
| Camada | Ferramenta |
|---|---|
| Build | Vite + React + TypeScript |
| Rotas | react-router-dom (HashRouter) |
| Dados | Dexie + dexie-react-hooks (IndexedDB) |
| Gráficos | Recharts |
| PWA | vite-plugin-pwa |
| Fonte | @fontsource-variable/inter |
| Testes | Vitest |
| CI/CD | GitHub Actions + GitHub Pages |
| Docs | Obsidian (vault em Markdown) |

## Fluxo de dados
UI (React components) → hooks.ts (useDados via useLiveQuery) → Dexie DB → lib/ (calendario, fixos, budget)

## Estrutura de pastas
```
src/
├─ main.tsx, App.tsx, index.css, db.ts, hooks.ts
├─ lib/
│  ├─ calendario.ts, fixos.ts, budget.ts, format.ts, lib.test.ts
└─ pages/
   ├─ Semana.tsx, Lancar.tsx, Fixos.tsx, Projecao.tsx
   ├─ Dashboard.tsx, ConfigPage.tsx, Backup.tsx
```
