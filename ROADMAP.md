# Roadmap

## Legend

- ✅ Implemented
- 🔄 In progress
- ⬜ Pending

---

## Active data sources

| Source         | Base URL                       | Data provided                                                                     |
| -------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| PyPI JSON API  | `pypi.org`                     | Project metadata, all versions, distribution files, classifiers, vulnerabilities  |
| pypistats.org  | `pypistats.org`                | Historical download counts by period, Python version, and operating system        |
| deps.dev       | `api.deps.dev/v3`              | Resolved dependency graph with exact versions, direct/transitive classification   |

---

## PyPIClient (entry point)

| Method                         | Endpoint                                                                 | Status |
| ------------------------------ | ------------------------------------------------------------------------ | ------ |
| `package(name)`                | — chainable                                                              | ⬜     |
| `on('request', handler)`       | — event emitter                                                          | ⬜     |
| AbortSignal support on all methods | —                                                                    | ⬜     |

### Constructor options (`PyPIClientOptions`)

| Option         | Default                        | Description                                              |
| -------------- | ------------------------------ | -------------------------------------------------------- |
| `apiUrl?`      | `'https://pypi.org'`           | Base URL for the PyPI JSON API                           |
| `statsApiUrl?` | `'https://pypistats.org'`      | Base URL for the pypistats.org download stats API        |
| `depsDevUrl?`  | `'https://api.deps.dev/v3'`    | Base URL for the deps.dev dependency graph API           |

---

## PackageResource

Returned by `pip.package(name)`. Implements `PromiseLike<PyPIProject>` so it can be awaited directly.

| Method                              | Endpoint                                                                       | Status |
| ----------------------------------- | ------------------------------------------------------------------------------ | ------ |
| `get(signal?)`                      | `GET /pypi/{name}/json`                                                        | ⬜     |
| `info(signal?)`                     | `GET /pypi/{name}/json` (extracts `info` field only)                           | ⬜     |
| `version(ver)`                      | — chainable → `VersionResource`                                                | ⬜     |
| `latest()`                          | — chainable → `VersionResource` for `info.version`                            | ⬜     |
| `versions(signal?)`                 | `GET /pypi/{name}/json` (extracts sorted version strings from `releases`)      | ⬜     |
| `releases(signal?)`                 | `GET /pypi/{name}/json` (extracts full `releases` map)                         | ⬜     |
| `vulnerabilities(signal?)`          | `GET /pypi/{name}/json` (extracts `vulnerabilities` array)                     | ⬜     |
| `downloads(signal?)`                | `GET /api/packages/{name}/recent` via pypistats.org                            | ⬜     |
| `downloadsByPythonMajor(params?, signal?)` | `GET /api/packages/{name}/python_major` via pypistats.org              | ⬜     |
| `downloadsByPythonMinor(params?, signal?)` | `GET /api/packages/{name}/python_minor` via pypistats.org              | ⬜     |
| `downloadsBySystem(params?, signal?)` | `GET /api/packages/{name}/system` via pypistats.org                        | ⬜     |
| `downloadsByMirrors(params?, signal?)` | `GET /api/packages/{name}/overall` via pypistats.org                       | ⬜     |

---

## VersionResource

Returned by `pip.package(name).version(ver)` or `.latest()`. Implements `PromiseLike<PyPIVersionInfo>`.

| Method                   | Endpoint                                                                                   | Status |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------ |
| `get(signal?)`           | `GET /pypi/{name}/{version}/json`                                                          | ⬜     |
| `files(signal?)`         | `GET /pypi/{name}/{version}/json` (extracts `urls` — the distribution files array)        | ⬜     |
| `vulnerabilities(signal?)` | `GET /pypi/{name}/{version}/json` (extracts `vulnerabilities`)                           | ⬜     |
| `dependencies(signal?)`  | `GET /systems/pypi/packages/{name}/versions/{version}:dependencies` via api.deps.dev/v3   | ⬜     |

---

## Domain types

### `src/domain/Project.ts`

Models the response from `GET /pypi/{name}/json`.

