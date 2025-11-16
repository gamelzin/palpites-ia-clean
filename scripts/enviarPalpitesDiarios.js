// ==============================================
// PALPITES.IA — SCRIPT DE ENVIO DIÁRIO OFICIAL
// Versão 2025 — Modelo Premium (C) Pronto para Produção
// ==============================================

// 🔥 NECESSÁRIO PARA CARREGAR O .env
import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// -----------------------------------------------------
// CONFIGURAÇÕES
// -----------------------------------------------------
const WHATSAPP_KEY = process.env.WHATSAPP_API_KEY;
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// validação básica
if (!WHATSAPP_KEY) console.error("❌ Faltando WHATSAPP_API_KEY no .env");
if (!SUPABASE_URL) console.error("❌ Faltando SUPABASE_URL no .env");
if (!SUPABASE_KEY) console.error("❌ Faltando SUPABASE_SERVICE_ROLE_KEY no .env");

// instancia supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// normalização WhatsApp
function normalize(num = "") {
  num = String(num).replace(/[^\d]/g, "");
  if (num.startsWith("0")) num = num.slice(1);
  if (!num.startsWith("55")) num = "55" + num;
  return num;
}

// envio de texto via 360dialog
async function sendWhatsApp(toRaw, text) {
  const to = normalize(toRaw);

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  try {
    const res = await fetch("https://waba-v2.360dialog.io/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": WHATSAPP_KEY,
      },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }

    console.log("📤 Envio →", to, "| Status:", res.status, data);
    return res.ok;
  } catch (err) {
    console.error("❌ Erro envio 360:", err);
    return false;
  }
}

// -----------------------------------------------------
// TEXTOS OFICIAIS — MODELO PREMIUM C
// -----------------------------------------------------

export const PALPITE_FUTEBOL = `
💚 PALPITES.IA — PALPITES DO DIA
📅 Quinta-feira, 06 de Novembro de 2025 | ⏰ 07h

🏆 PREMIER LEAGUE
⚔️ Arsenal 🆚 Chelsea — 16:30

📌 CONTEXTO DO JOGO
• Arsenal joga em casa com média de 1.9 gols marcados
• Chelsea marcou nos últimos 4 jogos
• Média de escanteios somados acima de 8.3
• Árbitro com média de 5.1 cartões por jogo

──────────────────────────────
💡 PALPITES SEGUROS (Odds 1.40–1.80)

1️⃣ Mais de 7.5 escanteios 🔺
🧠 Motivo: Arsenal força amplitude e o Chelsea cede muitos cantos.

2️⃣ Ambas equipes marcam ⚽
🧠 Motivo: padrão ofensivo forte dos dois lados.

3️⃣ Mais de 3.5 cartões 🟨
🧠 Motivo: clássico duro + árbitro rigoroso.

──────────────────────────────
📈 PALPITE ESTENDIDO (Odds 2.00–5.00)

🔥 Arsenal dupla chance (vitória ou empate) + mais de 1.5 gols (Odd 3.20)
🧠 Motivo: Arsenal forte mandante e tendência de jogo movimentado.

──────────────────────────────
💣 BINGO CORAJOSO (Odds 5.00–10.00)

🎯 +2.5 gols
🎯 +8.5 escanteios
🎯 +4 cartões
(Odd combinada: 7.85)

──────────────────────────────
⚠️ AVISO IMPORTANTE
• Não combine tudo no mesmo bilhete
• Use gestão de banca (1%–3%)
• Nada de all-in
• Estatística ≠ garantia de lucro

📈 Inteligência aplicada ao futebol — PALPITES.IA 💚
`;

export const PALPITE_COMBO = `
💙⚽🏀 PALPITES.IA — PALPITE COMBO DO DIA
📅 Quinta-feira, 06 de Novembro de 2025 | ⏰ 07h

══════════════════════════════
⚽ FUTEBOL

🏆 Premier League  
Arsenal 🆚 Chelsea — 16:30

📌 CONTEXTO DO JOGO
• Arsenal média de 1.9 gols marcados em casa
• Chelsea marcou nos últimos 4 jogos
• Tendência alta de escanteios e cartões

💡 Palpites principais:
1️⃣ +7.5 escanteios 🔺  
2️⃣ Ambas equipes marcam ⚽  
3️⃣ +3.5 cartões 🟨  

📈 Palpite Estendido:
🔥 Arsenal dupla chance (vitória ou empate) + mais de 1.5 gols (Odd 3.20)

══════════════════════════════
🏀 BASQUETE — NBA

Lakers 🆚 Nuggets — 21:00

📌 CONTEXTO DO JOGO  
• Lakers média 112 pts  
• Nuggets média 115 pts  
• Confronto direto com ritmo muito ofensivo

💡 Palpites principais:
1️⃣ Mais de 221.5 pontos totais  
2️⃣ Jokic +26.5 pts  
3️⃣ Murray +2.5 bolas de 3  

📈 Palpite Estendido:
🎯 Jokic + Murray — 48+ pontos somados (Odd 2.55)

══════════════════════════════
⚠️ DICAS DO SISTEMA  
• Não coloque tudo no mesmo bilhete  
• Prefira poucos palpites bem escolhidos  
• Evite entradas altas em dia ruim  
• Sem promessa de lucro — apenas análise

📈 Inteligência para quem aposta com consciência — PALPITES.IA 💙
`;

// -----------------------------------------------------
// Envio para todos assinantes
// -----------------------------------------------------

export async function enviarParaTodos(tipo = "futebol") {
  const texto = tipo === "combo" ? PALPITE_COMBO : PALPITE_FUTEBOL;

  console.log("🚀 Iniciando envio:", tipo);

  const { data: subs, error } = await supabase
    .from("subscribers")
    .select("whatsapp_number, status");

  if (error) {
    console.error("❌ Erro Supabase:", error);
    return;
  }

  const ativos = subs.filter((s) => s.status === "active");

  console.log(`👥 ${ativos.length} assinantes ativos encontrados.`);

  for (const s of ativos) {
    await sendWhatsApp(s.whatsapp_number, texto);
    await new Promise((r) => setTimeout(r, 800)); // anti-flood
  }

  console.log("✅ Finalizado.");
}

// para rodar manualmente:
// node scripts/enviarPalpitesDiarios.js futebol
// node scripts/enviarPalpitesDiarios.js combo
if (process.argv.includes("futebol")) enviarParaTodos("futebol");
if (process.argv.includes("combo")) enviarParaTodos("combo");

