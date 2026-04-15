<div align="center">

# Turkish Earthquake Monitor

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MapLibre](https://img.shields.io/badge/MapLibre%20GL-5-396cb2?style=for-the-badge&logo=maplibre)](https://maplibre.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle%20ORM-libsql-c5f74f?style=for-the-badge)](https://orm.drizzle.team/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Real-time, interactive visualization of seismic activity across Türkiye**

[Demo](https://kandilli.vercel.app) · [Report Bug](https://github.com/VanColt/Turkish_Earthquake_Monitor/issues) · [Request Feature](https://github.com/VanColt/Turkish_Earthquake_Monitor/issues)

</div>

---

## Overview

Turkish Earthquake Monitor ingests live data from the Kandilli Observatory and renders it on a custom MapLibre GL globe focused on Türkiye. Events are persisted to a libSQL database via a scheduled cron ingest, enriched with contextual data (weather at event time, nearest airports, active fault segments), and surfaced through a minimal, monochromatic inspector UI.

## Features

### Visualization
- **MapLibre GL globe** with a Türkiye-focused wash, enhanced landcover, urban areas, highways, and province lines — camera pitch is locked so selection never tilts the view.
- **Rich event markers** with glow, ring, core, white center, and pulse animation; marker gradient encodes magnitude and depth.
- **Felt-shaking heatmap** — scientifically grounded, energy-weighted model (10^1.5·M) with magnitude-driven radius (M5 ≈ 150 km). Clusters merge into hot zones; MMI-anchored color weights (cool M2–M3, red reserved for M5+ or strong clusters).
- **Active fault overlay** — GEM Global Active Faults DB (1,060 segments in the TR region), colored by slip type (cyan strike-slip, violet normal, warm thrust), rendered as thin hairlines so they read as context.

### Event Inspector
- **Türkiye-local DD/MM/YYYY** timestamps throughout, with a prominent local-time block.
- **Weather at event time + now** via Open-Meteo.
- **Nearest airports** (deduped for repeated API codes like IST).
- Magnitude, depth, and source provider details.

### Controls
- **Settings panel**: view mode (markers / heatmap / both), magnitude filter, layer toggles (faults, airports, etc.).
- **Full-screen toggle** alongside socials in the top bar, with icon swap on state.
- Zoom controls in the bottom-right rail; status bar removed for a cleaner canvas.

### Data Pipeline
- **libSQL / Turso** storage with Drizzle ORM schema and migrations.
- **Cron ingest** (`/api/cron`) pulls Kandilli events on schedule (see `vercel.json`) and upserts into the DB.
- **REST endpoint** (`/api/earthquakes`) serves the feed to the client.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack) · React 19
- **Language**: TypeScript 5
- **Map**: MapLibre GL 5
- **UI**: Ant Design 5 · Tailwind CSS 4
- **Database**: libSQL (Turso-compatible) via Drizzle ORM
- **Scheduling**: Vercel Cron
- **Data sources**:
  - [Kandilli Observatory API](https://github.com/orhanayd/kandilli-rasathanesi-api) by [Orhan Aydoğdu](https://github.com/orhanayd)
  - [Open-Meteo](https://open-meteo.com/) — historical + current weather
  - [GEM Global Active Faults Database](https://github.com/GEMScienceTools/gem-global-active-faults)

## Getting Started

### Prerequisites
- Node.js 18.17+ (20+ recommended)
- A libSQL database URL (local file or Turso)

### Setup

```sh
git clone https://github.com/VanColt/Turkish_Earthquake_Monitor.git
cd Turkish_Earthquake_Monitor
npm install
```

Create a `.env.local`:

```env
DATABASE_URL=file:./local.db
# or for Turso:
# DATABASE_URL=libsql://<your-db>.turso.io
# DATABASE_AUTH_TOKEN=<token>
CRON_SECRET=<random-string>
```

Push the schema and run:

```sh
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev) |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cron/          # Scheduled Kandilli ingest
│   │   └── earthquakes/   # Feed endpoint
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Globe.tsx          # MapLibre globe + markers + heatmap + faults
│   ├── EventFeed.tsx
│   ├── EventInspector.tsx # Local time, weather, airports
│   ├── SettingsPanel.tsx
│   └── TopBar.tsx
├── db/                    # Drizzle client + schema
├── lib/                   # datetime, kandilli, magnitude, weather, settings
└── services/
    └── earthquakeService.ts
```

## Disclaimer

**English** — Commercial Use Warning: The information, data, and maps provided cannot be used for commercial purposes in any way without the written permission and approval of the Rectorate of Boğaziçi University.

**Türkçe** — Ticari kullanım uyarısı: Söz konusu bilgi, veri ve haritalar Boğaziçi Üniversitesi Rektörlüğü'nün yazılı izni ve onayı olmadan herhangi bir şekilde ticari amaçlı kullanılamaz.

## License

Distributed under the MIT License. See `LICENSE`.

## Acknowledgements

- [Orhan Aydoğdu](https://github.com/orhanayd) — Kandilli Observatory API
- [Kandilli Observatory and Earthquake Research Institute](http://www.koeri.boun.edu.tr/) — seismic data
- [Boğaziçi University](http://www.boun.edu.tr/) — supporting earthquake research
- [GEM Foundation](https://www.globalquakemodel.org/) — Global Active Faults Database
- [Open-Meteo](https://open-meteo.com/) — weather data

## Contact

- GitHub: [@VanColt](https://github.com/VanColt)
- LinkedIn: [Mert Uysal](https://www.linkedin.com/in/mert-uysal/)

---

<div align="center">

Made in Türkiye, with the hope it never has to be used in an emergency.

</div>