| Field                          | Type                          | Description                                                                  |
| ------------------------------ | ----------------------------- | ---------------------------------------------------------------------------- |
| `info`                         | `PyPIProjectInfo`             | Current (latest) version metadata                                             |
| `last_serial`                  | `number`                      | PyPI serial number — monotonic event counter for this project                |
| `releases`                     | `Record<string, PyPIFile[]>`  | Map of version string → list of distribution files                           |
| `urls`                         | `PyPIFile[]`                  | Distribution files for the latest version                                    |
| `vulnerabilities`              | `PyPIVulnerability[]`         | Known vulnerabilities reported by PyPI for the latest version                |

#### `PyPIProjectInfo` fields

| Field                    | Type                          | Description                                                                   |
| ------------------------ | ----------------------------- | ----------------------------------------------------------------------------- |
| `name`                   | `string`                      | Normalized project name                                                       |
| `version`                | `string`                      | Latest published version string                                               |
| `summary`                | `string \| null`              | Short one-line description                                                    |
| `description`            | `string \| null`              | Full long description (typically the README)                                  |
| `description_content_type` | `string \| null`            | MIME type of `description` (e.g. `'text/markdown'`, `'text/x-rst'`)          |
| `author`                 | `string \| null`              | Author name                                                                   |
| `author_email`           | `string \| null`              | Author email (may include `"Name <email>"` format)                            |
| `maintainer`             | `string \| null`              | Maintainer name                                                               |
| `maintainer_email`       | `string \| null`              | Maintainer email                                                              |
| `license`                | `string \| null`              | SPDX license expression or free-text license name                             |
| `license_expression`     | `string \| null`              | Structured SPDX expression (newer metadata)                                   |
| `keywords`               | `string \| null`              | Space or comma-separated keywords                                             |
| `classifiers`            | `string[]`                    | Trove classifiers (e.g. `'Programming Language :: Python :: 3'`)              |
| `requires_dist`          | `string[] \| null`            | PEP 508 dependency specifiers (runtime dependencies)                          |
| `requires_python`        | `string \| null`              | Python version constraint (e.g. `'>=3.8'`)                                    |
| `home_page`              | `string \| null`              | Project homepage URL                                                          |
| `project_url`            | `string \| null`              | Primary project URL                                                           |
| `project_urls`           | `Record<string, string> \| null` | Named project URLs (e.g. `{ Homepage, Source, Documentation }`)            |
| `bugtrack_url`           | `string \| null`              | Bug tracker URL                                                               |
| `docs_url`               | `string \| null`              | Documentation URL (PyPI-hosted docs, rare)                                   |
| `download_url`           | `string \| null`              | Alternate download URL                                                        |
| `yanked`                 | `boolean`                     | Whether the latest release was yanked                                         |
| `yanked_reason`          | `string \| null`              | Reason the release was yanked                                                 |

#### `PyPIFile` fields (individual distribution files)

| Field                   | Type                          | Description                                                                    |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `filename`              | `string`                      | Distribution filename (e.g. `requests-2.31.0-py3-none-any.whl`)               |
| `url`                   | `string`                      | Full download URL on `files.pythonhosted.org`                                  |
| `size`                  | `number`                      | File size in bytes                                                             |
| `digests`               | `{ md5: string; sha256: string }` | Content hash digests                                                       |
| `packagetype`           | `'sdist' \| 'bdist_wheel'`    | Distribution type                                                              |
| `python_version`        | `string`                      | Python version tag (e.g. `'py3'`, `'cp311'`, `'source'`)                      |
| `requires_python`       | `string \| null`              | Python version constraint for this distribution file                           |
| `upload_time_iso_8601`  | `string`                      | ISO 8601 upload timestamp                                                      |
| `yanked`                | `boolean`                     | Whether this specific file was yanked                                          |
| `yanked_reason`         | `string \| null`              | Reason this file was yanked                                                    |

#### `PyPIVulnerability` fields

| Field         | Type       | Description                                               |
| ------------- | ---------- | --------------------------------------------------------- |
| `id`          | `string`   | Vulnerability ID (e.g. `GHSA-xxxx-xxxx-xxxx`)            |
| `source`      | `string`   | Source database (e.g. `'osv'`)                            |
| `link`        | `string`   | URL to the full advisory                                  |
| `aliases`     | `string[]` | Alternate IDs (CVE, PYSEC, etc.)                          |
| `details`     | `string`   | Short description of the vulnerability                    |
| `summary`     | `string`   | One-line summary                                          |
| `fixed_in`    | `string[]` | Version strings where the vulnerability is patched        |
| `withdrawn`   | `string \| null` | ISO date if the advisory was later withdrawn         |

