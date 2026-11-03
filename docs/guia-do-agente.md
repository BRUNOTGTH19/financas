# Guia do agente

Documento operacional para continuar o desenvolvimento do Spendly com segurança.

## Objetivo do produto

Organizar a renda mensal em tetos semanais, registrar gastos e fixos, avisar sobre estouros e
projetar a sobra do fim do mês para proteger a meta de economia.

## Comandos obrigatórios

Execute na raiz do projeto:

```bash
npm ci
npm run format
npm run typecheck
npm run lint
npm test
npm run build
```

Para validar cobertura das regras puras:

```bash
npm run test:coverage
```

A cobertura é configurada em `vitest.config.ts` apenas para `src/domain/**`, com limite mínimo de
90%. Não reduza esse limite sem justificativa explícita.

## Fluxo de dados

```text
Formulário/UI
  -> action do Zustand (src/store/financeStore.ts)
  -> validação Zod (src/schemas/finance.ts)
  -> domínio puro (src/domain/*)
  -> persistência localStorage (fin:v1)
  -> seletores das páginas e componentes
```

- `src/domain/` não pode importar React, store ou código de UI.
- Páginas não devem reimplementar cálculo de semanas, tetos ou projeção; importe de `src/domain/`.
- Toda entrada persistida deve passar pelo schema Zod correspondente.
- Mudanças de formato persistido exigem bump de `STORAGE_VERSION` e estratégia de migração; o
  `mergePersistedState` atual descarta o estado persistido inválido e mantém o estado inicial.

## Backup JSON

- Formato: `{ version: 1, exportedAt: ISO-8601, data: { incomes, fixedExpenses, expenses, settings } }`.
- Exportação: `createBackup`/`serializeBackup` em `src/lib/backup.ts`; o download usa
  `financas-YYYY-MM-DD.json` e nunca envia dados para a rede.
- Importação: `parseBackup` valida o JSON inteiro com `backupSchema` antes de chamar a store. Um
  arquivo inválido não altera nenhum dado.
- Depois da validação, a UI pergunta se o usuário quer **mesclar** ou **substituir tudo**. A
  substituição exige uma segunda confirmação explícita.
- Mesclagem: registros com o mesmo `id` não são duplicados e o registro local prevalece. A meta de
  economia local é preservada quando já existe; caso contrário, a meta do arquivo é usada.
- Não commitar arquivos `financas-*.json` com dados reais; o `.gitignore` já cobre esse padrão.

## Invariantes

- Dinheiro em centavos inteiros (`number`). Nunca use float para armazenar valores.
- Semanas: 1–7, 8–14, 15–21, 22–fim. A quarta semana absorve 29, 30 ou 31 dias.
- A distribuição dos tetos deve preservar a soma exata do disponível.
- `availableForCaps = salário - fixos ativos`; negativo deixa os tetos em zero e marca
  `overcommitted`.
- Parcelamento: o valor digitado é a parcela da compra. A compra entra no mês; as parcelas
  seguintes viram `FixedExpense` do mês seguinte até `mês + parcelas - 1`.
- Excluir um gasto parcelado deve remover o fixo vinculado.
- A meta de sobra é global; a renda é mensal.
- O app usa `HashRouter`; não troque para `BrowserRouter` sem configurar fallback no host.
- Rotas seguem `/mes/:month/:section`; seções em `src/lib/navigation.ts`.

## Mapa dos arquivos

| Área          | Arquivos principais                                                               |
| ------------- | --------------------------------------------------------------------------------- |
| Calendário    | `src/domain/calendar.ts`                                                          |
| Orçamento     | `src/domain/budget.ts`                                                            |
| Projeção      | `src/domain/projection.ts`                                                        |
| Tipos         | `src/domain/types.ts`                                                             |
| Validação     | `src/schemas/finance.ts`, `src/schemas/backup.ts`                                 |
| Backup        | `src/lib/backup.ts`, `src/components/BackupPanel.tsx`                             |
| Estado        | `src/store/financeStore.ts`                                                       |
| Rotas         | `src/App.tsx`, `src/components/MonthLayout.tsx`, `src/lib/navigation.ts`          |
| Shell e UI    | `src/components/AppShell.tsx`, `PageHeader.tsx`, `Modal.tsx`, `CurrencyInput.tsx` |
| Dashboard     | `src/pages/DashboardPage.tsx`                                                     |
| Semanas       | `src/pages/WeeksPage.tsx`                                                         |
| Gastos        | `src/pages/ExpensesPage.tsx`, `src/components/ExpenseForm.tsx`                    |
| Fixos         | `src/pages/FixedExpensesPage.tsx`, `src/components/FixedExpenseForm.tsx`          |
| Configurações | `src/pages/SettingsPage.tsx`                                                      |
| Deploy        | `.github/workflows/deploy.yml`                                                    |

## Como evoluir

### Adicionar uma regra de domínio

1. Crie ou altere a função em `src/domain/`.
2. Adicione testes em `tests/domain/`.
3. Importe a função nas páginas; não copie a lógica.
4. Rode `npm run test:coverage`.

### Adicionar uma ação de store

1. Adicione o tipo em `FinanceActions`.
2. Valide a entrada com Zod antes de alterar o estado.
3. Preserve a estrutura de `FinanceData` para o persist.
4. Adicione testes em `tests/store/financeStore.test.ts`.
5. Atualize o `persistedStateSchema` se a estrutura mudar.

### Adicionar uma tela ou seção

1. Crie a página em `src/pages/`.
2. Registre a rota em `src/App.tsx`.
3. Se for uma seção de navegação, atualize `SECTIONS` e `NAV_ITEMS` em
   `src/lib/navigation.ts`.
4. Reutilize `PageHeader`, `EmptyState`, `Modal`, `Badge`, `ProgressBar` e `CurrencyInput`.
5. Adicione teste de página em `tests/pages/`.

## Convenções de teste

- Use Vitest + Testing Library.
- Limpe `localStorage` e chame `store().resetAll()` no `beforeEach`.
- Para páginas que dependem da data, use `vi.useFakeTimers()` + `vi.setSystemTime()` e restaure
  com `vi.useRealTimers()` no `afterEach`.
- Prefira consultas acessíveis: `getByRole`, `getByLabelText`, `within`.
- Evite testar classes CSS; teste texto, valores, rotas, feedback e estado do store.
- Para ações de formulário, use `userEvent`. Para inputs `type="date"`, use `fireEvent.change`.

## Checklist de entrega

- [ ] Regra implementada na camada correta.
- [ ] Testes novos e existentes passando.
- [ ] `npm run typecheck`, `npm run lint` e `npm run build` limpos.
- [ ] Cobertura de domínio em pelo menos 90%.
- [ ] Log em `obsidian-vault/Log/` com ação, funcionalidades, testes e arquivos.
- [ ] `obsidian-vault/Home.md` e `obsidian-vault/Pendencias.md` atualizados.
- [ ] Commit em Conventional Commits em português, um por entrega.

## Deploy

- Workflow: `.github/workflows/deploy.yml`.
- Trigger: push em `main` ou execução manual.
- Source do GitHub Pages: `GitHub Actions`.
- `VITE_BASE` é definido no workflow com o nome do repositório.
- Para `usuario.github.io`, use `VITE_BASE=/`.
- O `HashRouter` dispensa fallback de servidor para rotas da SPA.
