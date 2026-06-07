/**
 * Thrown when the PyPI API returns a non-2xx response.
 *
 * @example
 * ```typescript
 * import { PyPIApiError } from 'pypi-api-client';
 *
 * try {
 *   await pip.package('nonexistent-pkg').get();
 * } catch (err) {
 *   if (err instanceof PyPIApiError) {
 *     console.log(err.status);     // 404
 *     console.log(err.statusText); // 'Not Found'
 *     console.log(err.message);    // 'PyPI API error: 404 Not Found'
 *   }
 * }
 * ```
 */
export class PyPIApiError extends Error {
  /** HTTP status code (e.g. `404`, `401`, `403`) */
  readonly status: number;
  /** HTTP status text (e.g. `'Not Found'`, `'Unauthorized'`) */
  readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`PyPI API error: ${status} ${statusText}`);
    this.name = 'PyPIApiError';
    this.status = status;
    this.statusText = statusText;
  }
}
