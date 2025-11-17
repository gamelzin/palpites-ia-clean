import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const API_KEY_FOOTBALL = process.env.API_FOOTBALL_KEY;
const API_KEY_WHATSAPP = process.env.WHATSAPP_API_KEY;
const WHATSAPP_ENDPOINT =
  process.env.WHATSAPP_API_URL || "https://waba.360dialog.io/v1/messages";

const WABA_NUMBER = "+55 6195082702";

function criarSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

function intervaloDiaUTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function atualizarResultadosFutebol(jogos: any[]): Promise<any[]> {
  const atualizados: any[] = [];

  const ids = Array.from(
    new Set(
      jogos
        .map((j) => j.fixture?.id)
        .filter((id) => typeof id === "number" || typeof id === "string")
    )
  );

  for (const fixtureId of ids) {
    try {
      const url = `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`;
      const res = await fetch(url, {
        headers: { "x-apisports-key": API_KEY_FOOTBALL! },
      });
      const data = await res.json();

      if (data?.response?.[0]) {
        atualizados.push(data.response[0]);
      }
    } catch (err) {
      console.log("⚠ Erro ao atualizar fixture", fixtureId, err);
    }
  }

  return atualizados;
}

function montarRelatorioProfissional(jogosOntem: any[]): string {
  if (!jogosOntem.length) {
    return (
      "📊 RELATÓRIO PROFISSIONAL (ontem)\n" +
      "- Nenhum jogo dos palpites de ontem foi encontrado.\n"
    );
  }

  const total = jogosOntem.length;
  let totalGols = 0;
  const linhas: string[] = [];

  for (const jogo of jogosOntem) {
    const home = jogo.teams?.home?.name || "Time Casa";
    const away = jogo.teams?.away?.name || "Time Fora";
    const liga = jogo.league?.name || "Liga";
    const pais = jogo.league?.country || "";
    const gh = jogo.goals?.home ?? jogo.score?.fulltime?.home ?? 0;
    const ga = jogo.goals?.away ?? jogo.score?.fulltime?.away ?? 0;

    totalGols += Number(gh || 0) + Number(ga || 0);

    linhas.push(
      `- ${home} ${gh} x ${ga} ${away} (${liga}${pais ? " - " + pais : ""})`
    );
  }

  const mediaGols = (totalGols / total).toFixed(2);

  return (
    "📊 RELATÓRIO PROFISSIONAL (ontem)\n" +
    `- Jogos analisados: ${total}\n` +
    `- Média de gols: ${mediaGols}\n\n` +
    "Resultados:\n" +
    linhas.join("\n")
  );
}

function montarMensagemWhatsApp(
  hojeStr: string,
  picks: string,
  relatorio: string
) {
  return (
    `💎 PALPITES.IA PREMIUM (${hojeStr})\n\n` +
    `${picks.trim()}\n\n` +
    "──────────────────────\n" +
    `${relatorio.trim()}\n\n` +
    `Enviado automaticamente pelo PALPITES.IA (${WABA_NUMBER}).`
  );
}

/*  🔥🔥🔥 NOVA FUNÇÃO COMPLETA COM LOGS DETALHADOS 🔥🔥🔥 */
async function enviarWhatsAppEmLote(numeros: string[], mensagem: string) {
  let enviados = 0;
  let erros = 0;
  let firstErrorBody: string | null = null;

  for (const to of numeros) {
    try {
      const body = {
        to,
        type: "text",
        text: { body: mensagem },
      };

      const res = await fetch(WHATSAPP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "D360-API-KEY": API_KEY_WHATSAPP!,
        },
        body: JSON.stringify(body),
      });

      const respostaTexto = await res.text().catch(() => "");

      if (!res.ok) {
        erros++;
        console.log(
          "❌ Erro ao enviar WhatsApp para:",
          to,
          "\nStatus:",
          res.status,
          "\nResposta:",
          respostaTexto
        );

        if (!firstErrorBody) firstErrorBody = respostaTexto || `HTTP ${res.status}`;
      } else {
        enviados++;
      }
    } catch (err) {
      erros++;
      const msg = String(err);
      console.log("❌ Erro de rede ao enviar WhatsApp:", to, msg);
      if (!firstErrorBody) firstErrorBody = msg;
    }
  }

  return { enviados, erros, firstErrorBody };
}

export async function GET() {
  try {
    const supabase = criarSupabaseServerClient();

    const { data: picksHoje } = await supabase
      .from("daily_picks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    const pickHoje = picksHoje?.[0];

    if (!pickHoje) {
      return NextResponse.json({ ok: false, motivo: "sem_picks_hoje" });
    }

    const hoje = new Date();
    const hojeStr = formatDateUTC(hoje);

    const ontem = new Date(hoje);
    ontem.setUTCDate(ontem.getUTCDate() - 1);

    const intervaloOntem = intervaloDiaUTC(ontem);

    const { data: picksOntem } = await supabase
      .from("daily_picks")
      .select("*")
      .gte("created_at", intervaloOntem.start)
      .lt("created_at", intervaloOntem.end);

    const jogosOntemBrutos = picksOntem?.flatMap((p) => p.jogos || []) || [];

    const jogosOntem = await atualizarResultadosFutebol(jogosOntemBrutos);

    const relatorio = montarRelatorioProfissional(jogosOntem);

    const mensagem = montarMensagemWhatsApp(
      hojeStr,
      pickHoje.texto,
      relatorio
    );

    const { data: subscribers, error: subsError } = await supabase
      .from("subscribers")
      .select("whatsapp_number")
      .eq("status", "active");

    if (subsError) {
      return NextResponse.json({
        ok: false,
        motivo: "erro_buscar_assinantes",
        detalhe: subsError,
      });
    }

    const numeros = (subscribers || [])
      .map((s: any) => s.whatsapp_number)
      .filter((p: string) => p && p.length > 5);

    if (!numeros.length) {
      return NextResponse.json({
        ok: false,
        motivo: "sem_assinantes",
        previewMensagem: mensagem,
      });
    }

    /* 🔥 Agora com erro detalhado */
    const envio = await enviarWhatsAppEmLote(numeros, mensagem);

    return NextResponse.json({
      ok: true,
      enviados: envio.enviados,
      erros: envio.erros,
      erroExemploWhatsApp: envio.firstErrorBody ?? null,
      mensagemPreview: mensagem,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
