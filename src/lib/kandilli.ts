const KANDILLI_LIVE = 'https://api.orhanaydogdu.com.tr/deprem/kandilli/live';

export interface KandilliEarthquake {
  earthquake_id: string;
  provider: string;
  title: string;
  mag: number;
  depth: number;
  geojson: { type: string; coordinates: [number, number] };
  location_properties: {
    closestCity?: { name: string; cityCode: number; distance: number; population: number };
    epiCenter?: { name: string; cityCode: number; population: number | null };
    closestCities?: Array<{ name: string; cityCode: number; distance: number; population: number }>;
    airports?: Array<{ distance: number; name: string; code: string; coordinates: { type: string; coordinates: [number, number] } }>;
  };
  date_time: string;
  created_at: number;
  location_tz?: string;
  rev?: string | null;
}

export interface KandilliResponse {
  status: boolean;
  httpStatus: number;
  result: KandilliEarthquake[];
}

export async function fetchKandilliLive(limit = 500): Promise<KandilliEarthquake[]> {
  const url = `${KANDILLI_LIVE}?limit=${limit}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Kandilli API returned ${res.status}`);
  }
  const data = (await res.json()) as KandilliResponse;
  if (!data.status || !Array.isArray(data.result)) {
    throw new Error('Kandilli API returned malformed response');
  }
  return data.result;
}
