import { NextResponse } from "next/server";
import { buscarJogosDoDia } from "@/lib/apiFootball";
import { enriquecerEstatisticasFutebol } from "@/lib/estatisticasFutebol";
import { LIGAS_FUTEBOL_PRIORITARIAS } from "@/lib/ligas";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

/**
 * Função robusta para extrair texto de message.content
 * Lida com string, array de fragments, objetos OpenAI v2, etc.
 */
function extrairConteudoMensagem(message: any): string {
  if (!message || message.content == null) return "";

  const content = message.content;

  // Caso mais comum → string pura
  if (typeof content === "string") return content;

  // Caso venha como array (fragments)
  if (Array.isArray(content)) {
    try {
      return content
        .map((parte: any) => {
          if (!parte) return "";

          // Caso seja string dentro do array
          if (typeof parte === "string") return parte;

          // Caso venha no formato { text: "..." }
          if (typeof parte.text === "string") return parte.text;

          // Formato { type: "text", text: { value: "..."} }
          if (
            parte.text &&
            typeof parte.text === "object" &&
            typeof parte.text.value === "string"
          ) {
            return parte.text.value;
          }

          return "";
        })
        .join(" ")
        .trim();
    } catch {
      return "";
    }
  }

  // Caso venha como objeto inesperado
  if (typeof content === "object") {
    try {
      if (typeof content.text === "string") return content.text;
      if (content.text && typeof content.text.value === "string")
        return content.text.value;
    } catch {
      return "";
    }
  }

  return "";
}

export async function GET() {
  try {
    const hoje = new Date().toISOString().slice(0, 10);

    // 1) Buscar jogos de todas as ligas prioritárias
    const jogosS = await buscarJogosDoDia(LIGAS_FUTEBOL_PRIORITARIAS.S, hoje);
    const jogosA = await buscarJogosDoDia(LIGAS_FUTEBOL_PRIORITARIAS.A, hoje);
    const jogosB = await buscarJogosDoDia(LIGAS_FUTEBOL_PRIORITARIAS.B, hoje);

    const candidatosFutebol = [...jogosS, ...jogosA, ...jogosB];

    console.log("📌 Jogos encontrados:", candidatosFutebol.length);

    if (candidatosFutebol.length === 0) {
      return NextResponse.json({
        ok: false,
        detalhe: "Nenhum jogo encontrado no dia",
        jogos: []
      });
    }

    // 2) Enriquecer com estatísticas
    for (const jogo of candidatosFutebol) {
      try {
        jogo.estatisticas = await enriquecerEstatisticasFutebol(jogo.fixture.id);
      } catch (err) {
        console.log("⚠ Erro ao buscar estatísticas para o jogo", jogo.fixture.id);
        jogo.estatisticas = null;
      }
    }

    // 3) OpenAI Client
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    // 3.1) Seleção dos melhores jogos → JSON forçado
    const avaliacao = await openai.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você é um analista de futebol. Recebe uma lista de jogos com estatísticas e deve selecionar SOMENTE os melhores jogos para palpites. Retorne EXCLUSIVAMENTE JSON no formato { \"jogos\": [...] }"
        },
        {
          role: "user",
          content: JSON.stringify(candidatosFutebol)
        }
      ]
    });

    const rawAvaliacao = extrairConteudoMensagem(
      avaliacao.choices?.[0]?.message
    );

    console.log("📌 RAW avaliação IA:", rawAvaliacao);

    let jogosSelecionados: any[] = [];

    try {
      const parsed = JSON.parse(rawAvaliacao || "{}");
      jogosSelecionados = parsed.jogos ?? [];
    } catch (err) {
      console.log("❌ Erro ao fazer JSON.parse da avaliação:", err);
      jogosSelecionados = [];
    }

    console.log("📌 Jogos selecionados pela IA:", jogosSelecionados.length);

    // 4) Mensagem premium final
    const textoPremium = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "Você escreve análises premium estilo PALPITES.IA. Estrutura: contexto, análise, palpite seguro (odd 1.7-2.3), palpite estendido (odd 2.5-3.5), bingo corajoso (odd 5-10)."
        },
        {
          role: "user",
          content: JSON.stringify(jogosSelecionados)
        }
      ]
    });

    const mensagemFinal = extrairConteudoMensagem(
      textoPremium.choices?.[0]?.message
    );

    console.log("📌 Mensagem final produzida:", mensagemFinal);

    // 5) Insert Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("daily_picks")
      .insert({
        created_at: new Date().toISOString(),
        texto: mensagemFinal || "⚠ Falha ao gerar mensagem",
        jogos: jogosSelecionados
      })
      .select();

    if (error) {
      console.log("❌ Erro Supabase:", error);
      return NextResponse.json({
        ok: false,
        supabaseError: error
      });
    }

    return NextResponse.json({
      ok: true,
      inserted: data
    });
  } catch (err) {
    console.error("❌ Erro geral /api/jobs/generate:", err);
    return NextResponse.json({
      ok: false,
      error: String(err)
    });
  }
}

