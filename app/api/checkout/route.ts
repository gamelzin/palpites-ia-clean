import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const priceMap: Record<string, string | undefined> = {
  football_monthly: process.env.STRIPE_PRICE_FOOTBALL_MONTHLY,
  football_quarterly: process.env.STRIPE_PRICE_FOOTBALL_QUARTERLY,
  football_yearly: process.env.STRIPE_PRICE_FOOTBALL_YEARLY,
  combo_monthly: process.env.STRIPE_PRICE_COMBO_MONTHLY,
  combo_quarterly: process.env.STRIPE_PRICE_COMBO_QUARTERLY,
  combo_yearly: process.env.STRIPE_PRICE_COMBO_YEARLY,
};

function computeOrigin(req: Request) {
  const hdr = req.headers;
  const proto = hdr.get("x-forwarded-proto") ?? "https";
  const host =
    hdr.get("x-forwarded-host") ??
    hdr.get("host") ??
    new URL(req.url).host;

  // Fallback extra seguro para Vercel
  const vercelHost = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

  return vercelHost || `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    const origin = computeOrigin(req);
    const successURL = new URL("/success", origin).toString();
    const cancelURL = new URL("/cancel", origin).toString();

    const price = plan ? priceMap[plan] : undefined;

    // Log útil na Vercel
    console.log("🔎 Checkout Debug", { plan, price, origin, successURL, cancelURL });

    if (!plan || !price) {
      return NextResponse.json(
        { error: "Plano inválido ou não configurado" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${successURL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelURL,
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
