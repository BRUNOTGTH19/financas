# ADR-002 — Parcelamento no cartão

- **Status:** aceita
- **Data:** 2026-11-01

## Contexto

O modelo de `Expense` e `FixedExpense` permite que uma compra parcelada apareça tanto como gasto no mês quanto como fixo mensal. Contar os dois valores integrais duplicaria o impacto no orçamento.

## Decisão

- O valor digitado no gasto parcelado é o valor **da parcela**, não o total da compra.
- A parcela do mês da compra é registrada como `Expense` e conta no teto semanal atual.
- As parcelas futuras viram um `FixedExpense` gerado automaticamente:
  - `startMonth` = mês seguinte à compra;
  - `endMonth` = mês da compra + (parcelas − 1);
  - `monthlyAmount` = valor da parcela;
  - nome com a descrição e o número de parcelas.
- Uma compra em 2x gera exatamente um mês de fixo futuro.
- `Expense` recebeu os campos opcionais `installmentCount` e `linkedFixedId`.

## Efeitos

- Não há dupla contagem entre o gasto e o fixo.
- Editar um gasto parcelado remove o fixo gerado anteriormente e cria outro a partir dos novos dados.
- Excluir o gasto remove o fixo vinculado.
- Excluir o fixo não apaga o gasto; apenas limpa o vínculo.
- O fixo gerado pode ser editado como qualquer outro, mas uma nova edição do gasto o regenera.
