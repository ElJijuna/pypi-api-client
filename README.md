# pypi-api-client

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/6/64/PyPI_logo.svg" alt="PyPI logo" width="140" />
</p>

[![CI](https://github.com/ElJijuna/pypi-api-client/actions/workflows/ci.yml/badge.svg)](https://github.com/ElJijuna/pypi-api-client/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/pypi-api-client)](https://www.npmjs.com/package/pypi-api-client)
[![npm downloads/week](https://img.shields.io/npm/dw/pypi-api-client)](https://www.npmjs.com/package/pypi-api-client)
[![npm downloads/month](https://img.shields.io/npm/dm/pypi-api-client)](https://www.npmjs.com/package/pypi-api-client)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/pypi-api-client)](https://bundlephobia.com/package/pypi-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/node/v/pypi-api-client)](https://nodejs.org/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://semver.org)

TypeScript client for the Python Package Index. Aggregates data from multiple sources into a single, chainable API — project metadata, all published versions, distribution files, download statistics, vulnerability reports, and resolved dependency graphs. Works in **Node.js** and the **browser** (isomorphic). Fully typed, zero runtime dependencies.

**Data sources integrated:**

| Source | What it provides |
| --- | --- |
| [pypi.org](https://pypi.org) | Project metadata, all versions, distribution files, classifiers, vulnerability reports |
| [pypistats.org](https://pypistats.org) | Download counts by period, Python version, and operating system |
| [api.deps.dev/v3](https://deps.dev) | Fully resolved dependency graph with exact versions, direct and transitive classification |

---

## Installation

```bash
npm install pypi-api-client
```

---

## Quick start

```typescript
import { PyPIClient } from 'pypi-api-client';

// Public APIs — no auth required
const pip = new PyPIClient();

// Custom base URLs (e.g. mirrors, proxies)
const custom = new PyPIClient({
  apiUrl:      'https://my-pypi-mirror.example.com',
  statsApiUrl: 'https://my-stats-proxy.example.com',
  depsDevUrl:  'https://api.deps.dev/v3',
});
```

---

## API reference

### Project metadata

```typescript
// Full project — all versions, classifiers, dependencies, vulnerability reports
const project = await pip.package('requests');
const project = await pip.package('requests').get(); // same

// Info block only (latest version metadata)
const info = await pip.package('requests').info();
console.log(info.name);             // 'requests'
console.log(info.version);          // '2.31.0'
console.log(info.requires_python);  // '>=3.7'
console.log(info.license);          // 'Apache 2.0'
console.log(info.classifiers);      // ['Programming Language :: Python :: 3', ...]
console.log(info.requires_dist);    // ['urllib3>=1.21.1,<3', 'certifi>=2017.4.17', ...]
console.log(info.project_urls);     // { Homepage: '...', Source: '...', Documentation: '...' }

// All version strings (order matches PyPI insertion order)
const versions = await pip.package('requests').versions();
console.log(versions); // ['2.0.0', '2.1.0', ..., '2.31.0']

// Full releases map — version → distribution files
const releases = await pip.package('requests').releases();
console.log(Object.keys(releases).length); // number of published versions
```

### Version metadata

```typescript
// Specific version
const info = await pip.package('requests').version('2.31.0');
const info = await pip.package('requests').version('2.31.0').get(); // same

// Latest published version
const latest = await pip.package('requests').latest();
const latest = await pip.package('requests').latest().get(); // same

console.log(info.info.version);          // '2.31.0'
console.log(info.info.requires_python);  // '>=3.7'
console.log(info.last_serial);           // PyPI event serial
```

### Distribution files

```typescript
// Files included in a specific version (wheels, sdists)
const files = await pip.package('requests').version('2.31.0').files();

files.forEach(f => {
  console.log(f.filename);              // 'requests-2.31.0-py3-none-any.whl'
  console.log(f.packagetype);           // 'bdist_wheel' | 'sdist'
  console.log(f.size);                  // file size in bytes
  console.log(f.python_version);        // 'py3' | 'cp311' | 'source'
  console.log(f.requires_python);       // '>=3.7'
  console.log(f.digests.sha256);        // SHA-256 integrity hash
  console.log(f.upload_time_iso_8601);  // '2023-05-22T15:00:00Z'
  console.log(f.yanked);                // false
});

// Filter to wheels only
const wheels = files.filter(f => f.packagetype === 'bdist_wheel');

// Filter to source distributions
const sdists = files.filter(f => f.packagetype === 'sdist');

// Latest version files
const latestFiles = await pip.package('requests').latest().files();
```

### Vulnerabilities

```typescript
// Known vulnerabilities for the latest version
const vulns = await pip.package('requests').vulnerabilities();

// Known vulnerabilities for a specific version
const vulns = await pip.package('requests').version('2.28.0').vulnerabilities();

vulns.forEach(v => {
  console.log(v.id);        // 'GHSA-j8r2-6x86-q33q'
  console.log(v.aliases);   // ['CVE-2023-32681']
  console.log(v.summary);   // 'Unintended leak of Proxy-Authorization header'
  console.log(v.details);   // full description
  console.log(v.fixed_in);  // ['2.31.0']
  console.log(v.link);      // advisory URL
  console.log(v.source);    // 'osv'
});

// Check if a version is affected
if (vulns.length > 0) {
  const fixedIn = vulns.flatMap(v => v.fixed_in);
  console.log('Upgrade to:', fixedIn);
}
```

### Download statistics

```typescript
// Last day, week, and month totals in a single request
const stats = await pip.package('requests').downloads();

console.log(stats.data.last_day);    // 1234
console.log(stats.data.last_week);   // 8638
console.log(stats.data.last_month);  // 35274

// Downloads by Python major version (2 vs 3)
const byMajor = await pip.package('requests').downloadsByPythonMajor();
byMajor.data.forEach(row => {
  console.log(`Python ${row.category}: ${row.downloads} on ${row.date}`);
});

// Downloads by Python minor version (3.8, 3.9, 3.10, 3.11, …)
const byMinor = await pip.package('requests').downloadsByPythonMinor();
byMinor.data.forEach(row => {
  console.log(`Python ${row.category}: ${row.downloads} on ${row.date}`);
});

// Downloads by operating system
const byOS = await pip.package('requests').downloadsBySystem();
byOS.data.forEach(row => {
  console.log(`${row.category}: ${row.downloads} on ${row.date}`);
  // 'Linux' | 'Windows' | 'Darwin' | 'null'
});

// Downloads with and without mirror traffic
const byMirrors = await pip.package('requests').downloadsByMirrors();
byMirrors.data.forEach(row => {
  console.log(`${row.category}: ${row.downloads} on ${row.date}`);
  // 'with_mirrors' | 'without_mirrors'
});

// All breakdown endpoints accept optional date filters
const filtered = await pip.package('requests').downloadsByPythonMinor({
  start_date: '2024-01-01',
  end_date:   '2024-01-31',
});
```

### Resolved dependency graph — deps.dev

Returns exact resolved versions for every dependency in the tree — not the semver ranges from `requires_dist`, but what actually installs.

```typescript
const deps = await pip.package('requests').version('2.31.0').dependencies();

// All nodes in the graph
deps.nodes.forEach(n => {
  console.log(`${n.relation}: ${n.versionKey.name}@${n.versionKey.version}`);
  // 'SELF':     requests@2.31.0
  // 'DIRECT':   urllib3@2.0.4
  // 'DIRECT':   certifi@2023.7.22
  // 'INDIRECT': ...
});

// Direct dependencies only
const direct = deps.nodes.filter(n => n.relation === 'DIRECT');

// Transitive dependencies only
const transitive = deps.nodes.filter(n => n.relation === 'INDIRECT');

// Bundled dependencies (embedded in the distribution file)
const bundled = deps.nodes.filter(n => n.bundled);

// Resolution errors (broken or unresolvable versions)
const broken = deps.nodes.filter(n => n.errors.length > 0);

// Graph edges — who requires whom and with what constraint
deps.edges.forEach(e => {
  const from = deps.nodes[e.fromNode].versionKey.name;
  const to   = deps.nodes[e.toNode].versionKey.name;
  console.log(`${from} → ${to} (${e.requirement})`);
});

// Latest version dependency graph (auto-resolves current version)
const latestDeps = await pip.package('requests').latest().dependencies();
```

---

## Chainable resource pattern

Package resources implement `PromiseLike`, so you can **await them directly** or **chain methods**:

```typescript
// Await directly → fetches the full project
const project = await pip.package('requests');

// Chain → fetches a specific version
const v = await pip.package('requests').version('2.31.0');

// Chain → latest version
const latest = await pip.package('requests').latest();
```

---

## Cancelling requests

Pass an `AbortSignal` to any method to cancel the in-flight request:

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 3000);

await pip.package('requests').get(controller.signal);
await pip.package('requests').info(controller.signal);
await pip.package('requests').versions(controller.signal);
await pip.package('requests').vulnerabilities(controller.signal);
await pip.package('requests').downloads(controller.signal);
await pip.package('requests').downloadsByPythonMinor({}, controller.signal);
await pip.package('requests').version('2.31.0').get(controller.signal);
await pip.package('requests').version('2.31.0').files(controller.signal);
await pip.package('requests').version('2.31.0').dependencies(controller.signal);
```

When aborted, `fetch` throws a `DOMException` with `name === 'AbortError'`. The `request` event is still emitted with the error attached.

---

## Request events

Subscribe to every HTTP request for logging, monitoring, or debugging:

```typescript
pip.on('request', (event) => {
  console.log(`[${event.method}] ${event.url} → ${event.statusCode} (${event.durationMs}ms)`);
  if (event.error) {
    console.error('Request failed:', event.error.message);
  }
});
```

| Field | Type | Description |
| --- | --- | --- |
| `url` | `string` | Full URL that was requested |
| `method` | `'GET'` | HTTP method used |
| `startedAt` | `Date` | When the request started |
| `finishedAt` | `Date` | When the request finished |
| `durationMs` | `number` | Duration in milliseconds |
| `statusCode` | `number \| undefined` | HTTP status code, if a response was received |
| `error` | `Error \| undefined` | Present only if the request failed |

Multiple listeners can be registered. The event is always emitted after the request completes, whether it succeeded or failed. Events are emitted for all data sources — PyPI API, pypistats.org, and deps.dev.

The `on()` method is chainable:

```typescript
pip
  .on('request', logHandler)
  .on('request', metricsHandler);
```

---

## Error handling

Non-2xx responses throw a `PyPIApiError` with the HTTP status code and status text:

```typescript
import { PyPIApiError } from 'pypi-api-client';

try {
  await pip.package('nonexistent-xyz').get();
} catch (err) {
  if (err instanceof PyPIApiError) {
    console.log(err.status);     // 404
    console.log(err.statusText); // 'Not Found'
    console.log(err.message);    // 'PyPI API error: 404 Not Found'
  }
}
```

---

## TypeScript types

All domain types are exported:

```typescript
import type {
  // Client
  PyPIClientOptions, RequestEvent, PyPIClientEvents,

  // Project
  PyPIProject, PyPIProjectInfo, PyPIFile, PyPIVulnerability,

  // Version
  PyPIVersionInfo,

  // Downloads
  PyPIRecentDownloads, PyPIRecentDownloadsData,
  PyPIBreakdownDownloads, PyPIDownloadRow, PyPIDownloadParams,

  // deps.dev
  PyPIDepsDevDependencies, PyPIDepsDevNode, PyPIDepsDevEdge, PyPIDepsDevVersionKey,
} from 'pypi-api-client';
```

---

## Documentation

Full API documentation is published at:
**[https://eljijuna.github.io/pypi-api-client](https://eljijuna.github.io/pypi-api-client)**

---

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md).

---

## License

[MIT](LICENSE)
