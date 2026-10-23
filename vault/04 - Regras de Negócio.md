---
tags: [docs]
status: ativo
data: 2025-05-14
---
# 04 - Regras de Negócio

## Cálculo mensal
```
disponível = salário − Σ fixos do mês − meta de economia
Σ tetos semanais = disponível
superávit do mês = disponível − Σ gastos lançados
```

## Fixos
- Fixo vale para mês `m` se `inicio ≤ m` e (`fim` indefinido ou `m ≤ fim`)
- `fim` tem prioridade sobre `parcelasTotal`
- Parcela: `parcelaAtual = idx(mes) − idx(inicio) + 1`
- "Terminei de pagar" = `fim = mês atual` (continua no mês atual, libera próximo)

## Semanas
- Período: `diaInicio` do mês até véspera do próximo mês
- Semanas segunda→domingo; fundir 1ª se < 3 dias
- Peso: útil = 1; sábado, domingo, feriado = `fatorFolga` (padrão 1.3)

## Tetos
- Semanas passadas consomem `max(gasto, teto)`
- Semana atual e futuras dividem proporcionalmente ao peso
- Teto mínimo 0; arredondar 2 casas

## Status da semana
- `ok` (≤ 70%), `atencao` (≤ 100%), `estourou` (> 100%)
- Teto 0: `estourou` se gasto > 0

## Crédito
- `pctCredito = max(0, round(100 × (1 − i / mesesParaZerar)))`
- `limiteCredito = max(disponível,0) × pct / 100`
