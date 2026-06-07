import type { PyPIProject, PyPIProjectInfo, PyPIFile, PyPIVulnerability } from '../domain/Project';
import type {
  PyPIRecentDownloads,
  PyPIBreakdownDownloads,
  PyPIDownloadParams,
} from '../domain/Downloads';
import { VersionResource, type RequestFn } from './VersionResource';

/**
 * Represents a PyPI project, providing access to metadata, versions,
 * distribution files, download statistics, and vulnerability data.
 *
 * Implements `PromiseLike<PyPIProject>` so it can be awaited directly
 * to fetch the full project, while also exposing sub-resource methods.
 *
 * @example
 * ```typescript
 * // Await directly to get full project metadata
 * const project = await pip.package('requests');
 *
 * // Get the info block
 * const info = await pip.package('requests').info();
 *
 * // Get a specific version
 * const v = await pip.package('requests').version('2.31.0');
 *
 * // Get download stats
 * const stats = await pip.package('requests').downloads();
 * ```
 */
export class PackageResource implements PromiseLike<PyPIProject> {
  /** @internal */
  constructor(
    private readonly request: RequestFn,
    private readonly name: string,
  ) {}

  then<TResult1 = PyPIProject, TResult2 = never>(
    onfulfilled?: ((value: PyPIProject) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.get().then(onfulfilled, onrejected);
  }

  /**
   * Fetches full project metadata including all releases.
   *
   * `GET /pypi/{name}/json`
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async get(signal?: AbortSignal): Promise<PyPIProject> {
    return this.request<PyPIProject>(
      `/pypi/${encodeURIComponent(this.name)}/json`,
      undefined,
      'api',
      signal,
    );
  }

  /**
   * Fetches only the `info` block for the latest version of this package.
   *
   * `GET /pypi/{name}/json` → extracts `info`
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async info(signal?: AbortSignal): Promise<PyPIProjectInfo> {
    const project = await this.get(signal);
    return project.info;
  }

  /**
   * Returns a {@link VersionResource} for a specific version.
   *
   * @param ver - Version string (e.g. `'2.31.0'`)
   */
  version(ver: string): VersionResource {
    return new VersionResource(this.request, this.name, ver);
  }

  /**
   * Returns a {@link VersionResource} for the latest published version.
   *
   * When awaited, fetches `GET /pypi/{name}/json` and returns the
   * latest version data (from the `info` and `urls` fields).
   */
  latest(): VersionResource {
    return new VersionResource(this.request, this.name, undefined);
  }

  /**
   * Returns all version strings published for this package.
   *
   * `GET /pypi/{name}/json` → extracts `Object.keys(releases)`
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async versions(signal?: AbortSignal): Promise<string[]> {
    const project = await this.get(signal);
    return Object.keys(project.releases);
  }

  /**
   * Returns the full `releases` map: version string → distribution files.
   *
   * `GET /pypi/{name}/json` → extracts `releases`
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async releases(signal?: AbortSignal): Promise<Record<string, PyPIFile[]>> {
    const project = await this.get(signal);
    return project.releases;
  }

  /**
   * Returns known vulnerabilities for the latest version from PyPI's advisory database.
   *
   * `GET /pypi/{name}/json` → extracts `vulnerabilities`
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async vulnerabilities(signal?: AbortSignal): Promise<PyPIVulnerability[]> {
    const project = await this.get(signal);
    return project.vulnerabilities;
  }

  /**
   * Fetches download totals for the last day, week, and month from pypistats.org.
   *
   * `GET /api/packages/{name}/recent` (via pypistats.org)
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   *
   * @example
   * ```typescript
   * const stats = await pip.package('requests').downloads();
   * console.log(stats.data.last_week); // 8638
   * ```
   */
  async downloads(signal?: AbortSignal): Promise<PyPIRecentDownloads> {
    return this.request<PyPIRecentDownloads>(
      `/api/packages/${encodeURIComponent(this.name)}/recent`,
      undefined,
      'stats',
      signal,
    );
  }

  /**
   * Fetches per-day downloads broken down by Python major version (2 vs 3).
   *
   * `GET /api/packages/{name}/python_major` (via pypistats.org)
   *
   * @param params - Optional `start_date` / `end_date` filters (`YYYY-MM-DD`)
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async downloadsByPythonMajor(
    params?: PyPIDownloadParams,
    signal?: AbortSignal,
  ): Promise<PyPIBreakdownDownloads> {
    return this.request<PyPIBreakdownDownloads>(
      `/api/packages/${encodeURIComponent(this.name)}/python_major`,
      params as Record<string, string>,
      'stats',
      signal,
    );
  }

  /**
   * Fetches per-day downloads broken down by Python minor version (3.10, 3.11, …).
   *
   * `GET /api/packages/{name}/python_minor` (via pypistats.org)
   *
   * @param params - Optional `start_date` / `end_date` filters (`YYYY-MM-DD`)
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async downloadsByPythonMinor(
    params?: PyPIDownloadParams,
    signal?: AbortSignal,
  ): Promise<PyPIBreakdownDownloads> {
    return this.request<PyPIBreakdownDownloads>(
      `/api/packages/${encodeURIComponent(this.name)}/python_minor`,
      params as Record<string, string>,
      'stats',
      signal,
    );
  }

  /**
   * Fetches per-day downloads broken down by operating system (Linux, Windows, macOS).
   *
   * `GET /api/packages/{name}/system` (via pypistats.org)
   *
   * @param params - Optional `start_date` / `end_date` filters (`YYYY-MM-DD`)
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async downloadsBySystem(
    params?: PyPIDownloadParams,
    signal?: AbortSignal,
  ): Promise<PyPIBreakdownDownloads> {
    return this.request<PyPIBreakdownDownloads>(
      `/api/packages/${encodeURIComponent(this.name)}/system`,
      params as Record<string, string>,
      'stats',
      signal,
    );
  }

  /**
   * Fetches per-day downloads split by mirror vs non-mirror traffic.
   *
   * `GET /api/packages/{name}/overall` (via pypistats.org)
   *
   * @param params - Optional `start_date` / `end_date` filters (`YYYY-MM-DD`)
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async downloadsByMirrors(
    params?: PyPIDownloadParams,
    signal?: AbortSignal,
  ): Promise<PyPIBreakdownDownloads> {
    return this.request<PyPIBreakdownDownloads>(
      `/api/packages/${encodeURIComponent(this.name)}/overall`,
      params as Record<string, string>,
      'stats',
      signal,
    );
  }
}
