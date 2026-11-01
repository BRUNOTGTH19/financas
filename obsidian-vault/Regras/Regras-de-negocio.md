# Regras de negócio

## Calendário e semanas

Regra fixa do Spendly:

| Semana | Dias                |
| ------ | ------------------- |
| 1      | 1–7                 |
| 2      | 8–14                |
| 3      | 15–21               |
| 4      | 22 até o fim do mês |

A última semana absorve o resto do mês: 22–28, 22–29, 22–30 ou 22–31. O número de semanas é derivado dos dias reais do mês; semanas finais com menos de 7 dias são consolidadas na anterior. Assim, fevereiro comum tem 4 semanas e agosto também, mas com a última mais longa.

Fevereiro bissexto é suportado (29 dias). Nunca há semanas fixas em código de UI: tudo vem de `getWeeksOfMonth`.

## Orçamento

1. `disponível = salário − fixos ativos`.
2. `disponível` pode ser negativo; nesse caso os tetos semanais são zerados e o mês é marcado como comprometido.
3. O valor distribuível é dividido pelas semanas; centavos restantes vão para as primeiras semanas.
4. `saldo = disponível − gastos do mês`.

## Fixos

- Ativo quando `startMonth <= mês`, sem `endMonth` anterior ao mês e sem `settledAt <= mês`.
- Parcelamento é representado por `startMonth` e `endMonth` inclusivos.
- Quitação vale a partir do mês marcado, inclusive.
- Um fixo quitado ou encerrado devolve o valor ao disponível dos tetos.

## Avisos semanais

- **OK:** gasto abaixo de 80% do teto.
- **ATENÇÃO:** de 80% a 100%, inclusive.
- **SEGURE ESSA SEMANA:** acima de 100%.
- Semana com teto zero e qualquer gasto é estourada.

## Projeção

- Ritmo diário = gasto acumulado ÷ dias decorridos.
- Gasto projetado = ritmo × dias do mês (arredondado ao centavo).
- Economia projetada = disponível − gasto projetado.
- A meta é batida quando a economia projetada é maior ou igual à meta.
- Meses passados usam o realizado; meses futuros não projetam gastos.
- Sem salário informado, o status é `sem_renda`.

## Gastos

- Registro com data real, valor em centavos, forma de pagamento e descrição opcional.
- Crédito parcelado: a compra entra como gasto no mês e gera um fixo para as parcelas seguintes.
- A decisão detalhada sobre parcelamento está documentada na entrega do store.
