---
tags: [adr]
data: 2025-05-14
status: aceita
---
# ADR-0002 — Tema claro por padrão com alternância para escuro

- **Contexto:** O plano original (D11) definia tema escuro por padrão. O usuário solicitou que a interface seja **toda branca (claro) por padrão**, com opção de ativar o modo escuro.
- **Decisão:** O tema claro é o padrão. Uma alternância no rodapé da navegação permite ativar o modo escuro, persistido em `localStorage` (`darkMode`).
- **Consequências:** O `index.css` define variáveis para ambos os temas. O toggle adiciona/a remove a classe `.dark` no `<html>`.
