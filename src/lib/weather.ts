// Open-Meteo — free, no API key, CORS-enabled.
// We pull Türkiye-local hourly data from the forecast endpoint with
// `past_days=14`, which gives both recent past and current weather in one
// request. Sufficient for any earthquake within Kandilli's 24h live window.

export interface WeatherSnapshot {
  time: string; // ISO local
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  weatherCode: number; // WMO code
  precipitation: number; // mm
}

export interface WeatherResult {
  now: WeatherSnapshot | null;
  atEvent: WeatherSnapshot | null;
}

const WEATHER_CODE_LABEL: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ hail',
  99: 'Severe thunderstorm',
};

const WEATHER_CODE_GLYPH: Record<number, string> = {
  0: '☀',
  1: '🌤',
  2: '⛅',
  3: '☁',
  45: '🌫',
  48: '🌫',
  51: '🌦',
  53: '🌦',
  55: '🌧',
  61: '🌧',
  63: '🌧',
  65: '🌧',
  71: '🌨',
  73: '🌨',
  75: '❄',
  80: '🌧',
  81: '🌧',
  82: '⛈',
  85: '🌨',
  86: '❄',
  95: '⛈',
  96: '⛈',
  99: '⛈',
};

export function describeWeather(code: number): string {
  return WEATHER_CODE_LABEL[code] ?? 'Unknown';
}
export function weatherGlyph(code: number): string {
  return WEATHER_CODE_GLYPH[code] ?? '·';
}

function parseIstanbulNaive(input: string): Date {
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return new Date(input);
  const [, y, mo, d, h, mi, s] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h - 3, +mi, +(s ?? 0)));
}

export async function fetchWeather(
  lat: number,
  lng: number,
  eventDateTime?: string
): Promise<WeatherResult> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set(
    'hourly',
    'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation'
  );
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation'
  );
  url.searchParams.set('past_days', '14');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', 'Europe/Istanbul');
  url.searchParams.set('wind_speed_unit', 'kmh');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = await res.json();

  const now: WeatherSnapshot | null = data.current
    ? {
        time: data.current.time,
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        precipitation: data.current.precipitation ?? 0,
      }
    : null;

  let atEvent: WeatherSnapshot | null = null;
  if (eventDateTime && data.hourly?.time?.length) {
    const target = parseIstanbulNaive(eventDateTime).getTime();
    const times: number[] = data.hourly.time.map((t: string) =>
      parseIstanbulNaive(t).getTime()
    );
    let bestIdx = -1;
    let bestDelta = Infinity;
    for (let i = 0; i < times.length; i++) {
      const dt = Math.abs(times[i] - target);
      if (dt < bestDelta) {
        bestDelta = dt;
        bestIdx = i;
      }
    }
    // Only keep if the closest hour is within 90 minutes — otherwise no match.
    if (bestIdx >= 0 && bestDelta <= 90 * 60 * 1000) {
      atEvent = {
        time: data.hourly.time[bestIdx],
        temperature: data.hourly.temperature_2m[bestIdx],
        humidity: data.hourly.relative_humidity_2m[bestIdx],
        windSpeed: data.hourly.wind_speed_10m[bestIdx],
        weatherCode: data.hourly.weather_code[bestIdx],
        precipitation: data.hourly.precipitation[bestIdx] ?? 0,
      };
    }
  }

  return { now, atEvent };
}
