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

  const total = picks.length
  const ganhos = picks.filter((p: any) => p.resultado === "win").length
  const perdas = picks.filter((p: any) => p.resultado === "lose").length

  let conteudo = `📊 Relatório Diário - ${new Date().toLocaleDateString("pt-BR")}\n\n`
  conteudo += `✅ Acertos: ${ganhos}\n`
  conteudo += `❌ Erros: ${perdas}\n`
  conteudo += `📌 Total analisado: ${total}\n`

  const mensagem = montarMensagem(conteudo)

  // 🔥 Envio direto pro WhatsApp
  await sendWhatsApp("556195082702", mensagem)

  return new Response(JSON.stringify({ mensagem }), {
    headers: { "Content-Type": "application/json" },
  })
}