---

### `src/domain/Version.ts`

Models the response from `GET /pypi/{name}/{version}/json`.

| Field            | Type                   | Description                                              |
| ---------------- | ---------------------- | -------------------------------------------------------- |
| `info`           | `PyPIProjectInfo`      | Metadata for this specific version                       |
| `last_serial`    | `number`               | PyPI serial number                                       |
| `urls`           | `PyPIFile[]`           | Distribution files for this version                      |
| `vulnerabilities` | `PyPIVulnerability[]` | Vulnerabilities affecting this specific version          |

---

### `src/domain/Downloads.ts`

Models the responses from `pypistats.org`.

#### `PyPIRecentDownloads` (`/recent`)

| Field         | Type                                                | Description                              |
| ------------- | --------------------------------------------------- | ---------------------------------------- |
| `data`        | `{ last_day: number; last_week: number; last_month: number }` | Download totals by period    |
| `package`     | `string`                                            | Package name                             |
| `type`        | `'recent_downloads'`                                | Response type discriminator              |

#### `PyPIDownloadRow` (shared shape for all breakdown endpoints)

| Field        | Type     | Description                                            |
| ------------ | -------- | ------------------------------------------------------ |
| `category`   | `string` | Category label (Python version, OS name, mirror flag)  |
| `date`       | `string` | Date string (`YYYY-MM-DD`)                             |
| `downloads`  | `number` | Download count for this category on this date          |

#### `PyPIBreakdownDownloads` (shared envelope for breakdown responses)

| Field     | Type                  | Description                                     |
| --------- | --------------------- | ----------------------------------------------- |
| `data`    | `PyPIDownloadRow[]`   | Array of download rows by category and date     |
| `package` | `string`              | Package name                                    |
| `type`    | `string`              | Response type (e.g. `'python_major_downloads'`) |

#### `PyPIDownloadParams` (shared query params for breakdown endpoints)

| Param          | Type     | Description                                          |
| -------------- | -------- | ---------------------------------------------------- |
| `start_date?`  | `string` | Start date in `YYYY-MM-DD` format                    |
| `end_date?`    | `string` | End date in `YYYY-MM-DD` format                      |

---

### `src/domain/DepsDev.ts`

Models the response from `GET /systems/pypi/packages/{name}/versions/{version}:dependencies`.

#### `PyPIDepsDevDependencies`

| Field   | Type                    | Description                                           |
| ------- | ----------------------- | ----------------------------------------------------- |
| `nodes` | `PyPIDepsDevNode[]`     | All packages in the resolved dependency graph         |
| `edges` | `PyPIDepsDevEdge[]`     | Directed edges encoding who depends on whom           |
| `error` | `string \| undefined`   | Set if the graph could not be fully resolved          |

#### `PyPIDepsDevNode`

| Field        | Type                                    | Description                                         |
| ------------ | --------------------------------------- | --------------------------------------------------- |
| `versionKey` | `{ system: string; name: string; version: string }` | Resolved package + version         |
| `relation`   | `'SELF' \| 'DIRECT' \| 'INDIRECT'`     | Relationship to the root package                    |
| `bundled`    | `boolean`                               | Whether this dependency is bundled in the tarball   |
| `errors`     | `string[]`                              | Resolution errors (e.g. version not found)          |

#### `PyPIDepsDevEdge`

| Field         | Type     | Description                                                   |
| ------------- | -------- | ------------------------------------------------------------- |
| `fromNode`    | `number` | Index into `nodes` array (dependent)                         |
| `toNode`      | `number` | Index into `nodes` array (dependency)                        |
| `requirement` | `string` | Semver-like requirement string that produced this edge        |

---

## `src/errors/PyPIApiError.ts`

Custom error class extending `Error`.

| Property     | Type     | Description                              |
| ------------ | -------- | ---------------------------------------- |
| `statusCode` | `number` | HTTP status code returned by the server  |
| `statusText` | `string` | HTTP status text                         |

