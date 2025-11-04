import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
if (!stripeSecret) console.error("🚨 STRIPE_SECRET_KEY ausente no ambiente!");

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2025-09-30.clover",
});

const priceMap = {
  football_monthly: process.env.STRIPE_PRICE_FOOTBALL_MONTHLY,
  football_quarterly: process.env.STRIPE_PRICE_FOOTBALL_QUARTERLY,
  football_yearly: process.env.STRIPE_PRICE_FOOTBALL_YEARLY,
  combo_monthly: process.env.STRIPE_PRICE_COMBO_MONTHLY,
  combo_quarterly: process.env.STRIPE_PRICE_COMBO_QUARTERLY,
  combo_yearly: process.env.STRIPE_PRICE_COMBO_YEARLY,
};

function computeOrigin(req) {
  const hdr = req.headers;
  const proto = hdr.get("x-forwarded-proto") ?? "https";
  const host =
    hdr.get("x-forwarded-host") ?? hdr.get("host") ?? new URL(req.url).host;

  const vercelHost = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

  return vercelHost || `${proto}://${host}`;
}

function limparDados(texto = "") {
  return texto.replace(/[^\d]+/g, "");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { plan, nome_cliente, telefone, email_cliente, cpf } = body;

    const nomeFinal = nome_cliente?.trim() || "Não informado";
    const telefoneFinal = limparDados(telefone || "");
    const cpfFinal = limparDados(cpf || "");
    const emailFinal =
      email_cliente?.trim() && email_cliente.includes("@")
        ? email_cliente
        : "nao_informado@palpitesia.com.br";

    const origin = computeOrigin(req);
    const successURL = new URL("/success", origin).toString();
    const cancelURL = new URL("/cancel", origin).toString();

    const price = plan ? priceMap[plan] : undefined;

    if (!plan || !price) {
      return NextResponse.json(
        { error: "Plano inválido ou não configurado" },
        { status: 400 }
      );
    }

    // ✅ Apenas cartão + boleto habilitados
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "boleto"],

      line_items: [{ price, quantity: 1 }],
      success_url: `${successURL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelURL,

      customer_email:
        emailFinal !== "nao_informado@palpitesia.com.br"
          ? emailFinal
          : undefined,

      metadata: {
        nome: nomeFinal,
        email: emailFinal,
        telefone: telefoneFinal,
        cpf: cpfFinal,
        plan,
      },

      // 🧾 Boleto expira em 3 dias
      payment_method_options: {
        boleto: { expires_after_days: 3 },
      },
    });

    console.log("✅ Sessão Stripe criada:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("❌ Erro no checkout:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

