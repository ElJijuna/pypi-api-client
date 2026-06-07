import type { PyPIProjectInfo, PyPIFile, PyPIVulnerability } from './Project';

/** Response shape of `GET /pypi/{name}/{version}/json`. */
export interface PyPIVersionInfo {
  /** Metadata for this specific version */
  info: PyPIProjectInfo;
  /** Monotonically increasing PyPI event counter */
  last_serial: number;
  /** Distribution files published for this version */
  urls: PyPIFile[];
  /** Known security vulnerabilities for this version */
  vulnerabilities: PyPIVulnerability[];
}
