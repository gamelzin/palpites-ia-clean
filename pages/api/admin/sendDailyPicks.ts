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
  email: string;
  phone: string;
  status: "active" | "past_due" | "canceled";
  payment_method: "card" | "boleto" | "pix";
  expiration_date: string;
  last_price_id?: string | null;
};
type Fixture = {
  fixture: { id: number; date: string };
  league: { id: number; name: string; country: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
};
type OddsOption = {
  nome: string;
  odd: number;
  emoji?: string;
  motivo: string;
};
type GameBlock = {
  leagueName: string;
  home: string;
  away: string;
  kickOff: string;
  oddsSeguras: OddsOption[];
  finHome: number;
  finAway: number;
  cornersHome: number;
  cornersAway: number;
  cardsH2H: number;
};

/* ===================== HELPERS GERAIS ===================== */
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
function daysBetweenToday(dateISO: string) {
  const today = new Date();
  const tzToday = new Date(today.toLocaleString("en-US", { timeZone: TZ }));
  const end = new Date(dateISO + "T00:00:00");
  const diff = Math.floor((end.getTime() - tzToday.getTime()) / 86400000);
  return diff;
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
async function getFixturesToday(): Promise<Fixture[]> {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const headers = { "x-apisports-key": API_FOOTBALL_KEY };
  const all: Fixture[] = [];
  for (const lg of LEAGUES) {
    const url = `${APIFOOTBALL_BASE}/fixtures?date=${today}&league=${lg.id}&season=2025`;
    const json = await fetchJSON(url, headers);
    const arr: Fixture[] = json?.response || [];
    all.push(...arr);
  }
  return all;
}
async function getOddsForFixture(fixtureId: number) {
  const headers = { "x-apisports-key": API_FOOTBALL_KEY };
  const url = `${APIFOOTBALL_BASE}/odds?fixture=${fixtureId}`;
  const json = await fetchJSON(url, headers);
  return json?.response || [];
}
async function getStatsForFixture(fixtureId: number, homeId: number, awayId: number, leagueId: number) {
  const headers = { "x-apisports-key": API_FOOTBALL_KEY };
  const statsUrl = `${APIFOOTBALL_BASE}/fixtures/statistics?fixture=${fixtureId}`;
  const statsJson = await fetchJSON(statsUrl, headers);
  const statsResp = statsJson?.response || [];
  const stHome = statsResp.find((x: any) => x.team?.id === homeId)?.statistics || [];
  const stAway = statsResp.find((x: any) => x.team?.id === awayId)?.statistics || [];

  const getValue = (arr: any[], typeName: string) =>
    Number(arr.find((s: any) => s.type?.toLowerCase() === typeName.toLowerCase())?.value || 0);

  const homeShots = getValue(stHome, "Total Shots") || getValue(stHome, "Shots on Goal") || 0;
  const awayShots = getValue(stAway, "Total Shots") || getValue(stAway, "Shots on Goal") || 0;
  const homeCorners = getValue(stHome, "Corners") || 0;
  const awayCorners = getValue(stAway, "Corners") || 0;

  const yellowHome = getValue(stHome, "Yellow Cards") || 0;
  const yellowAway = getValue(stAway, "Yellow Cards") || 0;
  const redHome = getValue(stHome, "Red Cards") || 0;
  const redAway = getValue(stAway, "Red Cards") || 0;

  const cardsFixtureAvg = yellowHome + yellowAway + 2 * (redHome + redAway);

  return {
    finHome: round1(homeShots),
    finAway: round1(awayShots),
    cornersHome: round1(homeCorners),
    cornersAway: round1(awayCorners),
    cardsH2H: round1(cardsFixtureAvg),
  };
}

/* ===================== UTILITÁRIAS ===================== */
function findMarket(oddsResponse: any[], regex: RegExp) {
  for (const b of oddsResponse) {
    const bk = b?.bookmakers || [];
    for (const book of bk) {
      const ms = book?.bets || [];
      for (const m of ms) {
        const name = (m?.name || "").toString();
        if (regex.test(name)) {
          return {
            values:
              m?.values?.map((v: any) => ({
                value: (v?.value || "").toString(),
                odd: parseFloat(v?.odd),
              })) || [],
          };
        }
      }
    }
  }
  return null;
}
function pickSafeMarkets(oddsResponse: any, home: string, away: string): OddsOption[] {
  const safe: OddsOption[] = [];
  const mw = findMarket(oddsResponse, /match winner/i);
  const homeWin = mw?.values?.find((v: any) => /home|^1$|^home team$/i.test(v?.value || ""))?.odd;
  if (homeWin) {
    safe.push({ nome: `Vitória do ${home} 🏠`, odd: Number(homeWin), emoji: "✅", motivo: `${home} forte em casa; histórico e forma recente indicam superioridade.` });
  }
  const btts = findMarket(oddsResponse, /both teams to score|btts/i);
  const bttsYes = btts?.values?.find((v: any) => /yes|sim/i.test(v?.value || ""))?.odd;
  if (bttsYes) {
    safe.push({ nome: `Ambas equipes marcam`, odd: Number(bttsYes), emoji: "⚽", motivo: `Ataques consistentes de ${home} e ${away}; tendência de gols para ambos.` });
  }
  const ou = findMarket(oddsResponse, /over\/under|totals|goals over\/under/i);
  const over15 = ou?.values?.find((v: any) => /over 1\.5|1\.5/i.test((v?.value || "").toLowerCase()))?.odd;
  if (over15) {
    safe.push({ nome: `Mais de 1.5 gols ⚽`, odd: Number(over15), motivo: `Média de gols do confronto é alta; modelos apontam ≥ 2 gols.` });
  }
  const over25 = ou?.values?.find((v: any) => /over 2\.5|2\.5/i.test((v?.value || "").toLowerCase()))?.odd;
  if (over25) {
    safe.push({ nome: `Mais de 2.5 gols 🔥`, odd: Number(over25), motivo: `Tendência de jogo aberto; históricos recentes com placares elevados.` });
  }
  const corners = findMarket(oddsResponse, /corners/i);
  const over8_5 = corners?.values?.find((v: any) => /\b8\.5\b|over 8\.5/i.test((v?.value || "").toLowerCase()))?.odd;
  if (over8_5) {
    safe.push({ nome: `Mais de 8.5 escanteios 🔺`, odd: Number(over8_5), motivo: `Ambas equipes usam bastante as alas; volume alto de cruzamentos.` });
  }
  return safe.filter(x => Number.isFinite(x.odd)).sort((a, b) => a.odd - b.odd);
}

/* ===================== CONSTRUÇÃO DE MENSAGEM ===================== */
function buildFooter(): string {
  return (
    `⚠️ *Importante:*\n` +
    `🚫 Não combine todos os palpites em um único bilhete.\n` +
    `✅ *Façam simples ou duplas seguras e use gestão de banca.*\n` +
    `💰 Utilize **gestão de banca** (1% a 3% do saldo por entrada).\n` +
    `📊 *Análises baseadas em dados reais e estatísticas.*\n` +
    `🧠 Inteligência, 💹 estratégia e 📈 performance — isso é **PALPITES.IA** 💚`
  );
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

/* ===================== ENVIO DIÁRIO PRINCIPAL ===================== */
async function run(): Promise<{ sent: number; errors: number }> {
  const fixtures = await getFixturesToday();
  if (!fixtures.length) return { sent: 0, errors: 0 };

  const now = new Date();
  const header = `⚽💚 *PALPITES.IA — PALPITES DO DIA*\n📅 ${formatDateBR(now)} | ⏰ ${formatTimeBR(now)}\n\n`;
  const footer = buildFooter();

  const { data: subs } = await supabase.from("subscribers").select("*").eq("status", "active");
  let sent = 0, errors = 0;

  for (const s of subs || []) {
    try {
      await sendWhatsAppMessage(s.phone, `${header}📊 Seus palpites diários estão prontos!\n\n${footer}`);
      await supabase.from("send_logs").insert({ subscriber_id: s.id, ok: true });
      sent++;
    } catch (err: any) {
      errors++;
      await supabase.from("send_logs").insert({ subscriber_id: s.id, ok: false, error: String(err?.message || err) });
    }
  }
  return { sent, errors };
}

/* ===================== API HANDLER ===================== */
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