---

## `src/index.ts` — Public exports

| Export                   | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `PyPIClient`             | Main entry point class                             |
| `PyPIClientOptions`      | Constructor options interface                      |
| `PyPIClientEvents`       | Event map interface                                |
| `RequestEvent`           | Payload shape emitted on every HTTP request        |
| `PackageResource`        | Package resource class                             |
| `VersionResource`        | Version resource class                             |
| `PyPIProject`            | Full project response type                         |
| `PyPIProjectInfo`        | Project info sub-type                              |
| `PyPIFile`               | Distribution file type                             |
| `PyPIVulnerability`      | Vulnerability type                                 |
| `PyPIVersionInfo`        | Version-specific response type                     |
| `PyPIRecentDownloads`    | Recent downloads response type                     |
| `PyPIBreakdownDownloads` | Breakdown downloads response type                  |
| `PyPIDownloadRow`        | Single download row type                           |
| `PyPIDownloadParams`     | Shared query params for download breakdown         |
| `PyPIDepsDevDependencies` | deps.dev dependency graph type                    |
| `PyPIDepsDevNode`        | Dependency graph node type                         |
| `PyPIDepsDevEdge`        | Dependency graph edge type                         |
| `PyPIApiError`           | Custom error class                                 |

---

## File structure

```
src/
├── PyPIClient.ts               ← Entry point, RequestEvent, PyPIClientOptions
├── index.ts                    ← Re-exports all public types and classes
├── domain/
│   ├── Project.ts              ← PyPIProject, PyPIProjectInfo, PyPIFile, PyPIVulnerability
│   ├── Version.ts              ← PyPIVersionInfo
│   ├── Downloads.ts            ← PyPIRecentDownloads, PyPIBreakdownDownloads, PyPIDownloadRow, PyPIDownloadParams
│   └── DepsDev.ts              ← PyPIDepsDevDependencies, PyPIDepsDevNode, PyPIDepsDevEdge
├── errors/
│   └── PyPIApiError.ts         ← Custom error class with statusCode + statusText
└── resources/
    ├── PackageResource.ts      ← Implements PromiseLike<PyPIProject>
    ├── VersionResource.ts      ← Implements PromiseLike<PyPIVersionInfo>
    └── types.ts                ← Shared RequestFn type
```

---

## Usage examples

```typescript
import { PyPIClient } from 'pip-api-client';

const pip = new PyPIClient();

// Get full project metadata (latest version)
const project = await pip.package('requests');

// Get the info block only
const info = await pip.package('requests').info();
console.log(info.requires_python); // '>=3.7'

// Get the latest version as a VersionResource
const latest = await pip.package('requests').version('2.31.0');

// Get distribution files for a specific version
const files = await pip.package('requests').version('2.31.0').files();
files.forEach(f => console.log(f.filename, f.size, f.packagetype));

// List all published versions (sorted oldest → newest)
const versions = await pip.package('requests').versions();

// Check for known vulnerabilities on the latest version
const vulns = await pip.package('requests').vulnerabilities();

// Download counts: last day / week / month
const recent = await pip.package('requests').downloads();
console.log(recent.data.last_week);

// Downloads broken down by Python minor version
const byPython = await pip.package('requests').downloadsByPythonMinor();

// Downloads broken down by operating system
const byOS = await pip.package('requests').downloadsBySystem({ start_date: '2025-01-01' });

// Fully resolved dependency graph for a specific version
const deps = await pip.package('requests').version('2.31.0').dependencies();
const direct = deps.nodes.filter(n => n.relation === 'DIRECT');

// Observe every HTTP request (logging, metrics)
pip.on('request', event => {
  console.log(`${event.method} ${event.url} — ${event.durationMs}ms [${event.statusCode}]`);
  if (event.error) console.error('Failed:', event.error);
});
```

---

## Data source rationale

### 1. PyPI JSON API — `pypi.org/pypi/{project}[/{version}]/json`

The primary source. Returns complete project metadata including all published versions, distribution files, classifiers, dependency specifiers, vulnerability reports, and license information in a single JSON response. No authentication required.

