# Palpites.IA — Versão Estável

Versão estável do SaaS Palpites.IA — integração Stripe + Supabase + 360dialog (WhatsApp).
Este documento descreve como publicar, proteger, fazer backup e como reverter para esta versão estável.

## Estado atual
- Branch principal: `main`
- Tag de release estável: `v1.0-stable`
- Funcionalidades chave: coleta de leads, checkout Stripe com pré-preenchimento de e-mail, webhook Stripe -> Supabase, salvamento de leads (remarketing).

---

## 1) Checklist pré-deploy (local)
1. Instale dependências:
   ```bash
   npm install
