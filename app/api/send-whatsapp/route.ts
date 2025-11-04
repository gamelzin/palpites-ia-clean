import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ====== CONFIGURAÇÕES ======
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY!;
const WABA_URL = "https://waba-v2.360dialog.io/v1/messages";
const DRY_RUN = process.env.DRY_RUN === "true"; // 🔹 modo simulação

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("🔴 Variáveis do Supabase ausentes.");
}
if (!WHATSAPP_API_KEY) {
  throw new Error("🔴 Variável WHATSAPP_API_KEY ausente.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ====== FUNÇÃO PARA ENVIAR WHATSAPP ======
async function sendWhatsAppMessage(phone: string, body: string) {
  try {
    if (DRY_RUN) {
      console.log(`📩 [SIMULAÇÃO] Mensagem para ${phone}:`);
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
    console.log(`📤 Enviado para ${phone}:`, data);
    return { success: true, data };
  } catch (err: any) {
    console.error(`❌ Erro ao enviar para ${phone}:`, err);
    return { success: false, error: err.message };
  }
}

// ====== ROTA ======
export async function POST() {
  try {
    console.log("🚀 Iniciando envio de mensagens...");

    // 1️⃣ Busca assinantes ativos
    const { data: subscribers, error: subError } = await supabase
      .from("subscribers")
      .select("phone, whatsapp_number, status")
      .eq("status", "active");

    if (subError) throw subError;
    if (!subscribers?.length) {
      return NextResponse.json({
        success: false,
        message: "Nenhum assinante ativo encontrado.",
      });
    }

    // 2️⃣ Busca os palpites mais recentes
    const { data: picks, error: picksError } = await supabase
      .from("picks")
      .select("description, analysis, odd, category, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (picksError) throw picksError;
    if (!picks?.length) {
      return NextResponse.json({
        success: false,
        message: "Nenhum palpite disponível no momento.",
      });
    }

    // 3️⃣ Monta mensagem formatada
    const lines: string[] = [];
    lines.push("⚽ *Palpites.IA — análise completa*");
    lines.push("");

    for (const p of picks) {
      lines.push(`🔹 *${p.description}* (Odd ${p.odd})`);
      lines.push(p.analysis);
      lines.push("");
    }

    lines.push(
      "⚠️ *Utilize sempre a gestão de banca para ser o mais lucrativo a longo prazo, e escolha os palpites que fizerem mais sentido para você.*"
    );
    lines.push(
      "💬 *A IA Palpites.IA analisou mais de 200 estatísticas oficiais antes de gerar esses palpites.*"
    );

    const messageBody = lines.join("\n");

    // 4️⃣ Envia (ou simula) para cada assinante
    const results: any[] = [];
    for (const sub of subscribers) {
      const rawPhone = sub.whatsapp_number || sub.phone;
      if (!rawPhone) continue;

      const phone = rawPhone.toString().replace(/\D/g, ""); // limpa número
      if (!phone.startsWith("55")) continue;

      const sendResult = await sendWhatsAppMessage(phone, messageBody);
      results.push({ phone, ...sendResult });

      // 5️⃣ Salva log no Supabase
      await supabase.from("send_logs").insert({
        phone,
        message: messageBody,
        success: sendResult.success,
        sent_at: new Date().toISOString(),
      });

      // evita limite de taxa (360dialog ≈ 1 msg/s)
      await new Promise((r) => setTimeout(r, 1200));
    }

    console.log("📬 Envio concluído!");
    return NextResponse.json({
      success: true,
      mode: DRY_RUN ? "simulação" : "envio real",
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (err: any) {
    console.error("❌ Erro geral no envio automático:", err);
    return NextResponse.json(
      { success: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
