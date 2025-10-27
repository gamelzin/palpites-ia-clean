import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

/* ===================== ENV ===================== */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY!;
const APIFOOTBALL_BASE = process.env.APIFOOTBALL_BASE || "https://v3.football.api-sports.io";
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL!;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY!;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;

/* ===================== CLIENTES ===================== */
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" as any });

/* ===================== CONFIGS ===================== */
const TZ = "America/Sao_Paulo";
const LEAGUES = [
  { id: 39, name: "Premier League", country: "England" },
  { id: 140, name: "La Liga", country: "Spain" },
  { id: 135, name: "Serie A (Itália)", country: "Italy" },
  { id: 78, name: "Bundesliga", country: "Germany" },
  { id: 61, name: "Ligue 1", country: "France" },
  { id: 71, name: "Série A (Brasil)", country: "Brazil" },
];

/* ===================== TIPOS ===================== */
type Subscriber = {
  id: string;
  name?: string;
  email: string;
  phone: string;
  status: "active" | "past_due" | "canceled";
  payment_method: "card" | "boleto" | "pix";
  expiration_date: string;
  last_price_id?: string | null;
};

/* ===================== HELPERS ===================== */
function formatDateBR(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    timeZone: TZ,
  });
}
function formatTimeBR(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}
function sanitizePhoneE164(brPhone: string) {
  const digits = brPhone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : "55" + digits;
}
async function fetchJSON(url: string, headers: Record<string, string>) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`HTTP ${r.status} on ${url}`);
  return r.json();
}
function round1(n: number) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

/* ===================== API-FOOTBALL ===================== */
async function getFixturesToday() {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const headers = { "x-apisports-key": API_FOOTBALL_KEY };
  const all: any[] = [];
  for (const lg of LEAGUES) {
    const url = `${APIFOOTBALL_BASE}/fixtures?date=${today}&league=${lg.id}&season=2025`;
    const json = await fetchJSON(url, headers);
    all.push(...(json?.response || []));
  }
  return all;
}

/* ===================== ENVIO WHATSAPP ===================== */
async function sendWhatsAppMessage(toBR: string, body: string) {
  const to = sanitizePhoneE164(toBR);
  const res = await fetch(`${WHATSAPP_API_URL}/v1/messages`, {
    method: "POST",
    headers: { "D360-API-KEY": WHATSAPP_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ to, type: "text", text: { body } }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`WA error ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

/* ===================== RODAPÉ INTELIGENTE ===================== */
function buildFooter(subscriber: Subscriber): string {
  if (!subscriber?.expiration_date) return defaultFooter();

  const today = new Date();
  const tzToday = new Date(today.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const exp = new Date(subscriber.expiration_date + "T00:00:00");
  const diff = Math.floor((exp.getTime() - tzToday.getTime()) / 86400000);

  if ([3, 2, 1, 0].includes(diff) && ["boleto", "pix"].includes(subscriber.payment_method)) {
    const diasTxt =
      diff > 1 ? `faltam *${diff} dias*` :
      diff === 1 ? `falta *1 dia*` :
      `*hoje é o último dia*`;

    return (
      `💚 *PALPITES.IA — AVISO DE RENOVAÇÃO*\n\n` +
      `⚠️ Olá, ${subscriber.name?.split(" ")[0] || "amigo"}! ${diasTxt} para o vencimento da sua assinatura.\n\n` +
      `🤖 Nossos palpites são gerados por uma *Inteligência Artificial exclusiva*, baseada em estatísticas oficiais, desempenho recente e probabilidades seguras — entregando análises confiáveis todos os dias.\n\n` +
      `Renove agora e continue recebendo automaticamente seus palpites diários no WhatsApp 📲\n\n` +
      `✅ Acesse: https://palpitesia.com.br\n\n` +
      `⚠️ Lembre-se: aposte com responsabilidade e use gestão de banca.\n\n` +
      `📈 Inteligência, estratégia e performance — isso é *PALPITES.IA 💚*`
    );
  }

  return defaultFooter();
}

function defaultFooter(): string {
  return (
    `⚠️ *Importante:*\n` +
    `🚫 Não combine todos os palpites em um único bilhete.\n` +
    `✅ *Façam simples ou duplas seguras e use gestão de banca.*\n` +
    `💰 Utilize **gestão de banca** (1% a 3% do saldo por entrada).\n` +
    `📊 *Análises baseadas em dados reais e estatísticas.*\n` +
    `🧠 Inteligência, 💹 estratégia e 📈 performance — isso é **PALPITES.IA** 💚`
  );
}

/* ===================== EXECUÇÃO PRINCIPAL ===================== */
async function run() {
  const fixtures = await getFixturesToday();
  if (!fixtures.length) return { sent: 0, errors: 0 };

  const now = new Date();
  const header = `⚽💚 *PALPITES.IA — PALPITES DO DIA*\n📅 ${formatDateBR(now)} | ⏰ ${formatTimeBR(now)}\n\n`;

  const { data: subs } = await supabase.from("subscribers").select("*").eq("status", "active");
  let sent = 0, errors = 0;

  for (const s of subs || []) {
    try {
      const footer = buildFooter(s);
      const msg = `${header}📊 Seus palpites diários estão prontos!\n\n${footer}`;
      await sendWhatsAppMessage(s.phone, msg);
      await supabase.from("send_logs").insert({ subscriber_id: s.id, ok: true });
      sent++;
    } catch (err: any) {
      errors++;
      await supabase.from("send_logs").insert({
        subscriber_id: s.id,
        ok: false,
        error: String(err?.message || err),
      });
    }
  }
  return { sent, errors };
}

/* ===================== HANDLER ===================== */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await run();
    console.log("✅ Envio diário concluído:", result);
    res.status(200).json({ ok: true, ...result });
  } catch (e: any) {
    console.error("❌ ERRO AO ENVIAR PALPITES:", e);
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
