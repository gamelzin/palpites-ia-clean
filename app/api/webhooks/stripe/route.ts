import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ Stripe SDK
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// ✅ Supabase (usa service_role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Falha ao validar assinatura Stripe:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ✅ Novo checkout concluído
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const telefone = session.customer_details?.phone ?? null;
        const plan = (session.metadata as any)?.plan ?? "desconhecido";
        const desportivo = plan.includes("combo") ? "combo" : "futebol";

        const { error } = await supabase.from("subscribers").upsert(
          {
            whatsapp_number: telefone,
            plano: plan,
            estado: "ativo",
            desportivo,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "whatsapp_number" }
        );
        if (error) throw error;

        console.log("✅ subscribers upsert OK (checkout.session.completed)", {
          telefone,
          plan,
        });
        break;
      }

      // ✅ Pagamento de renovação
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        // 👇 força o acesso sem erro de tipagem
        const subId = invoice["subscription"] ? String(invoice["subscription"]) : null;

        if (subId) {
          const subscription: any = await stripe.subscriptions.retrieve(subId);
          const plan =
            subscription.items?.data?.[0]?.price?.nickname ||
            subscription.items?.data?.[0]?.price?.id ||
            "desconhecido";

          const desportivo = String(plan).includes("combo") ? "combo" : "futebol";

          const { error } = await supabase
            .from("subscribers")
            .update({
              estado: "ativo",
              plano: plan,
              desportivo,
              updated_at: new Date().toISOString(),
            })
            .eq("plano", plan);

          if (error) throw error;

          console.log("🔁 Renovação confirmada (invoice.payment_succeeded)", { plan });
        }
        break;
      }

      // ✅ Cancelamento de assinatura
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const plan =
          sub.items?.data?.[0]?.price?.nickname ||
          sub.items?.data?.[0]?.price?.id ||
          "desconhecido";

        const { error } = await supabase
          .from("subscribers")
          .update({
            estado: "cancelado",
            updated_at: new Date().toISOString(),
          })
          .eq("plano", plan);

        if (error) throw error;
        console.log("🛑 Assinatura cancelada (customer.subscription.deleted)", { plan });
        break;
      }

      default:
        console.log("ℹ️ Evento ignorado:", event.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("⚠️ Erro interno no webhook:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
