import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover",
});

const priceMap: Record<string, string | undefined> = {
  football_monthly: process.env.STRIPE_PRICE_FOOTBALL_MONTHLY,
  football_quarterly: process.env.STRIPE_PRICE_FOOTBALL_QUARTERLY,
  football_yearly: process.env.STRIPE_PRICE_FOOTBALL_YEARLY,
  combo_monthly: process.env.STRIPE_PRICE_COMBO_MONTHLY,
  combo_quarterly: process.env.STRIPE_PRICE_COMBO_QUARTERLY,
  combo_yearly: process.env.STRIPE_PRICE_COMBO_YEARLY,
};

// 🔍 Detecta o ambiente atual (local ou Vercel)
function computeOrigin(req: Request) {
  const hdr = req.headers;
  const proto = hdr.get("x-forwarded-proto") ?? "https";
  const host =
    hdr.get("x-forwarded-host") ??
    hdr.get("host") ??
    new URL(req.url).host;

  const vercelHost = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

  return vercelHost || `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🧠 Captura dados recebidos do frontend
    const { plan, nome_cliente, telefone, email_cliente } = body;

    // 🔒 Valores padrão seguros
    const nomeFinal = nome_cliente?.trim() || "Não informado";
    const telefoneFinal = telefone?.trim() || "desconhecido";
    const emailFinal =
      email_cliente?.trim() && email_cliente.includes("@")
        ? email_cliente
        : "nao_informado@palpitesia.com.br";

    const origin = computeOrigin(req);
    const successURL = new URL("/success", origin).toString();
    const cancelURL = new URL("/cancel", origin).toString();

    const price = plan ? priceMap[plan] : undefined;

    console.log("🔎 Checkout Debug", {
      plan,
      price,
      nome_cliente: nomeFinal,
      email_cliente: emailFinal,
      telefone: telefoneFinal,
      origin,
    });

    if (!plan || !price) {
      return NextResponse.json(
        { error: "Plano inválido ou não configurado" },
        { status: 400 }
      );
    }

    // 🧾 Cria a sessão de checkout no Stripe com e-mail já pré-preenchido
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${successURL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelURL,

      // 📧 Preenche automaticamente o e-mail no Stripe
      customer_email:
        emailFinal !== "nao_informado@palpitesia.com.br"
          ? emailFinal
          : undefined,

      metadata: {
        nome_cliente: nomeFinal,
        email_cliente: emailFinal,
        telefone: telefoneFinal,
        plan,
      },
    });

    console.log("✅ Sessão Stripe criada:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Erro no checkout:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
