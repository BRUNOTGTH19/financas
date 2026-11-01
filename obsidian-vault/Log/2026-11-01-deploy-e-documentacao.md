# 2026-11-01 — Deploy e documentação

## Ação

Preparação da publicação no GitHub Pages e documentação final do projeto.

## Deploy

- Workflow `.github/workflows/deploy.yml`.
- Disparo em push para `main` ou execução manual.
- Permissões de Pages, concurrency e ambiente `github-pages`.
- Pipeline roda typecheck, lint, testes e build antes de publicar.
- `VITE_BASE` usa o nome do repositório; repositório de usuário deve usar `/`.
- Preview local em `/financas-semanais/` validado com página e asset respondendo 200.

## Documentação

- `README.md` com visão geral, funcionalidades, stack, scripts, estrutura, regras, privacidade e
  passos de deploy.
- `docs/guia-do-agente.md` com comandos, fluxo de dados, invariantes, mapa de arquivos, evolução,
  convenções de teste, checklist e deploy.
- `Home.md` e `Pendencias.md` atualizados.

## Validação final

- 105 testes passando em 12 arquivos.
- Cobertura de domínio: 99,56% de linhas/statements, 96,69% de branches, 100% de funções.
- Formatação, typecheck, lint e build de produção limpos.
- Publicação efetiva pendente de repositório remoto no GitHub.
