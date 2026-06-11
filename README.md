# WCMP2 Metadata Editor

A single-page web application for creating, editing, and publishing metadata records that conform to the [WMO Core Metadata Profile v2 (WCMP2)](https://wmo-im.github.io/wcmp2/standard/wcmp2-STABLE.html) standard used by the [WMO Information System 2 (WIS2)](https://wmo.int/wis2).

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)

## Features

- **Guided form** covering all required and optional WCMP2 fields, with inline documentation and validation hints
- **Controlled vocabulary pickers** sourced live from the [WMO Codes Registry](https://codes.wmo.int) (Earth System Disciplines, resource types, contact roles, link relations), with static fallbacks when offline
- **Country picker** — searchable autocomplete for ISO 3166-1 alpha-3 country codes in contact addresses; filter by country name or code prefix
- **Interactive map** for drawing the geospatial extent of a dataset as a bounding box or polygon, powered by Leaflet. Bounding boxes use a click-to-place-first-corner, click-to-complete interaction with a live preview rectangle
- **Temporal extent** — supports date, timestamp, and interval types; ISO 8601 duration resolution (`time.resolution`); optional `additionalExtents` block with a live JSON editor and syntax validation
- **Live KPI scoring** — the seven metadata quality Key Performance Indicators from [pywcmp](https://github.com/wmo-im/pywcmp) are evaluated in real-time as you type, with a letter grade (A–F) and per-KPI hints
- **API validation** — submit the record to the [Canadian WIS2 Global Discovery Catalogue](https://wis2-gdc.weather.gc.ca) Essential Test Suite for authoritative conformance checking
- **Clone contacts** — duplicate any existing contact with a single click; useful when a dataset has multiple contacts who share most fields (organisation, address, roles)
- **Link health check** — each link has a **Test** button that sends an HTTP HEAD request and reports the response status (OK, Redirect, Error, or connection failure)
- **Import existing records** — load a record from a local `.json` file (drag-and-drop or browse) or fetch directly from a URL; the file is validated as a WCMP2 record before populating the form. On the first edit after importing, the editor asks whether to update the `updated` timestamp
- **JSON export** — download the finished record as a standards-compliant GeoJSON Feature file
- **Push to GitHub** — authenticate with a Personal Access Token, choose a repository and directory, and open a pull request directly from the editor (see [GitHub integration](#github-integration) below)

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
| `time` | Temporal extent (date / timestamp / interval), or `null`. May include `resolution` (ISO 8601 duration) |
| `links` | At least one access or information link |

Timestamps for `properties.created` and `properties.updated` are stored and exported as full ISO 8601 UTC timestamps (`YYYY-MM-DDThh:mm:ssZ`).

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

## GitHub Integration

The **Push to GitHub** button walks through a four-step workflow:

1. **Authenticate** — enter a GitHub Personal Access Token. The token is stored in the browser's `sessionStorage` for the duration of the tab and is never sent anywhere other than the GitHub API.

   Required permissions:
   - **Classic token:** `repo` scope — [create one here](https://github.com/settings/tokens/new?scopes=repo&description=WCMP2+Editor)
   - **Fine-grained token:** _Contents_ (read & write) and _Pull requests_ (read & write) for the target repository

2. **Repository** — select from a filtered list of your repositories, or type `owner/repo` directly. Write access is verified before proceeding.

3. **Location** — browse the repository's directory tree, navigate into subdirectories, create new folders, and confirm the filename (pre-filled from the record's local ID). If a file already exists at the chosen path, the editor prompts you to either update it or choose a different filename.

4. **Review & push** — edit the PR title and Markdown description (pre-populated with a structured summary of the record), then click **Create pull request**.

The editor creates a uniquely timestamped branch (`wcmp2-editor/{record-id}-{YYYYMMDDHHmmss}`), commits the record JSON, and opens a pull request against the repository's default branch. The PR title says "Update" rather than "Add" when overwriting an existing file. The PR description includes a merge checklist that prompts for WCMP2 ETS validation and data-owner approval before merging.

> **Why a pull request?** In operational WIS2 deployments, merging a metadata record to the main branch triggers automated validation pipelines and requires approval from designated reviewers. The PR model ensures records are never published without passing these checks.

## Importing Existing Records

Use the **Import** button to load an existing WCMP2 record from a local `.json` file or a URL. The editor validates the record structure before importing and reports any conformance errors.

On import:
- All fields are populated from the record, including `created` and `updated` timestamps (preserved exactly as-is)
- On the **first edit** made after importing, a dialog asks whether to advance the `updated` timestamp to the current date and time

## Tech Stack

| Component | Library / Tool |
|---|---|
| Framework | [React 18](https://react.dev) + [Vite 8](https://vite.dev) |
| Language | TypeScript |
| Styling | [Tailwind CSS v3](https://tailwindcss.com) |
| Map | [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org) + [leaflet-draw](https://github.com/Leaflet/Leaflet.draw) |
| Icons | [lucide-react](https://lucide.dev) |
| Validation API | [Canadian WIS2 GDC](https://wis2-gdc.weather.gc.ca) (`pywcmp-wis2-wcmp2-ets` process) |
| Vocabularies | [WMO Codes Registry](https://codes.wmo.int) |
| GitHub API | Native `fetch` against `api.github.com` |

## Getting Started

### GitHub Pages (no installation required)

The editor is hosted publicly at:

**https://6a6d74.github.io/wcmp2-editor/**

No account or sign-in is needed. Every push to the `main` branch automatically rebuilds and redeploys the site via GitHub Actions.

---

### Docker (recommended for local use)

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
.github/
└── workflows/
    └── deploy-pages.yml   # Build and deploy to GitHub Pages on push to main
src/
├── components/
│   ├── kpi/               # Live KPI scoring panel
│   ├── layout/            # Header and sidebar
│   ├── map/               # Leaflet map widget + draw toolbar icon overrides
│   ├── sections/          # One component per form section
│   └── validation/        # GDC API results modal
│   CountryPicker.tsx      # ISO 3166-1 alpha-3 autocomplete
│   GitHubPushDialog.tsx   # GitHub PR workflow (4-step modal)
│   ImportDialog.tsx       # Import from file or URL
├── hooks/
│   ├── useValidation.ts   # GDC API calls (ETS + KPI)
│   ├── useVocabulary.ts   # WMO registry fetch + cache
│   └── useWcmp2Form.ts    # Central form state
├── types/
│   └── wcmp2.ts           # TypeScript interfaces for the full record
└── utils/
    ├── countries.ts        # ISO 3166-1 alpha-3 country list
    ├── github.ts           # GitHub REST API helpers
    ├── kpiScorer.ts        # Local KPI calculation
    ├── vocabularies.ts     # Static fallback controlled vocabularies
    ├── wcmp2Builder.ts     # Form state → GeoJSON Feature
    └── wcmp2Parser.ts      # GeoJSON Feature → form state (for import)
```

## References

- [WCMP2 Standard](https://wmo-im.github.io/wcmp2/standard/wcmp2-STABLE.html)
- [pywcmp — Python WCMP2 tools](https://github.com/wmo-im/pywcmp)
- [WMO Codes Registry](https://codes.wmo.int)
- [WIS2 Global Discovery Catalogue](https://wis2-gdc.weather.gc.ca)

## License

Copyright 2026 Jeremy Tandy.

Licensed under the [Apache License, Version 2.0](LICENSE).
