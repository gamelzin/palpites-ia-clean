import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const API_KEY_FOOTBALL = process.env.API_FOOTBALL_KEY;
const API_KEY_WHATSAPP = process.env.WHATSAPP_API_KEY;
const WHATSAPP_ENDPOINT =
  process.env.WHATSAPP_API_URL || "https://waba.360dialog.io/v1/messages";

// número da sua WABA (apenas para aparecer no texto, não para envio)
const WABA_NUMBER = "+55 6195082702";

type DailyPickRow = {
  id: number;
  created_at: string;
  texto: string;
  jogos: any[];
};

function criarSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Converte Date UTC para AAAA-MM-DD (baseado em UTC)
function formatDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Cria intervalo [início, fim) de um dia em UTC
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

// Atualiza os resultados dos jogos de futebol consultando a API pelo fixture.id
async function atualizarResultadosFutebol(jogos: any[]): Promise<any[]> {
  const atualizados: any[] = [];

  // pegar IDs únicos
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

// Gera texto de relatório profissional com base nos jogos de ontem
function montarRelatorioProfissional(jogosOntem: any[]): string {
  if (!jogosOntem.length) {
    return (
      "📊 RELATÓRIO PROFISSIONAL (ontem)\n" +
      "- Nenhum jogo dos palpites de ontem foi encontrado na API.\n" +
      "- Assim que houver histórico suficiente, começaremos a publicar estatísticas detalhadas.\n"
    );
  }

  const total = jogosOntem.length;

  let totalGols = 0;
  const linhasDetalhes: string[] = [];

  for (const jogo of jogosOntem) {
    const home = jogo.teams?.home?.name || "Time Casa";
    const away = jogo.teams?.away?.name || "Time Fora";
    const liga = jogo.league?.name || "Liga";
    const pais = jogo.league?.country || "";
    const goalsHome = jogo.goals?.home ?? jogo.score?.fulltime?.home ?? 0;
    const goalsAway = jogo.goals?.away ?? jogo.score?.fulltime?.away ?? 0;

    totalGols += Number(goalsHome || 0) + Number(goalsAway || 0);

    linhasDetalhes.push(
      `- ${home} ${goalsHome} x ${goalsAway} ${away} (${liga}${pais ? " - " + pais : ""
      })`
    );
  }

  const mediaGols = (totalGols / total).toFixed(2);

  const header =
    "📊 RELATÓRIO PROFISSIONAL (ontem)\n" +
    `- Jogos acompanhados: ${total}\n` +
    `- Média de gols por jogo: ${mediaGols}\n\n` +
    "Resultados dos jogos analisados:\n";

  return header + linhasDetalhes.join("\n");
}

// Formata mensagem final enviada no WhatsApp (picks + relatório)
function montarMensagemWhatsApp(hojeStr: string, picksTexto: string, relatorio: string) {
  return (
    `💎 PALPITES.IA - PREMIUM (${hojeStr})\n\n` +
    `${picksTexto.trim()}\n\n` +
    "----------------------------------------\n" +
    relatorio.trim() +
    "\n\n" +
    `Enviado automaticamente pelo sistema PALPITES.IA (${WABA_NUMBER}).`
  );
}

// Envia a mensagem via WhatsApp (360dialog) para uma lista de números
async function enviarWhatsAppEmLote(
  numeros: string[],
  mensagem: string
): Promise<{ enviados: number; erros: number }> {
  let enviados = 0;
  let erros = 0;

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

      if (!res.ok) {
        erros++;
        console.log("❌ Erro ao enviar WhatsApp para", to, await res.text());
      } else {
        enviados++;
      }
    } catch (err) {
      erros++;
      console.log("❌ Erro de rede ao enviar WhatsApp para", to, err);
    }
  }

  return { enviados, erros };
}

export async function GET() {
  try {
    const supabase = criarSupabaseServerClient();

    // 1) Buscar o daily_picks mais recente (palpites de hoje)
    const { data: picksHojeData, error: picksHojeError } =
      await supabase
        .from("daily_picks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

    if (picksHojeError) {
      console.log("❌ Erro Supabase daily_picks hoje:", picksHojeError);
      return NextResponse.json({
        ok: false,
        motivo: "erro_daily_picks_hoje",
        detalhe: picksHojeError,
      });
    }

    const pickHoje = (picksHojeData as DailyPickRow[] | null)?.[0];

    if (!pickHoje) {
      return NextResponse.json({
        ok: false,
        motivo: "sem_daily_picks_hoje",
        detalhe: "Nenhum registro em daily_picks para hoje.",
      });
    }

    const hoje = new Date();
    const hojeStr = formatDateUTC(hoje);

    // 2) Buscar daily_picks do DIA ANTERIOR para relatório
    const ontem = new Date(hoje);
    ontem.setUTCDate(ontem.getUTCDate() - 1);

    const intervaloOntem = intervaloDiaUTC(ontem);

    const { data: picksOntemData, error: picksOntemError } =
      await supabase
        .from("daily_picks")
        .select("*")
        .gte("created_at", intervaloOntem.start)
        .lt("created_at", intervaloOntem.end)
        .order("created_at", { ascending: true });

    if (picksOntemError) {
      console.log("⚠ Erro daily_picks ontem:", picksOntemError);
    }

    const picksOntem = (picksOntemData as DailyPickRow[] | null) || [];

    // juntar todos os jogos de ontem
    const jogosOntemBrutos = picksOntem.flatMap((p) => p.jogos || []);

    // 3) Atualizar resultados dos jogos de ontem na API-Football
    const jogosOntemAtualizados = await atualizarResultadosFutebol(jogosOntemBrutos);

    // 4) Montar relatório profissional (ontem)
    const relatorioTexto = montarRelatorioProfissional(jogosOntemAtualizados);

    // 5) Montar mensagem combinada (picks de hoje + relatório de ontem)
    const mensagemWhatsApp = montarMensagemWhatsApp(
      hojeStr,
      pickHoje.texto,
      relatorioTexto
    );

    // 6) Buscar assinantes ativos no Supabase
    // 🚨 Ajuste o nome da tabela/coluna se for diferente
    const { data: subscribers, error: subsError } = await supabase
      .from("subscribers")
      .select("phone")
      .eq("status", "active");

    if (subsError) {
      console.log("❌ Erro buscando subscribers:", subsError);
      return NextResponse.json({
        ok: false,
        motivo: "erro_buscar_assinantes",
        detalhe: subsError,
      });
    }

    const numeros = (subscribers || [])
      .map((s: any) => s.phone)
      .filter((p: string) => typeof p === "string" && p.trim().length > 0);

    if (!numeros.length) {
      return NextResponse.json({
        ok: false,
        motivo: "sem_assinantes",
        detalhe: "Nenhum assinante ativo encontrado para envio.",
        mensagemPreview: mensagemWhatsApp,
      });
    }

    // 7) Enviar mensagem para todos
    const resultadoEnvio = await enviarWhatsAppEmLote(numeros, mensagemWhatsApp);

    return NextResponse.json({
      ok: true,
      hoje: pickHoje.created_at,
      totalAssinantes: numeros.length,
      enviados: resultadoEnvio.enviados,
      errosEnvio: resultadoEnvio.erros,
      previewMensagem: mensagemWhatsApp,
    });
  } catch (err) {
    console.error("❌ Erro geral /api/jobs/send:", err);
    return NextResponse.json({
      ok: false,
      error: String(err),
    });
  }
}
