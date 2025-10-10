# Palpites.IA — Versão Estável v1.0

Versão estável do **Palpites.IA — SaaS de palpites automatizados** com integração Stripe, Supabase e 360dialog (WhatsApp).  
Inclui fluxo completo de leads → checkout → assinatura → envio automatizado.

---

## 🚀 Estado atual
**Versão:** v1.0-stable  
**Branch:** `main`  
**Deploy:** Vercel + Supabase + Stripe  
**Status:** ✅ 100% funcional e testado (checkout, leads e webhook Stripe)

Funcionalidades:
- Coleta de **leads** (nome, e-mail, telefone);
- Checkout **Stripe** com e-mail pré-preenchido;
- Armazenamento no **Supabase (leads + subscribers)**;
- Webhook Stripe (`checkout.session.completed`);
- Preparado para integração **360dialog** (WhatsApp API);
- Backup e rollback documentados.

---

## ⚙️ 1. Como rodar localmente

```bash
npm install
npm run dev
