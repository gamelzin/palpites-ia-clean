import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  const origin = `${proto}://${host}`;

  // -------- Env booleans (sem vazar valores) --------
  const envKeys = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PRICE_FOOTBALL_MONTHLY",
    "STRIPE_PRICE_FOOTBALL_QUARTERLY",
    "STRIPE_PRICE_FOOTBALL_YEARLY",
    "STRIPE_PRICE_COMBO_MONTHLY",
    "STRIPE_PRICE_COMBO_QUARTERLY",
    "STRIPE_PRICE_COMBO_YEARLY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "WHATSAPP_API_URL",
    "WHATSAPP_API_KEY",
  ] as const;

  const envPresent: Record<string, boolean> = {};
  for (const k of envKeys) envPresent[k] = !!process.env[k];

  // -------- priceMap atual (igual ao do checkout) --------
  const priceMap: Record<string, string | undefined> = {
    football_monthly: process.env.STRIPE_PRICE_FOOTBALL_MONTHLY,
    football_quarterly: process.env.STRIPE_PRICE_FOOTBALL_QUARTERLY,
    football_yearly: process.env.STRIPE_PRICE_FOOTBALL_YEARLY,
    combo_monthly: process.env.STRIPE_PRICE_COMBO_MONTHLY,
    combo_quarterly: process.env.STRIPE_PRICE_COMBO_QUARTERLY,
    combo_yearly: process.env.STRIPE_PRICE_COMBO_YEARLY,
  };

  // -------- Validação dos Prices no Stripe --------
  let stripePrices: any[] = [];
  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    for (const [plan, priceId] of Object.entries(priceMap)) {
      if (!priceId) {
        stripePrices.push({ plan, present: false });
        continue;
      }
      try {
        const price = await stripe.prices.retrieve(priceId);
        stripePrices.push({
          plan,
          present: true,
          stripe_id: price.id,
          active: price.active,
          currency: price.currency,
          type: price.type,
          recurring: price.recurring ? {
            interval: price.recurring.interval,
            interval_count: price.recurring.interval_count,
          } : null,
          product: typeof price.product === "string" ? price.product : (price.product as any)?.id ?? null,
        });
      } catch (e: any) {
        stripePrices.push({ plan, present: true, stripe_id: priceId, error: e?.message ?? String(e) });
      }
    }
  }

  // -------- Esquema do Supabase (metadados) --------
  let supabaseSchema: Record<string, any> | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Checa algumas tabelas comuns; ajuste aqui se tiver nomes diferentes
      const tablesToInspect = ["leads", "plano", "subscribers", "subscriptions", "users"];

      const { data, error } = await supabase.rpc("exec_sql", {
        // cria uma função RPC "exec_sql" no seu Supabase se ainda não existir, ou troca por postgrest:
        // Dica: crie uma RPC que executa SQL seguro para listar metadados
        // Aqui vou usar um SELECT direto no information_schema via PostgREST:
      } as any);

      // Como nem todo projeto tem a RPC acima, vamos tentar via fetch no PostgREST:
      // (Fazemos 1 request por tabela; se não existir, ignora)
      const schema: Record<string, any> = {};
      for (const t of tablesToInspect) {
        try {
          const resp = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${t}?select=*&limit=0`,
            {
              headers: {
                apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                Prefer: "count=exact",
              },
            }
          );
          if (resp.status === 200) {
            // Para pegar colunas, usamos o cabeçalho "Content-Range" e tentamos um describe simples:
            // Como o PostgREST não dá colunas diretamente, fazemos um fallback via information_schema:
            const colsResp = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/information_schema.columns?select=column_name,data_type&table_schema=eq.public&table_name=eq.${t}`,
              {
                headers: {
                  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
                  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                },
              }
            );
            const cols = colsResp.ok ? await colsResp.json() : [];
            schema[t] = { exists: true, columns: cols };
          } else {
            schema[t] = { exists: false, status: resp.status };
          }
        } catch (e: any) {
          schema[t] = { exists: false, error: e?.message ?? String(e) };
        }
      }
      supabaseSchema = schema;
    } catch (e) {
      supabaseSchema = { error: (e as any)?.message ?? String(e) };
    }
  }

  return NextResponse.json({
    seen: {
      url: req.url,
      origin,
      vercel_url: process.env.VERCEL_URL ?? null,
    },
    envPresent,
    priceMap,
    stripePrices,
    supabaseSchema,
  });
}
