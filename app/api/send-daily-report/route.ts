import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ===== ENV =====
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY!;
const WABA_URL = "https://waba-v2.360dialog.io/v1/messages";
const DRY_RUN = (process.env.DRY_RUN || "true").toLowerCase() === "true";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Variaveis do Supabase ausentes.");
}
if (!WHATSAPP_API_KEY) {
  throw new Error("Variavel WHATSAPP_API_KEY ausente.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ===== HELPERS =====
async function sendWhatsAppMessage(phone: string, body: string) {
  if (DRY_RUN) {
    console.log("[SIMULACAO] Relatorio diario para", phone);
    console.log(body);
    return { success: true, simulated: true };
  }

  const response = await fetch(WABA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "D360-API-KEY": WHATSAPP_API_KEY,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body },
    }),
  });

  const data = await response.json();
  return { success: true, data };
}

function cleanPhone(p: any): string | null {
  if (!p) return null;
  const num = String(p).replace(/\D/g, "");
  if (!num.startsWith("55")) return null;
  return num;
}

// ===== ROUTE =====
export async function POST() {
  try {
    // 1) intervalo do dia anterior [yesterday 00:00, today 00:00)
    const today = new Date();
    const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0));
    const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0));

    const { data: picks, error } = await supabase
      .from("picks")
      .select("description, analysis, odd, confidence, created_at, result")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());

    if (error) throw error;

    const total = picks?.length ?? 0;
    const greens = picks?.filter((p: any) => p.result === "green").length ?? 0;
    const reds = picks?.filter((p: any) => p.result === "red").length ?? 0;
    const pendentes = total - greens - reds;
    const acerto = total > 0 ? ((greens / total) * 100).toFixed(1) : "0.0";

    // 2) mensagem
    const dataBR = new Date(start.getTime()).toLocaleDateString("pt-BR");
    const lines: string[] = [];
    lines.push("Relatorio Diario - Palpites.IA");
    lines.push("Data: " + dataBR);
    lines.push("");
    lines.push("Greens: " + greens);
    lines.push("Reds: " + reds);
    lines.push("Pendentes: " + pendentes);
    lines.push("");
    lines.push("Taxa de acerto: " + acerto + "%");
    lines.push("");
    lines.push("Use sempre gestao de banca e avalie os mercados com melhor valor para voce.");
    lines.push("A IA Palpites.IA analisa estatisticas oficiais continuamente.");
    const messageBody = lines.join("\n");

    // 3) assinantes ativos
    const { data: subscribers, error: subErr } = await supabase
      .from("subscribers")
      .select("phone, whatsapp_number, status")
      .eq("status", "active");

    if (subErr) throw subErr;
    if (!subscribers || !subscribers.length) {
      return NextResponse.json({ success: false, message: "Nenhum assinante ativo." });
    }

    // 4) envio
    let sent = 0;
    let failed = 0;
    for (const sub of subscribers as any[]) {
      const phone = cleanPhone(sub.whatsapp_number || sub.phone);
      if (!phone) continue;

      const res = await sendWhatsAppMessage(phone, messageBody);

      await supabase.from("send_logs").insert({
        phone,
        message: messageBody,
        status: res.success ? "sent" : "failed",
      });

      if (res.success) sent += 1;
      else failed += 1;

      // evitar rate limit
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1200));
    }

    return NextResponse.json({
      success: true,
      mode: DRY_RUN ? "simulacao" : "envio_real",
      sent,
      failed,
    });
  } catch (e: any) {
    console.error("Erro relatorio diario:", e);
    return NextResponse.json({ success: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
