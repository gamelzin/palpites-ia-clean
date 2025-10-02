# palpites.IA — PLUS
Inclui:
- Integração **API-Football** (fixtures do dia, odds/mock, resultados)
- **Stripe Checkout** (/pricing + /api/checkout/create-session)
- **Webhook Stripe** mapeando email/telefone para subscribers
- **/trigger** (disparos manuais) e **jobs** (run/dailyReport/monthlyReport)
- **/dashboard** (métricas simples: últimos envios, taxa de acerto)

## Rodar
```
npm install
npm run dev
```
- http://localhost:3000  (home)
- /pricing (checkout Stripe)
- /trigger (disparos manuais)
- /dashboard (métricas simples)
- /api/health

## API-Football (envs)
- APIFOOTBALL_KEY (x-apisports-key)
- APIFOOTBALL_BASE (https://v3.football.api-sports.io)

## Stripe
- Crie um preço recorrente -> pegue STRIPE_PRICE_ID
- Preencha STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET
- Webhook URL (dev): http://localhost:3000/api/stripeWebhook
- Eventos sugeridos: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed

## Supabase
Execute `infra/supabase-schema.sql` e cadastre subscribers.
