---
tags: [deploy]
status: ativo
data: 2026-10-23
---
# 08 - Deploy

## Repositório
- Owner: BRUNOTGTH19
- Repositório: financas
- Visibilidade: público

## Workflow
Arquivo: `.github/workflows/deploy.yml`

1. Build no CI: ubuntu-latest, Node 20, npm ci, npm run test, npm run build
2. Deploy: actions/upload-pages-artifact → actions/deploy-pages@v4
3. Environment: github-pages

## GitHub Pages
- Habilitado via API: `gh api -X POST repos/BRUNOTGTH19/financas/pages -f build_type=workflow`
- URL: https://brunotgth19.github.io/financas/
- BASE: `/${{ github.event.repository.name }}/` (configurado via loadEnv)

## HashRouter
- Usado para compatibilidade com GitHub Pages (SPA fallback via 404.html)
