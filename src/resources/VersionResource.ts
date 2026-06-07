import type { PyPIVersionInfo, PyPIVersionInfo as PyPILatestInfo } from '../domain/Version';
import type { PyPIFile, PyPIVulnerability } from '../domain/Project';
import type { PyPIDepsDevDependencies } from '../domain/DepsDev';
import type { RequestFn } from './types';

export type { RequestFn };

/**
 * Represents a specific version of a PyPI package.
 *
 * Implements `PromiseLike<PyPIVersionInfo>` so it can be awaited directly.
 *
 * @example
 * ```typescript
 * // Await directly to get version metadata
 * const info = await pip.package('requests').version('2.31.0');
 *
 * // Or call .get() explicitly
 * const info = await pip.package('requests').version('2.31.0').get();
 *
 * // Get distribution files
 * const files = await pip.package('requests').version('2.31.0').files();
 * ```
 */
export class VersionResource implements PromiseLike<PyPIVersionInfo> {
  /** @internal */
  constructor(
    private readonly request: RequestFn,
    private readonly packageName: string,
    private readonly ver: string | undefined,
  ) {}

  then<TResult1 = PyPIVersionInfo, TResult2 = never>(
    onfulfilled?: ((value: PyPIVersionInfo) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.get().then(onfulfilled, onrejected);
  }

  /**
   * Fetches metadata for this version.
   *
   * When created via `latest()`, fetches `GET /pypi/{name}/json` and returns
   * the latest version data. Otherwise fetches `GET /pypi/{name}/{version}/json`.
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async get(signal?: AbortSignal): Promise<PyPIVersionInfo> {
    if (this.ver === undefined) {
      return this.request<PyPILatestInfo>(
        `/pypi/${encodeURIComponent(this.packageName)}/json`,
        undefined,
        'api',
        signal,
      );
    }
    return this.request<PyPIVersionInfo>(
      `/pypi/${encodeURIComponent(this.packageName)}/${encodeURIComponent(this.ver)}/json`,
      undefined,
      'api',
      signal,
    );
  }

  /**
   * Returns the distribution files (wheels, sdists) for this version.
   *
   * `GET /pypi/{name}/{version}/json` → extracts `urls`
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async files(signal?: AbortSignal): Promise<PyPIFile[]> {
    const info = await this.get(signal);
    return info.urls;
  }

  /**
   * Returns known vulnerabilities for this version from PyPI's advisory database.
   *
   * `GET /pypi/{name}/{version}/json` → extracts `vulnerabilities`
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   */
  async vulnerabilities(signal?: AbortSignal): Promise<PyPIVulnerability[]> {
    const info = await this.get(signal);
    return info.vulnerabilities;
  }

  /**
   * Returns the fully resolved dependency graph for this version from deps.dev.
   *
   * Unlike `requires_dist` semver ranges, this returns exact resolved versions
   * for every direct and transitive dependency.
   *
   * `GET /systems/pypi/packages/{name}/versions/{version}:dependencies` (via api.deps.dev/v3)
   *
   * When called on `latest()`, first fetches the project to determine the current version.
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   *
   * @example
   * ```typescript
   * const deps = await pip.package('requests').version('2.31.0').dependencies();
   * const direct = deps.nodes.filter(n => n.relation === 'DIRECT');
   * ```
   */
  async dependencies(signal?: AbortSignal): Promise<PyPIDepsDevDependencies> {
    const ver = this.ver ?? (await this.get(signal)).info.version;
    return this.request<PyPIDepsDevDependencies>(
      `/systems/pypi/packages/${encodeURIComponent(this.packageName)}/versions/${encodeURIComponent(ver)}:dependencies`,
      undefined,
      'depsdev',
      signal,
    );
  }
}
