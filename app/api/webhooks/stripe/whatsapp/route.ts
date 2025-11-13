import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/* ---------- Utils ---------- */
function onlyDigits(v = "") {
  return String(v || "").replace(/[^\d]/g, "");
}

function sSafe(v = "") {
  const d = onlyDigits(v);
  if (d.length <= 4) return d;
  return d.slice(0, d.length - 4) + "****";
}

/* Remove 55 e zeros iniciais para comparar nacionalmente */
function strip55AndZeros(v = "") {
  let num = onlyDigits(v);
  if (num.startsWith("55")) num = num.slice(2);
  while (num.startsWith("0")) num = num.slice(1);
  return num;
}

/* Gera variantes de sufixo para casar diferentes formatos */
function suffixVariants(v = "") {
  const clean = onlyDigits(v);
  const variants = new Set<string>();
  const lens = [8, 9, 10, 11, 12];

  for (const L of lens) {
    if (clean.length >= L) variants.add(clean.slice(-L));
  }

  const nat = strip55AndZeros(v);
  for (const L of lens) {
    if (nat.length >= L) variants.add(nat.slice(-L));
  }

  return variants;
}

/* Normalização final para envio */
function normalizeForSend(raw = "") {
  let num = onlyDigits(raw);
  if (num.startsWith("0")) num = num.slice(1);
  if (!num.startsWith("55")) num = "55" + num;
  return num;
}

/* ---------- Supabase ---------- */
function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) console.error("🚨 ENV Supabase ausentes!");

  return createClient(url, key);
}

/* ---------- Helpers de parsing ---------- */
function getFromRoot(b) {
  try { return b?.messages?.[0]?.from || null; } catch {}
  return null;
}
function getTextRoot(b) {
  try { return b?.messages?.[0]?.text?.body || null; } catch {}
  return null;
}
function getFromEntry(b) {
  try { return b?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || null; } catch {}
  return null;
}
function getTextEntry(b) {
  try { return b?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || null; } catch {}
  return null;
}

function extractFromAndText(body) {
  let from = getFromRoot(body) || getFromEntry(body);
  let text = getTextRoot(body) || getTextEntry(body);

  return {
    from: String(from || ""),
    text: text ? String(text).trim() : null,
  };
}

/* ---------- Envio WhatsApp via 360dialog ---------- */
async function sendWhatsAppText(toRaw, message) {
  const KEY = process.env.WHATSAPP_API_KEY || "";
  const url = "https://waba-v2.360dialog.io/messages";

  const to = normalizeForSend(toRaw);

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": KEY,
      },
      body: JSON.stringify(payload),
    });

    let data;
    try { data = await res.json(); } catch { data = await res.text(); }

    console.log("📤 Envio 360:", res.status, data);
    return res.ok;

  } catch (err) {
    console.error("❌ Erro fetch 360:", err);
    return false;
  }
}

/* ---------- Webhook ---------- */
export async function POST(req) {
  const supabase = getSupabase();

  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    console.error("❌ Payload inválido:", e);
    return NextResponse.json({ status: "invalid_json" }, { status: 200 });
  }

  console.log("📩 Webhook recebido:", JSON.stringify(body, null, 2));

  const { from, text } = extractFromAndText(body);
  if (!from || !text) {
    console.log("ℹ️ Sem 'from' ou 'text'.", { from, text });
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const cleanFrom = onlyDigits(from);
  console.log(`💬 Mensagem recebida de ${cleanFrom}: "${text}"`);

  // carregar todos assinantes
  const { data: subs, error } = await supabase
    .from("subscribers")
    .select("id, whatsapp_number, waiting_optin, pending_message, status");

  if (error) {
    console.error("❌ Erro Supabase:", error);
    return NextResponse.json({ status: "db_error" }, { status: 200 });
  }

  const fromVariants = suffixVariants(from);

  const sub = subs?.find((s) => {
    const dbVariants = suffixVariants(s.whatsapp_number);
    for (const v of dbVariants) if (fromVariants.has(v)) return true;
    return false;
  });

  if (!sub) {
    console.log("⚠️ Número não encontrado no subscribers:", cleanFrom);
    return NextResponse.json({ status: "not_found" }, { status: 200 });
  }

  console.log("✅ Assinante localizado:", sSafe(sub.whatsapp_number));

  // tem pendência?
  if (sub.waiting_optin && sub.pending_message) {
    console.log("🚀 Reenviando pendência…");

    const ok = await sendWhatsAppText(from, sub.pending_message);

    if (ok) {
      const { error: updErr } = await supabase
        .from("subscribers")
        .update({
          waiting_optin: false,
          pending_message: null,
        })
        .eq("id", sub.id);

      if (updErr) console.error("❌ Erro limpando flags:", updErr);
      else console.log("🧹 Flags limpas com sucesso!");
    } else {
      console.warn("⚠️ Falha ao reenviar pendência — mantendo.");
    }

    return NextResponse.json({ reenviado: true }, { status: 200 });
  }

  console.log("ℹ️ Nenhuma pendência encontrada.");
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ status: "GET_OK" }, { status: 200 });
}
