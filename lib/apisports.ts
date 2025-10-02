import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY!;

if (!API_KEY) {
  throw new Error("API_FOOTBALL_KEY não configurada no .env.local");
}

export async function getByDate(sport: string, date: string) {
  let url = "";
  let headers = {
    "x-apisports-key": API_KEY,
  };

  if (sport === "football") {
    url = `https://v3.football.api-sports.io/fixtures?date=${date}`;
  } else if (sport === "basketball") {
    url = `https://v1.basketball.api-sports.io/games?date=${date}`;
  } else {
    throw new Error(`Esporte não suportado: ${sport}`);
  }

  try {
    const resp = await axios.get(url, { headers });
    return resp.data.response ?? [];
  } catch (err: any) {
    console.error("[API-Sports ERROR]", err.message);
    return [];
  }
}
