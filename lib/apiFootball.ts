const API_KEY = process.env.API_FOOTBALL_KEY;

/**
 * DETECÇÃO AUTOMÁTICA DE TEMPORADA - À PROVA DE FALHAS
 *
 * Esta função resolve de vez o problema de season:
 * - Agosto–Dezembro → tenta usar "ano atual"
 * - Janeiro–Julho → tenta usar "ano atual - 1"
 * - MAS testa na API se a season realmente existe
 * - Se não existir, automaticamente usa a anterior
 *
 * Nunca mais precisa alterar manualmente.
 */
async function obterTemporadaAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;

  // Tentativa lógica:
  // Ago–Dez → temporada começa no mesmo ano
  // Jan–Jul → temporada ainda é do ano anterior
  const tentativa = mes >= 8 ? ano : ano - 1;

  // Testa se essa temporada existe na API-Football
  const urlTeste = `https://v3.football.api-sports.io/leagues?season=${tentativa}`;

  try {
    const res = await fetch(urlTeste, {
      headers: { "x-apisports-key": API_KEY! }
    });

    const data = await res.json();

    // Se a API retornar ligas → season válida
    if (data?.response?.length > 0) {
      console.log("✔ Temporada válida encontrada:", tentativa);
      return tentativa;
    } else {
      // Season futura ainda não existe → recua 1 ano
      console.log("⚠ Temporada futura indisponível, usando:", tentativa - 1);
      return tentativa - 1;
    }
  } catch (err) {
    console.log("⚠ Erro ao testar temporada, fallback:", tentativa - 1);
    return tentativa - 1;
  }
}

/**
 * Busca jogos do dia em múltiplas ligas
 * Com season automática e garantida
 */
export async function buscarJogosDoDia(leagueIds: number[], date: string) {
  const jogos: any[] = [];
  const temporada = await obterTemporadaAtual();

  console.log("📅 Usando temporada:", temporada, "para data:", date);

  for (const leagueId of leagueIds) {
    const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${temporada}&date=${date}`;

    console.log("📡 Buscando:", url);

    try {
      const res = await fetch(url, {
        headers: { "x-apisports-key": API_KEY! }
      });

      const data = await res.json();

      console.log(
        `📥 Liga ${leagueId} →`,
        data?.response?.length ?? 0,
        "jogos encontrados"
      );

      if (data?.response?.length) {
        jogos.push(...data.response);
      }
    } catch (err) {
      console.log("❌ Erro ao buscar liga", leagueId, err);
    }
  }

  console.log("🏁 Total de jogos retornados:", jogos.length);
  return jogos;
}
