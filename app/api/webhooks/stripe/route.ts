import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// 🔑 Configuração do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 🔑 Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // precisa ser a service_role
);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") as string;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    // 🔐 Valida a assinatura do webhook
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Erro ao validar webhook:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // 👉 Trata somente o evento de pagamento concluído
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("▶ Evento recebido: checkout.session.completed");

    try {
      const { error } = await supabase.from("subscribers").insert([
        {
          email: session.customer_details?.email,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          status: "active",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("❌ Erro ao salvar no Supabase:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("✅ Assinatura criada no Supabase:", session.customer_details?.email);
    } catch (err) {
      console.error("❌ Erro inesperado:", err);
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
