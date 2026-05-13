# WCMP2 Metadata Editor

A single-page web application for creating and validating metadata records that conform to the [WMO Core Metadata Profile v2 (WCMP2)](https://wmo-im.github.io/wcmp2/standard/wcmp2-STABLE.html) standard used by the [WMO Information System 2 (WIS2)](https://wmo.int/wis2).

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)

## Features

- **Guided form** covering all required and optional WCMP2 fields, with inline documentation and validation hints
- **Controlled vocabulary pickers** sourced live from the [WMO Codes Registry](https://codes.wmo.int) (Earth System Disciplines, resource types, contact roles, link relations), with static fallbacks when offline
- **Interactive map** for drawing the geospatial extent of a dataset as a bounding box or polygon, powered by Leaflet
- **Live KPI scoring** — the seven metadata quality Key Performance Indicators from [pywcmp](https://github.com/wmo-im/pywcmp) are evaluated in real-time as you type, with a letter grade (A–F) and per-KPI hints
- **API validation** — submit the record to the [Canadian WIS2 Global Discovery Catalogue](https://wis2-gdc.weather.gc.ca) Essential Test Suite for authoritative conformance checking
- **JSON export** — download the finished record as a standards-compliant GeoJSON Feature file

## WCMP2 Overview

WCMP2 records are [GeoJSON Features](https://datatracker.ietf.org/doc/html/rfc7946) with a defined set of properties. Every record must include:

| Field | Description |
|---|---|
| `id` | Unique URN: `urn:wmo:md:{centre_id}:{local_id}` |
| `properties.title` | Human-readable dataset name |
| `properties.description` | Free-text summary |
| `properties.themes` | At least one theme from the Earth System Discipline vocabulary |
| `properties.contacts` | At least one contact |
| `properties.wmo:dataPolicy` | `core` (open) or `recommended` (conditional access) |
| `geometry` | Spatial extent in WGS84, or `null` |
| `time` | Temporal extent, or `null` |
| `links` | At least one access or information link |

## KPI Scoring

Records are scored against seven quality indicators derived from pywcmp:

| KPI | Max score |
|---|---|
| Good quality title | 8 |
| Good quality description | 4 |
| Time intervals | 3 |
| Graphic overview (preview image) | 3 |
| Links health | 2 per link |
| Contacts completeness | 4 |
| Persistent identifiers | 3 |

The overall percentage maps to a letter grade: **A** ≥80 · **B** ≥65 · **C** ≥50 · **D** ≥35 · **E** ≥20 · **F** <20.

## Tech Stack

| Component | Library / Tool |
|---|---|
| Framework | [React 18](https://react.dev) + [Vite 5](https://vite.dev) |
| Language | TypeScript |
| Styling | [Tailwind CSS v3](https://tailwindcss.com) |
| Map | [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org) + [leaflet-draw](https://github.com/Leaflet/Leaflet.draw) |
| Icons | [lucide-react](https://lucide.dev) |
| Validation API | [Canadian WIS2 GDC](https://wis2-gdc.weather.gc.ca) (`pywcmp-wis2-wcmp2-ets` process) |
| Vocabularies | [WMO Codes Registry](https://codes.wmo.int) |

## Getting Started

### Docker (recommended)

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) installed and running.

```bash
git clone https://github.com/6a6d74/wcmp2-editor.git
cd wcmp2-editor
```

**Build the image:**

```bash
docker build -t wcmp2-editor .
```

**Run the container:**

```bash
docker run -d --name wcmp2-editor -p 8080:80 wcmp2-editor
```

Open `http://localhost:8080` in your browser.

The `-d` flag runs the container in the background. Change `8080` to any available port on your machine if needed.

**Stop and remove the container:**

```bash
docker stop wcmp2-editor
docker rm wcmp2-editor
```

**Remove the image** (optional, frees ~21 MB):

```bash
docker rmi wcmp2-editor
```

---

### Local development (Node.js)

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/6a6d74/wcmp2-editor.git
cd wcmp2-editor
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The dev server supports hot module replacement — changes to source files are reflected instantly without a page reload.

To build a static bundle for deployment:

```bash
npm run build
# output is in dist/
```

## Project Structure

```
src/
├── components/
│   ├── kpi/            # Live KPI scoring panel
│   ├── layout/         # Header and sidebar
│   ├── map/            # Leaflet map widget
│   ├── sections/       # One component per form section
│   └── validation/     # GDC API results modal
├── hooks/
│   ├── useValidation.ts   # GDC API calls (ETS + KPI)
│   ├── useVocabulary.ts   # WMO registry fetch + cache
│   └── useWcmp2Form.ts    # Central form state
├── types/
│   └── wcmp2.ts           # TypeScript interfaces for the full record
└── utils/
    ├── kpiScorer.ts        # Local KPI calculation
    ├── vocabularies.ts     # Static fallback controlled vocabularies
    └── wcmp2Builder.ts     # Form state → GeoJSON Feature
```

## References

- [WCMP2 Standard](https://wmo-im.github.io/wcmp2/standard/wcmp2-STABLE.html)
- [pywcmp — Python WCMP2 tools](https://github.com/wmo-im/pywcmp)
- [WMO Codes Registry](https://codes.wmo.int)
- [WIS2 Global Discovery Catalogue](https://wis2-gdc.weather.gc.ca)

## License

Copyright 2025 Jeremy Tandy.

Licensed under the [Apache License, Version 2.0](LICENSE).
