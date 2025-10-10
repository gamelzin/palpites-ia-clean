import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig || !endpointSecret) {
    console.error("🚨 Falha: assinatura Stripe ou webhook secret ausente");
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error("🚫 Erro ao verificar webhook Stripe:", err.message);
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        const nome = metadata.nome || "Não informado";
        const email =
          metadata.email ||
          session.customer_email ||
          "nao_informado@palpitesia.com.br";
        const telefone = metadata.telefone || "desconhecido";
        const plano = metadata.plan || "desconhecido";

        console.log("✅ subscribers upsert OK (checkout.session.completed)", {
          nome,
          email,
          telefone,
          plano,
        });

        const { error } = await supabase
          .from("subscribers")
          .upsert(
            [
              {
                nome,
                email,
                telefone,
                plano,
                estado: "ativo",
              },
            ],
            { onConflict: "email" }
          );

        if (error) {
          console.error("❌ Erro ao salvar no Supabase:", error.message);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // ✅ correção segura
        const email =
          (subscription as any)?.customer_email ||
          (subscription as any)?.metadata?.email ||
          "nao_informado@palpitesia.com.br";

        console.log("⚠️ Assinatura cancelada:", email);

        await supabase
          .from("subscribers")
          .update({ estado: "cancelado" })
          .eq("email", email);

        break;
      }

      default:
        console.log(`ℹ️ Evento ignorado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Erro interno no webhook:", err.message);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 });
  }
}
