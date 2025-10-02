import { NextResponse } from "next/server"
import { sendWhatsApp } from "@/lib/whatsapp360"

export async function GET() {
  try {
    // número que vai receber a mensagem (coloque o seu DDD + número completo)
    const numeroTeste = "5561993403786"

    const mensagem = "🚀 Teste de integração Palpites.IA com WhatsApp via 360dialog!"

    const resposta = await sendWhatsApp(numeroTeste, mensagem)

    return NextResponse.json({ success: true, resposta })
  } catch (error: any) {
    console.error("Erro no teste WhatsApp:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
