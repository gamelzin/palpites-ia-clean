import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL!
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY!

// Função utilitária para enviar mensagem pelo 360dialog
async function sendWhatsAppMessage(phone: string, text: string) {
  await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      "D360-API-KEY": WHATSAPP_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: phone,
      type: "text",
      text: { body: text },
    }),
  })
}

export async function GET() {
  const agora = new Date()

  // Buscar leads pendentes
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("status", "pendente")

  if (!leads || leads.length === 0) {
    return NextResponse.json({ msg: "Nenhum lead pendente encontrado" })
  }

  for (const lead of leads) {
    const diffHoras =
      (agora.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)

    let tipo: string | null = null
    let mensagem: string | null = null

    // Decidir qual mensagem mandar
    if (diffHoras >= 0.5 && diffHoras < 1) {
      tipo = "lembrete_30min"
      mensagem = `Olá ${lead.nome}, vimos que você iniciou seu cadastro no palpites.IA mas não finalizou. ✅ Aproveite agora para garantir os palpites de hoje direto no seu WhatsApp!`
    } else if (diffHoras >= 24 && diffHoras < 48) {
      tipo = "lembrete_24h"
      mensagem = `⚽🏀 Ontem tivemos ótimos resultados! Não perca as próximas entradas. Finalize sua assinatura e comece a receber hoje mesmo!`
    } else if (diffHoras >= 72 && diffHoras < 96) {
      tipo = "lembrete_3dias"
      mensagem = `⏰ Última chance! Seu cadastro no palpites.IA vai expirar em algumas horas. Ative agora e não perca os palpites de hoje.`
    }

    if (tipo && mensagem) {
      // Checar se já enviou esse tipo de mensagem
      const { data: log } = await supabaseAdmin
        .from("remarketing_logs")
        .select("*")
        .eq("lead_id", lead.id)
        .eq("tipo", tipo)
        .maybeSingle()

      if (!log) {
        await sendWhatsAppMessage(lead.telefone, mensagem)
        await supabaseAdmin.from("remarketing_logs").insert({
          lead_id: lead.id,
          tipo,
        })
        console.log(`Mensagem ${tipo} enviada para ${lead.telefone}`)
      }
    }
  }

  return NextResponse.json({ msg: "Job de remarketing executado" })
}
