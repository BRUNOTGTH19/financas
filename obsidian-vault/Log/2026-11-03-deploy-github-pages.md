# 2026-11-03 — Deploy no GitHub Pages

## Ação

Publicação do Spendly no GitHub Pages em <https://BRUNOTGTH19.github.io/financas/>.

## Funcionalidades

- Base de produção fixada em `/financas/` no `vite.config.ts`.
- Workflow `.github/workflows/deploy.yml` sem `VITE_BASE`, usando a base explícita do projeto.
- Pipeline com `npm ci`, typecheck, lint, testes e build antes do deploy.
- `HashRouter` mantido para as rotas da SPA funcionarem sem fallback de servidor.
- GitHub Pages configurado com source `GitHub Actions`.

## Validação

- `npm test`: 133 testes em 15 arquivos.
- `npm run lint`, `npm run typecheck` e `npm run build` sem erros.
- Build gerado com assets em `/financas/assets/`.
- URL publicada validada após o workflow.

## Arquivos principais

- `vite.config.ts`
- `.github/workflows/deploy.yml`
- `README.md`
- `docs/guia-do-agente.md`
