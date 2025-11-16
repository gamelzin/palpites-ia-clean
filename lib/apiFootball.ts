const API_KEY = process.env.API_FOOTBALL_KEY;

export async function buscarJogosDoDia(leagueIds: number[], date: string) {
  const jogos: any[] = [];

  for (const leagueId of leagueIds) {
    const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=2024&date=${date}`;

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
