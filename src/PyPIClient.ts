import { PyPIApiError } from './errors/PyPIApiError';
import { PackageResource } from './resources/PackageResource';

const DEFAULT_API_URL = 'https://pypi.org';
const DEFAULT_STATS_URL = 'https://pypistats.org';
const DEFAULT_DEPS_DEV_URL = 'https://api.deps.dev/v3';

/**
 * Payload emitted on every HTTP request made by {@link PyPIClient}.
 */
export interface RequestEvent {
  /** Full URL that was requested */
  url: string;
  /** HTTP method used */
  method: 'GET';
  /** Timestamp when the request started */
  startedAt: Date;
  /** Timestamp when the request finished (success or error) */
  finishedAt: Date;
  /** Total duration in milliseconds */
  durationMs: number;
  /** HTTP status code returned by the server, if a response was received */
  statusCode?: number;
  /** Error thrown, if the request failed */
  error?: Error;
}

/** Map of supported client events to their callback signatures */
export interface PyPIClientEvents {
  request: (event: RequestEvent) => void;
}

/**
 * Constructor options for {@link PyPIClient}.
 */
export interface PyPIClientOptions {
  /**
   * Base URL for the PyPI JSON API (default: `'https://pypi.org'`).
   * Override for mirrors or private indices.
   */
  apiUrl?: string;
  /**
   * Base URL for the pypistats.org download stats API (default: `'https://pypistats.org'`).
   */
  statsApiUrl?: string;
  /**
   * Base URL for the deps.dev dependency graph API (default: `'https://api.deps.dev/v3'`).
   */
  depsDevUrl?: string;
}

/**
 * Main entry point for the PyPI REST API client.
 *
 * @example
 * ```typescript
 * import { PyPIClient } from 'pypi-api-client';
 *
 * const pip = new PyPIClient();
 *
 * // Full project metadata
 * const project = await pip.package('requests');
 *
 * // Specific version
 * const v = await pip.package('requests').version('2.31.0');
 *
 * // Latest version files
 * const files = await pip.package('requests').latest().files();
 *
 * // Download stats
 * const stats = await pip.package('requests').downloads();
 *
 * // Observe every request
 * pip.on('request', event => {
 *   console.log(`${event.method} ${event.url} — ${event.durationMs}ms`);
 * });
 * ```
 */
export class PyPIClient {
  private readonly apiUrl: string;
  private readonly statsApiUrl: string;
  private readonly depsDevUrl: string;
  private readonly listeners: Map<
    keyof PyPIClientEvents,
    PyPIClientEvents[keyof PyPIClientEvents][]
  > = new Map();

  constructor(options: PyPIClientOptions = {}) {
    this.apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '');
    this.statsApiUrl = (options.statsApiUrl ?? DEFAULT_STATS_URL).replace(/\/$/, '');
    this.depsDevUrl = (options.depsDevUrl ?? DEFAULT_DEPS_DEV_URL).replace(/\/$/, '');
  }

  /**
   * Subscribes to a client event.
   *
   * @example
   * ```typescript
   * pip.on('request', (event) => {
   *   console.log(`${event.method} ${event.url} — ${event.durationMs}ms`);
   *   if (event.error) console.error('Request failed:', event.error);
   * });
   * ```
   */
  on<K extends keyof PyPIClientEvents>(event: K, callback: PyPIClientEvents[K]): this {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
    return this;
  }

  private emit<K extends keyof PyPIClientEvents>(
    event: K,
    payload: Parameters<PyPIClientEvents[K]>[0],
  ): void {
    const callbacks = this.listeners.get(event) ?? [];
    for (const cb of callbacks) {
      (cb as (p: typeof payload) => void)(payload);
    }
  }

  private resolveBaseUrl(key: string): string {
    const map: Record<string, string> = {
      api: this.apiUrl,
      stats: this.statsApiUrl,
      depsdev: this.depsDevUrl,
    };
    return map[key] ?? this.apiUrl;
  }

  /** @internal */
  private async request<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
    baseUrl = 'api',
    signal?: AbortSignal,
  ): Promise<T> {
    const base = this.resolveBaseUrl(baseUrl);
    const url = buildUrl(`${base}${path}`, params);
    const startedAt = new Date();
    let statusCode: number | undefined;
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal,
      });
      statusCode = response.status;
      if (!response.ok) {
        throw new PyPIApiError(response.status, response.statusText);
      }
      const data = (await response.json()) as T;
      this.emit('request', {
        url,
        method: 'GET',
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        statusCode,
      });
      return data;
    } catch (err) {
      const finishedAt = new Date();
      this.emit('request', {
        url,
        method: 'GET',
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        statusCode,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Returns a {@link PackageResource} for a given project name, providing
   * access to project metadata, versions, distribution files, and download stats.
   *
   * The returned resource can be awaited directly to fetch the full project,
   * or chained to access nested resources.
   *
   * @param name - The project name (e.g. `'requests'`, `'numpy'`)
   * @returns A chainable package resource
   *
   * @example
   * ```typescript
   * const project = await pip.package('requests');
   * const info    = await pip.package('requests').info();
   * const v       = await pip.package('requests').version('2.31.0');
   * const files   = await pip.package('requests').latest().files();
   * ```
   */
  package(name: string): PackageResource {
    return new PackageResource(
      <T>(
        path: string,
        params?: Record<string, string | number | boolean>,
        baseUrl?: string,
        signal?: AbortSignal,
      ) => this.request<T>(path, params, baseUrl ?? 'api', signal),
      name,
    );
  }
}

/**
 * Appends query parameters to a URL string, skipping `undefined` values.
 * @internal
 */
function buildUrl(base: string, params?: Record<string, string | number | boolean>): string {
  if (!params) {
    return base;
  }
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    return base;
  }
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `${base}?${search.toString()}`;
}
