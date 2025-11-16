import { NextResponse } from "next/server";
import { buscarJogosDoDia } from "@/lib/apiFootball";
import { enriquecerEstatisticasFutebol } from "@/lib/estatisticasFutebol";
import { LIGAS_FUTEBOL_PRIORITARIAS } from "@/lib/ligas";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export async function GET() {
  try {
    const hoje = new Date().toISOString().slice(0, 10);

    // 👉 1. Buscar jogos do dia
    const jogosS = await buscarJogosDoDia(LIGAS_FUTEBOL_PRIORITARIAS.S, hoje);
    const jogosA = await buscarJogosDoDia(LIGAS_FUTEBOL_PRIORITARIAS.A, hoje);
    const jogosB = await buscarJogosDoDia(LIGAS_FUTEBOL_PRIORITARIAS.B, hoje);

    const candidatosFutebol = [...jogosS, ...jogosA, ...jogosB];

    // 👉 2. Enriquecer estatísticas básicas
    for (const jogo of candidatosFutebol) {
      jogo.estatisticas = await enriquecerEstatisticasFutebol(jogo.fixture.id);
    }

    // 👉 3. Instância da OpenAI
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    // 👉 IA avalia qualidade dos jogos e devolve JSON (string)
    const avaliacao = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um analista estatístico profissional. Recebe uma lista de jogos com estatísticas e DEVE responder APENAS um JSON com os jogos selecionados para palpites, sem texto extra."
        },
        {
          role: "user",
          content: JSON.stringify(candidatosFutebol)
        }
      ]
    });

    const conteudoAvaliacao =
      (avaliacao.choices?.[0]?.message?.content ?? "") as string;

    const jogosSelecionados = JSON.parse(conteudoAvaliacao);

    // 👉 4. IA gera mensagem final Premium para envio
    const textoPremium = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você escreve mensagens premium de palpites de futebol no estilo PALPITES.IA, com tom profissional, com contexto dos jogos, palpites seguros, estendido (odd 2-3) e bingo corajoso (odd 5-10)."
        },
        {
          role: "user",
          content: JSON.stringify(jogosSelecionados)
        }
      ]
    });

    const mensagemFinal =
      (textoPremium.choices?.[0]?.message?.content ?? "") as string;

    // 👉 5. Salvar no Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from("daily_picks").insert({
      created_at: new Date().toISOString(),
      texto: mensagemFinal,
      jogos: jogosSelecionados
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Erro:", err);
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
