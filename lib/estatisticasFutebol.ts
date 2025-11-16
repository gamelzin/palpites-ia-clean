export async function enriquecerEstatisticasFutebol(fixtureId: number) {
  const url = `https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`;
  const res = await fetch(url, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! }
  });
  const stats = await res.json();

  // Aqui você vai fazer o processamento das estatísticas
  // Mas por enquanto só retorno para uso no Passo 2.
  return stats.response;
}
