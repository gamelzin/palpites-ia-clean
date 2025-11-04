import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ✅ Stripe config
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
if (!stripeSecret) console.error("🚨 STRIPE_SECRET_KEY ausente!");
const stripe = new Stripe(stripeSecret, { apiVersion: "2025-09-30.clover" });

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
if (!endpointSecret) console.error("🚨 STRIPE_WEBHOOK_SECRET ausente!");

// ✅ Supabase config
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !supabaseKey)
  console.error("🚨 Variáveis do Supabase ausentes!");
const supabase = createClient(supabaseUrl, supabaseKey);

// 🔧 Função auxiliar: limpa formatos de CPF e telefone
function limparDados(texto = "") {
  return texto.replace(/[^\d]+/g, ""); // mantém apenas números
}

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  if (!sig)
    return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("🚫 Erro ao verificar webhook Stripe:", err?.message || err);
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // 💳 Cartão aprovado (checkout)
      case "checkout.session.completed": {
        const session = event.data.object;
        const md = session.metadata || {};

        const nome = md.nome || "Não informado";
        const email =
          md.email ||
          session.customer_email ||
          "nao_informado@palpitesia.com.br";
        const telefone = limparDados(md.telefone || ""); // limpa DDD e traços
        const cpf = limparDados(md.cpf || ""); // limpa pontos e traços
        const plano = md.plan || "desconhecido";

        console.log("✅ Pagamento confirmado (checkout):", {
          nome,
          email,
          telefone,
          cpf,
          plano,
        });

        const { error } = await supabase.from("subscribers").upsert(
          [
            {
              nome,
              email,
              phone: telefone,
              cpf,
              plano,
              status: "active",
              atualizado_em: new Date().toISOString(),
            },
          ],
          { onConflict: "email" }
        );

        if (error)
          console.error("❌ Erro ao salvar no Supabase:", error.message);
        break;
      }

      // 🧾 Boleto compensado / PIX pago
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const md = pi.metadata || {};

        const nome = md.nome || "Não informado";
        const email =
          md.email || pi.receipt_email || "nao_informado@palpitesia.com.br";
        const telefone = limparDados(md.telefone || "");
        const cpf = limparDados(md.cpf || "");
        const plano = md.plan || "desconhecido";

        console.log("💸 Boleto/PIX pago com sucesso:", { email, plano });

        const { error } = await supabase.from("subscribers").upsert(
          [
            {
              nome,
              email,
              phone: telefone,
              cpf,
              plano,
              status: "active",
              atualizado_em: new Date().toISOString(),
            },
          ],
          { onConflict: "email" }
        );

        if (error)
          console.error("❌ Erro ao salvar Supabase:", error.message);
        break;
      }

      // ⚠️ Falha (boleto expirado, cartão recusado)
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const md = pi.metadata || {};
        const email =
          md.email || pi.receipt_email || "nao_informado@palpitesia.com.br";

        console.log("⚠️ Pagamento falhou:", email);

        await supabase
          .from("subscribers")
          .update({ status: "failed", atualizado_em: new Date().toISOString() })
          .eq("email", email);
        break;
      }

      // 🔁 Renovação automática (assinatura no cartão)
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerEmail =
          invoice.customer_email || "nao_informado@palpitesia.com.br";

        console.log("🔁 Pagamento recorrente aprovado:", customerEmail);

        await supabase
          .from("subscribers")
          .update({ status: "active", atualizado_em: new Date().toISOString() })
          .eq("email", customerEmail);
        break;
      }

      // ❌ Assinatura cancelada
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const email =
          sub.metadata?.email ||
          sub.customer_email ||
          "nao_informado@palpitesia.com.br";

        console.log("❌ Assinatura cancelada:", email);

        await supabase
          .from("subscribers")
          .update({
            status: "canceled",
            atualizado_em: new Date().toISOString(),
          })
          .eq("email", email);
        break;
      }

      default:
        console.log(`ℹ️ Evento ignorado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Erro interno no webhook:", err);
    return NextResponse.json(
      { error: "Erro interno no webhook" },
      { status: 500 }
    );
  }
}
