import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const priceMap: Record<string, string | undefined> = {
  // ⚽ Futebol
  football_monthly: process.env.STRIPE_PRICE_FOOTBALL_MONTHLY,
  football_quarterly: process.env.STRIPE_PRICE_FOOTBALL_QUARTERLY,
  football_yearly: process.env.STRIPE_PRICE_FOOTBALL_YEARLY,
  // ⚽🏀 Combo
  combo_monthly: process.env.STRIPE_PRICE_COMBO_MONTHLY,
  combo_quarterly: process.env.STRIPE_PRICE_COMBO_QUARTERLY,
  combo_yearly: process.env.STRIPE_PRICE_COMBO_YEARLY,
};

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    // Deriva um origin ABSOLUTO válido para o Stripe (funciona em dev, preview e prod)
    const origin =
      req.headers.get("origin") || new URL(req.url).origin;

    // Debug útil nos logs da Vercel
    console.log("🔎 Checkout Debug:", {
      plan,
      price: plan ? priceMap[plan] : undefined,
      origin,
    });

    if (!plan || !priceMap[plan]) {
      return NextResponse.json(
        { error: "Plano inválido ou não configurado" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceMap[plan]!, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Erro no checkout:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
