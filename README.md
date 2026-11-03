# Spendly

Planejamento financeiro pessoal com foco em tetos de gasto semanais.

O Spendly transforma a renda do mês, menos os gastos fixos, em quatro tetos semanais. A partir
deles, mostra o ritmo dos gastos, avisos de estouro e a projeção de quanto deve sobrar no fim do
mês.

## Funcionalidades

- Dashboard com renda, fixos, disponível, saldo, semana atual e projeção de fechamento.
- Tela de semanas com teto, gasto, restante, status e sugestão de gasto diário.
- Cadastro, edição e exclusão de gastos variáveis no débito, PIX, crédito à vista ou parcelado.
- Cadastro de gastos fixos com início, término, quitação e reativação por mês.
- Parcelamento no cartão gera automaticamente um fixo para as parcelas futuras.
- Configuração de renda por mês, meta de sobra global e exclusão dos dados locais.
- Exportação e importação de backup JSON, com validação Zod, mesclagem por `id` e confirmação
  antes de substituir os dados.
- Resumo do mês em texto para colar em uma IA externa, copiado com a Clipboard API.
- Navegação por mês, layout responsivo e persistência local.

## Stack

- React 18 + TypeScript
- Vite 6
- React Router 7 com `HashRouter`
- Zustand + Zod para estado e validação
- Tailwind CSS
- Vitest + Testing Library

## Como rodar

Requisitos: Node.js 20 ou superior e npm.

```bash
npm ci
npm run dev
```

A aplicação abre em `http://localhost:5173`. As rotas usam hash, por exemplo
`http://localhost:5173/#/mes/2026-11/inicio`.

## Scripts

| Comando                 | Descrição                                  |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Inicia o servidor de desenvolvimento       |
| `npm run build`         | Valida os tipos e gera o build de produção |
| `npm run preview`       | Serve o build de produção localmente       |
| `npm test`              | Executa todos os testes uma vez            |
| `npm run test:watch`    | Executa os testes em modo watch            |
| `npm run test:coverage` | Executa os testes com cobertura            |
| `npm run typecheck`     | Roda o TypeScript sem emitir arquivos      |
| `npm run lint`          | Roda o ESLint com zero warnings permitidos |
| `npm run format`        | Formata o projeto com Prettier             |
| `npm run format:check`  | Verifica a formatação sem alterar arquivos |

Antes de commitar, rode `npm run format`, `npm run typecheck`, `npm run lint`, `npm test` e
`npm run build`.

## Estrutura

```text
src/
  components/   Componentes de UI reutilizáveis
  domain/       Regras puras de calendário, orçamento e projeção
  hooks/        Hooks de navegação por mês
  lib/          Datas, dinheiro, ids, pagamentos e navegação
  pages/        Dashboard, Semanas, Gastos, Fixos e Configurações
  schemas/      Schemas Zod de entrada e de persistência
  store/        Store Zustand com persistência versionada
tests/
  app/          Navegação e smoke tests
  domain/       Testes das regras puras
  pages/        Testes das telas
  schemas/      Validação dos schemas
  store/        Ações e persistência
docs/           Guia operacional para agentes
obsidian-vault/ Decisões, regras, logs e pendências
```

## Regras principais

- Todo valor monetário é armazenado em centavos inteiros.
- As semanas são fixas: dias 1–7, 8–14, 15–21 e 22 até o fim do mês. A última absorve os dias
  extras.
- Os tetos dividem o disponível igualmente e distribuem os centavos restantes nas primeiras
  semanas.
- Status semanal: abaixo de 80% dentro do teto, de 80% a 100% atenção, acima de 100% estourado.
- Parcelamento segue o ADR-002: o valor informado é a parcela; somente as parcelas futuras viram
  um gasto fixo, sem dupla contagem.
- A meta de sobra é global; a renda é específica de cada mês.
- Os dados ficam apenas no `localStorage` do navegador, na chave `fin:v1`, e são validados com Zod
  ao carregar.
- Backup JSON na versão 1: `version`, `exportedAt` e `data`. A importação valida o arquivo inteiro
  antes de alterar qualquer dado. A mesclagem usa `id` para não duplicar registros e preserva a meta
  local quando já existe uma definida.

## Deploy

O workflow `.github/workflows/deploy.yml` publica o app no GitHub Pages a cada push na branch
`main` (ou execução manual).

1. No GitHub, abra `Settings > Pages` e selecione `GitHub Actions` como source.
2. Garanta que a branch principal se chama `main`.
3. Faça push para `main` e acompanhe o workflow `Deploy GitHub Pages`.

O build usa `VITE_BASE` com o nome do repositório. O padrão local é `/financas-semanais/`. Para um
repositório de usuário (`usuario.github.io`), configure `VITE_BASE=/` no workflow.

## Documentação

- `docs/guia-do-agente.md`: comandos, arquitetura, invariantes e checklist de entrega.
- `obsidian-vault/Home.md`: mapa das decisões, regras e logs do projeto.
