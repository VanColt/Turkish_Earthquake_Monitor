/**
 * Build admin-boundary GeoJSON for Türkiye.
 *
 * Merges metadata (name, parent_id, region_id, plate_code, etc.) from
 * `ttezer/turkiye-harita-verisi` into the raw admin GeoJSON so the map can
 * label features on hover/click without loading a second file.
 *
 * Source:
 *   - https://github.com/ttezer/turkiye-harita-verisi (MIT code, CC BY-IGO data)
 *   - Boundaries derived from HDX COD-AB Türkiye (https://data.humdata.org/dataset/cod-ab-tur)
 *
 * Usage:
 *   Point SRC_DIR at a local clone of the ttezer repo, then:
 *     npx tsx scripts/build-admin-geo.ts
 *
 * Outputs `public/tr-regions.geojson`, `public/tr-provinces.geojson`,
 * `public/tr-districts.geojson`.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRC_DIR = process.env.TTEZER_SRC ?? '/tmp/ttezer-map';
const OUT_DIR = resolve(process.cwd(), 'public');

type MetaEntry = {
  id: string;
  name: string;
  parent_id: string | null;
  region_id?: string | null;
  region_name?: string | null;
  plate_code?: string | null;
  iso_3166_2?: string | null;
};

type GeoFeature = {
  type: 'Feature';
  properties: Record<string, unknown> & { id: string };
  geometry: unknown;
};

type GeoCollection = {
  type: 'FeatureCollection';
  name?: string;
  features: GeoFeature[];
};

function loadJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function merge(
  geoPath: string,
  metaPath: string,
  keep: (m: MetaEntry) => Record<string, unknown>
) {
  if (!existsSync(geoPath)) throw new Error(`missing ${geoPath}`);
  if (!existsSync(metaPath)) throw new Error(`missing ${metaPath}`);

  const geo = loadJSON<GeoCollection>(geoPath);
  const meta = loadJSON<MetaEntry[]>(metaPath);
  const metaById = new Map(meta.map((m) => [m.id, m]));

  for (const f of geo.features) {
    const m = metaById.get(f.properties.id);
    if (!m) continue;
    Object.assign(f.properties, { name: m.name, ...keep(m) });
  }

  return geo;
}

// English translations for the 7 Geographic Regions of Türkiye.
// The rest of the UI is in English, so regions are shown in English on the
// map while the original Turkish name is kept under `name_tr` for reference.
const REGION_EN: Record<string, string> = {
  'TR-R-AKD': 'Mediterranean',
  'TR-R-DOA': 'Eastern Anatolia',
  'TR-R-EGE': 'Aegean',
  'TR-R-GDA': 'Southeastern Anatolia',
  'TR-R-ICA': 'Central Anatolia',
  'TR-R-KAR': 'Black Sea',
  'TR-R-MAR': 'Marmara',
};

function main() {
  const regions = merge(
    join(SRC_DIR, 'dist/geojson/regions.geojson'),
    join(SRC_DIR, 'data/processed/regions.metadata.json'),
    () => ({})
  );
  // Overwrite the region `name` with its English translation, keeping the
  // original Turkish name under `name_tr` so nothing is lost.
  for (const f of regions.features) {
    const id = f.properties.id;
    const tr = f.properties.name as string | undefined;
    const en = REGION_EN[id];
    if (en) {
      f.properties.name_tr = tr ?? null;
      f.properties.name = en;
    }
  }
  writeFileSync(join(OUT_DIR, 'tr-regions.geojson'), JSON.stringify(regions));
  console.log(`regions: ${regions.features.length} features`);

  // Build an id → name map of provinces so we can inject `parent_name`
  // onto each district feature — saves a second lookup in the hover tooltip.
  const provinceMeta = loadJSON<MetaEntry[]>(
    join(SRC_DIR, 'data/processed/provinces.metadata.json')
  );
  const provinceNameById = new Map(provinceMeta.map((m) => [m.id, m.name] as const));

  const provinces = merge(
    join(SRC_DIR, 'dist/geojson/provinces.geojson'),
    join(SRC_DIR, 'data/processed/provinces.metadata.json'),
    (m) => {
      const regionEn = (m.region_id && REGION_EN[m.region_id]) || m.region_name || null;
      return {
        region_id: m.region_id ?? null,
        region_name: regionEn, // English — matches the region overlay labels
        region_name_tr: m.region_name ?? null,
        parent_name: regionEn, // region containing this province (English)
        plate_code: m.plate_code ?? null,
      };
    }
  );
  writeFileSync(join(OUT_DIR, 'tr-provinces.geojson'), JSON.stringify(provinces));
  console.log(`provinces: ${provinces.features.length} features`);

  const districts = merge(
    join(SRC_DIR, 'dist/geojson/districts.geojson'),
    join(SRC_DIR, 'data/processed/districts.metadata.json'),
    (m) => ({
      parent_id: m.parent_id,
      parent_name: (m.parent_id && provinceNameById.get(m.parent_id)) ?? null,
      plate_code: m.plate_code ?? null,
    })
  );
  writeFileSync(join(OUT_DIR, 'tr-districts.geojson'), JSON.stringify(districts));
  console.log(`districts: ${districts.features.length} features`);
}

main();
