import { NextResponse } from "next/server"

export async function GET() {
  try {
    const numero = "5561993403786"
    const templateName = "bem_vindo_palpitesia"

    const response = await fetch("https://waba-v2.360dialog.io/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": process.env.WHATSAPP_API_KEY!,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "template",
        template: {
          name: templateName,
          language: { code: "pt_BR" }
        }
      }),
    })

    const data = await response.json()
    console.log("🔎 Resposta 360dialog:", data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("❌ Erro no teste WhatsApp:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
