import { supabaseAdmin } from "@/lib/supabase"
import { montarMensagem } from "@/lib/mensagem"

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

  const porEsporte: Record<string, any[]> = {}
  picks.forEach((p: any) => {
    if (!porEsporte[p.sport]) porEsporte[p.sport] = []
    porEsporte[p.sport].push(p)
  })

  let conteudo = `📊 Relatório Diário por Esporte - ${new Date().toLocaleDateString("pt-BR")}\n\n`
  for (const esporte in porEsporte) {
    const jogos = porEsporte[esporte]
    conteudo += `🏅 ${esporte.toUpperCase()} → 📌 Total: ${jogos.length}\n`
  }

  const mensagem = montarMensagem(conteudo)

  console.log("Relatório por esporte:", mensagem)

  return new Response(JSON.stringify({ mensagem }), {
    headers: { "Content-Type": "application/json" },
  })
}
