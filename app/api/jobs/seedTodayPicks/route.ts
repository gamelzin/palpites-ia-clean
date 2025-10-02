import { supabaseAdmin } from "@/lib/supabase"
import { montarMensagem } from "@/lib/mensagem"
import { sendWhatsApp } from "@/lib/whatsapp360"

export async function GET() {
  const hoje = new Date().toISOString().split("T")[0]

  const { data: picks, error } = await supabaseAdmin
    .from("picks")
    .select("*")
    .eq("data", hoje)

  if (error) {
    console.error("Erro ao buscar picks:", error)
    return new Response("Erro", { status: 500 })
  }

  let conteudo = `📊 Palpites de hoje - ${new Date().toLocaleDateString("pt-BR")}\n\n`

  picks.forEach((p: any) => {
    conteudo += `⚽ ${p.jogo}: ${p.tip}\n`
  })

  const mensagem = montarMensagem(conteudo)

  // 🔥 Envio direto pro WhatsApp
  await sendWhatsApp("556195082702", mensagem)

  return new Response(JSON.stringify({ mensagem }), {
    headers: { "Content-Type": "application/json" },
  })
}