Unique data it provides:
- `releases` map: every version ever published with its distribution files
- `vulnerabilities`: PyPI-integrated security advisories (sourced from OSV) per version
- `classifiers`: Trove classifiers encoding Python version compatibility, development status, license, topic, and intended audience — no other source has these
- `requires_dist`: PEP 508 dependency specifiers with optional extras and environment markers
- `requires_python`: Python version constraint checked at install time
- `yanked` / `yanked_reason`: per-file and per-release yanked status — critical for safe version selection
- `digests`: SHA-256 and MD5 hashes for every distribution file — used to verify integrity before installation

### 2. pypistats.org — Download statistics

**Why add it:** The PyPI JSON API contains no download statistics whatsoever. pypistats.org is the canonical public source for PyPI download data, maintained by the Python Packaging Authority (PyPA). It queries the PyPI BigQuery dataset.

| Endpoint              | Unique data                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| `/recent`             | Last-day, last-week, and last-month totals in a single request — fastest summary |
| `/python_major`       | Downloads split by Python 2 vs Python 3 — reveals legacy adoption               |
| `/python_minor`       | Downloads split by Python 3.8, 3.9, 3.10 … — reveals which runtime versions are in active use |
| `/system`             | Downloads split by Linux / Windows / macOS — reveals deployment target           |
| `/overall`            | Downloads with and without mirrors — mirrors inflate counts; without-mirrors figure is more accurate |

All breakdown endpoints return per-day rows, optionally filtered with `start_date` / `end_date`.

### 3. deps.dev — Resolved dependency graph

**Why add it:** `requires_dist` in the PyPI JSON API lists runtime dependency specifiers as PEP 508 version ranges (e.g. `urllib3>=1.21.1,<3`). That tells us the constraint, not what version actually resolves in practice, and gives no visibility into transitive dependencies. deps.dev (maintained by Google) resolves the full dependency graph to concrete versions.

Unique data it provides:
- Exact resolved version for every direct and transitive dependency
- `relation` field (`DIRECT` / `INDIRECT` / `SELF`) classifying each node
- Graph edges encoding the full dependency tree topology
- `errors` array per node for packages with broken or irresolvable versions
- `bundled` flag for dependencies embedded inside the distribution file

---

## Technical design

### `PyPIClient.request()` — internal routing

Uses a `key → baseUrl` map identical to `NpmClient`:

```typescript
const map: Record<string, string> = {
  api:     this.apiUrl,      // pypi.org
  stats:   this.statsApiUrl, // pypistats.org
  depsdev: this.depsDevUrl,  // api.deps.dev
};
```

No `Authorization` header is sent to any endpoint — the PyPI JSON API and pypistats.org are fully public.

### RequestFn shape (shared across resources)

```typescript
type RequestFn = <T>(
  path: string,
  params?: Record<string, string | number | boolean>,
  baseUrl?: string,
  signal?: AbortSignal,
) => Promise<T>;
```

This is the same contract used in `npmjs-api-client`. Resources receive this function via constructor injection — they never hold a reference to `PyPIClient`.

### PromiseLike resources

`PackageResource` and `VersionResource` both implement `PromiseLike<T>` via a `then()` method that delegates to `.get()`. This allows:

```typescript
const project = await pip.package('requests');        // awaited directly
const info    = await pip.package('requests').info(); // chained method
```

Both forms work without any special async resource machinery.

### Event emitter

Identical pattern to `NpmClient`. `PyPIClient` maintains a `Map<keyof PyPIClientEvents, Callback[]>` internally. Events are emitted after every HTTP response (success or error) with `url`, `method`, `startedAt`, `finishedAt`, `durationMs`, `statusCode?`, and `error?`.

---

## Build & tooling

| Tool           | Purpose                                         |
| -------------- | ----------------------------------------------- |
| TypeScript     | Source language                                 |
| Vite / tsup    | Dual CJS + ESM bundle with `.d.ts` declarations |
| Vitest         | Unit and integration tests                      |
| semantic-release | Automated versioning and changelog            |
| `.releaserc.json` | Release configuration                        |
| `.npmignore`   | Exclude `src/`, tests, and config from publish  |

---

## Compatibility

All additions are **additive**. No existing behavior changes. The client ships zero runtime dependencies — it uses the native `fetch` API available in Node.js 18+ and all modern browsers.
