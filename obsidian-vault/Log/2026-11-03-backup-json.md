# 2026-11-03 — Backup JSON

## Ação

Implementação da exportação e importação de dados em JSON, sem backend, com validação Zod antes de qualquer alteração de estado.

## Funcionalidades

- Exportação versionada (`version: 1`, `exportedAt`, `data`) com download `financas-YYYY-MM-DD.json`.
- Importação por seletor de arquivo com validação de versão, valores monetários inteiros, datas `YYYY-MM-DD` e meses `YYYY-MM`.
- Escolha explícita entre mesclar e substituir tudo; substituição com segunda confirmação.
- Mesclagem por `id`, sem duplicatas; a meta local é preservada quando já existe.
- Erros de arquivo inválido são mostrados sem alterar rendas, fixos, gastos ou meta.

## Testes

- 9 testes puros de backup: round-trip, nome do arquivo, versão, decimal, formatos de data/mês, JSON inválido, estado intacto e mesclagem.
- 4 testes de UI adicionais em Configurações: exportação, rejeição de versão inválida, mesclagem e confirmação de substituição.
- 3 testes de store para substituição, mesclagem e rejeição de dados inválidos.

## Arquivos principais

- `src/schemas/backup.ts`
- `src/lib/backup.ts`
- `src/components/BackupPanel.tsx`
- `src/pages/SettingsPage.tsx`
- `src/store/financeStore.ts`
- `tests/lib/backup.test.ts`
- `tests/pages/settingsPage.test.tsx`
