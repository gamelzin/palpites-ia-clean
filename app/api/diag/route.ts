export async function GET(req: Request) {
  const hdr = req.headers;
  const url = new URL(req.url);

  const proto = hdr.get("x-forwarded-proto") ?? "https";
  const host = hdr.get("x-forwarded-host") ?? hdr.get("host") ?? url.host;
  const originHeader = hdr.get("origin");

  const originA = `${proto}://${host}`;
  const originB = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

  const successA = new URL("/success", originA).toString();
  const cancelA = new URL("/cancel", originA).toString();

  const envs = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PRICE_FOOTBALL_MONTHLY",
    "STRIPE_PRICE_FOOTBALL_QUARTERLY",
    "STRIPE_PRICE_FOOTBALL_YEARLY",
    "STRIPE_PRICE_COMBO_MONTHLY",
    "STRIPE_PRICE_COMBO_QUARTERLY",
    "STRIPE_PRICE_COMBO_YEARLY",
  ].reduce((acc: Record<string, boolean>, k) => {
    acc[k] = !!process.env[k];
    return acc;
  }, {});

  return new Response(
    JSON.stringify(
      {
        seen: {
          url: req.url,
          originHeader,
          x_forwarded_proto: proto,
          x_forwarded_host: host,
          vercel_url: process.env.VERCEL_URL || null,
        },
        computed: {
          originA,
          originB,
          successA,
          cancelA,
        },
        envPresent: envs,
      },
      null,
      2
    ),
    { headers: { "Content-Type": "application/json" } }
  );
}
