// src/lib/weather.ts

export interface WeatherPoint {
  dt: number;
  temp: number;
  weather: {
    description: string;
    icon: string;
  }[];
}

interface OneCallResponse {
  hourly: WeatherPoint[];
}

/**
 * Obtiene la previsión horaria completa (cada hora) para lat, lon.
 * Usa la API One Call de OpenWeather.  
 * @param lat Latitud en grados (string o número)
 * @param lon Longitud en grados (string o número)
 * @returns Promesa con el array de WeatherPoint para cada hora
 */
export async function getHourlyForecast(
  lat: string | number,
  lon: string | number
): Promise<WeatherPoint[]> {
  const key = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
  if (!key) {
    throw new Error("Falta NEXT_PUBLIC_OPENWEATHER_KEY en .env.local");
  }

  const url = new URL("https://api.openweathermap.org/data/2.5/onecall");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("exclude", "current,minutely,daily,alerts");
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "es");
  url.searchParams.set("appid", key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Error al obtener meteorología: ${msg}`);
  }
  const data = (await res.json()) as OneCallResponse;
  return data.hourly;
}
