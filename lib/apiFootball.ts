const API_KEY = process.env.API_FOOTBALL_KEY;

// Detecta automaticamente a temporada correta
function obterTemporadaAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;

  // Temporadas europeias começam em agosto
  if (mes >= 8) return ano;
  return ano - 1;
}

export async function buscarJogosDoDia(leagueIds: number[], date: string) {
  const jogos: any[] = [];
  const temporada = obterTemporadaAtual();

  for (const leagueId of leagueIds) {
    const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${temporada}&date=${date}`;

    const res = await fetch(url, {
      headers: {
        "x-apisports-key": API_KEY!,
      },
    });

    const data = await res.json();

    if (data?.response?.length) {
      jogos.push(...data.response);
    }
  }

  return jogos;
}
