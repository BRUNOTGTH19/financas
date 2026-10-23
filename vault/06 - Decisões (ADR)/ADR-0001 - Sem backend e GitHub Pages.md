---
tags: [adr]
data: 2025-05-14
status: aceita
---
# ADR-0001 — Arquitetura sem backend e deploy no GitHub Pages

- **Contexto:** O projeto precisa de uma solução gratuita, sem backend, que funcione offline e seja versionada via Git.
- **Decisão:** 100% do app roda no navegador (SPA com Vite + React), dados persistidos localmente via IndexedDB (Dexie). Publicação via GitHub Actions → GitHub Pages.
- **Consequências:** Sem sincronização entre dispositivos; backup manual via JSON. HashRouter usado para compatibilidade com GitHub Pages.
