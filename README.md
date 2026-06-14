# WCMP2 Metadata Editor

A single-page web application for creating, editing, and publishing metadata records that conform to the [WMO Core Metadata Profile v2 (WCMP2)](https://wmo-im.github.io/wcmp2/standard/wcmp2-STABLE.html) standard used by the [WMO Information System 2 (WIS2)](https://wmo.int/wis2).

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)

## Features

- **Guided form** covering all required and optional WCMP2 fields, with inline documentation and validation hints
- **Operational status picker** — the optional `status` field in Core Properties exposes preset buttons for all five values in the [WMO operational status code list](https://codes.wmo.int/wis/operational-status) (experimental, not-available, operational, pre-operational, scientific). Selecting a preset pre-fills the `id`, `title`, and `url` fields; all three can be overridden manually for custom status vocabularies. Note: the operational status code list will be formally published after INFCOM-4 in November 2026
- **Controlled vocabulary pickers** sourced live from the [WMO Codes Registry](https://codes.wmo.int) (Earth System Disciplines, resource types) and the [WCMP2 codelists repository](https://github.com/wmo-im/wcmp2-codelists) (contact roles, link types), with static fallbacks when offline. Contact roles are restricted to the five defined in the WCMP2 standard: `licensor`, `producer`, `processor`, `host`, and `publisher`. Link relations are drawn from the full [IANA link relations registry](https://www.iana.org/assignments/link-relations/) (118 entries, embedded at build time as the IANA endpoint does not support CORS) plus any WCMP2-specific additions fetched dynamically at runtime. Additional concept vocabularies — including GRIB2 Parameters, BUFR4 Elements, and [CF Standard Names](https://vocab.nerc.ac.uk/collection/P07/current) — are offered as quick-select suggestions in the custom vocabulary picker; a **View vocabulary ↗** link opens the selected vocabulary in a new tab for browsing
- **Link relation autocomplete** — the relation field in each link uses a combobox: type to filter the list to prefix matches, with inline autocomplete to the first result; use arrow keys to navigate, Enter or click to select
- **Country picker** — searchable autocomplete for ISO 3166-1 alpha-3 country codes in contact addresses; filter by country name or code prefix
- **Interactive map** for drawing the geospatial extent of a dataset as a bounding box or polygon, powered by Leaflet. Bounding boxes use a click-to-place-first-corner, click-to-complete interaction with a live preview rectangle. Six input modes are available: draw on map, global bounding box, country bounding box, manual N/E/S/W coordinate entry, direct GeoJSON editing, and null (non-spatial). The draw mode supports multi-geometry: placing multiple markers produces a `MultiPoint`; drawing multiple bounding boxes or polygons produces a `MultiPolygon`. Shapes can be mixed only within the same type — switching between point and polygon tools triggers a confirmation dialog. Each shape in a multi-geometry can be individually edited or deleted via the draw toolbar; markers are draggable in edit mode. **Note:** geometries loaded from an imported record cannot currently be edited via the interactive map; use the **JSON** mode as a workaround to modify them directly. An optional **additional spatial extents** (`additionalExtents.spatial`) block can be included via a checkbox; the JSON editor is pre-populated with a bounding box derived from the current geometry (or global coverage if no geometry is set) and validated in real time
- **Temporal extent** — supports date, timestamp, and interval types; the interval Begin and End fields use a native date-time picker (all times UTC) and validate that Begin is earlier than End; ISO 8601 duration resolution (`time.resolution`); optional `additionalExtents.temporal` block with a live JSON editor and syntax validation. When both spatial and temporal additional extents are included, they are combined into a single `additionalExtents` object in the exported record
- **Live KPI scoring** — the seven metadata quality Key Performance Indicators from [pywcmp](https://github.com/wmo-im/pywcmp) are evaluated in real-time as you type, with a letter grade (A–F) and per-KPI hints
- **API validation** — submit the record to the [Canadian WIS2 Global Discovery Catalogue](https://wis2-gdc.weather.gc.ca) Essential Test Suite for authoritative conformance checking
- **Contacts with optional fields** — each contact card exposes organisation and individual name as core fields; email, phone, country, city, contact instructions, position, and hours of service are all opt-in via a checkbox. Only checked fields are written to the exported JSON. Importing a record automatically pre-ticks the checkboxes for any fields present in that record
- **Clone contacts** — duplicate any existing contact with a single click; useful when a dataset has multiple contacts who share most fields (organisation, address, roles)
- **Link health check** — each link has a **Test** button that sends an HTTP HEAD request and reports the response status (OK, Redirect, Error, or connection failure)
- **Country bounding boxes** — select a country from the geospatial extent picker to populate the geometry with that country's bounding box. Countries whose territory crosses the 180° antimeridian (Fiji, Kiribati, Russia) are represented as a GeoJSON `MultiPolygon` split at ±180°, rather than a single world-spanning rectangle
- **Direct GeoJSON geometry entry** — paste or type any GeoJSON geometry object (Point, LineString, Polygon, MultiPolygon, GeometryCollection, etc.) directly into a textarea. The JSON is validated in real time and the map updates on every valid keystroke. Switching to this mode pre-populates the textarea from the current geometry, or seeds a United Kingdom bounding-box example when no geometry is set
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

The following fields are optional but supported by the editor:

| Field | Description |
|---|---|
| `properties.status` | Operational status of the dataset. Accepts an object with `id`, `title`, and `url`. Preset values are drawn from the [WMO operational status code list](https://codes.wmo.int/wis/operational-status) (`experimental`, `not-available`, `operational`, `pre-operational`, `scientific`). Note: this code list will be formally published after INFCOM-4 in November 2026. |
| `properties.version` | Version identifier for the dataset |
| `properties.keywords` | Free-text keyword tags |
| `properties.rights` | Rights and usage statement |

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
| Framework | [React 19](https://react.dev) + [Vite 8](https://vite.dev) |
| Language | TypeScript |
| Styling | [Tailwind CSS v3](https://tailwindcss.com) |
| Container | [Docker](https://www.docker.com) — node:22-alpine + `vite preview`, published to [GHCR](https://ghcr.io/6a6d74/wcmp2-editor) |
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

The pre-built image is published to the GitHub Container Registry on every push to `main`:

```bash
docker pull ghcr.io/6a6d74/wcmp2-editor:latest
```

**Run the container:**

```bash
docker run -d --name wcmp2-editor -p 8080:4173 ghcr.io/6a6d74/wcmp2-editor:latest
```

Open `http://localhost:8080` in your browser.

The container listens on port **4173** (served by `vite preview`). Map that to any host port you need with `-p <host-port>:4173`. The `-d` flag runs the container in the background.

**Stop and remove the container:**

```bash
docker stop wcmp2-editor
docker rm wcmp2-editor
```

**Build the image locally** (if you have cloned the repository):

```bash
git clone https://github.com/6a6d74/wcmp2-editor.git
cd wcmp2-editor
docker build -t wcmp2-editor .
docker run -d --name wcmp2-editor -p 8080:4173 wcmp2-editor
```

If the app will be served under a sub-path (e.g. `/wcmp2-editor/`), pass `VITE_BASE_PATH` at build time:

```bash
docker build --build-arg VITE_BASE_PATH=/wcmp2-editor/ -t wcmp2-editor .
```

---

### Embedding in your own application

The Docker image is designed to sit behind an external reverse proxy — it ships no web server of its own beyond `vite preview`. This makes it straightforward to incorporate into a multi-container application.

**Docker Compose example** (nginx as the proxy):

```yaml
services:
  wcmp2-editor:
    image: ghcr.io/6a6d74/wcmp2-editor:latest
    restart: unless-stopped
    # Do not expose port 4173 directly — let the proxy handle it

  proxy:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - wcmp2-editor
```

**Minimal `nginx.conf`** for the proxy service:

```nginx
server {
    listen 80;

    location /wcmp2-editor/ {
        proxy_pass http://wcmp2-editor:4173/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Notes for integrators:**

- The app is a fully client-side SPA. All requests that do not match a static asset should be routed to `index.html` — configure your proxy's SPA fallback accordingly (e.g. `try_files $uri /index.html` in nginx, or equivalent).
- The container makes outbound HTTPS requests to external services (WMO Codes Registry, Canadian WIS2 GDC validation API, OpenStreetMap tile servers, and `api.github.com`). Ensure outbound internet access is available, or configure appropriate firewall rules.
- No persistent storage is required — the container is stateless.
- Available image tags: `latest` (current `main` branch) and short commit SHAs (e.g. `a1b2c3d`) for pinning to a specific release.
- If serving the app under a sub-path, build the image with `--build-arg VITE_BASE_PATH=/your-path/` so that asset URLs in the built output are prefixed correctly. The default is `/` (root).
- **Public-facing deployments must be placed behind a reverse proxy** (such as nginx, Caddy, or a cloud load balancer). The container runs `vite preview`, which is a lightweight file server with no TLS, rate limiting, or authentication. A reverse proxy provides HTTPS termination, access control, and protection against direct exposure of the internal port.

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
    ├── deploy-pages.yml   # Build and deploy to GitHub Pages on push to main
    └── publish-docker.yml # Build and push Docker image to GHCR on push to main
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
