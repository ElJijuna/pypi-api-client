import type { PyPIProjectInfo, PyPIFile, PyPIVulnerability } from './Project';

export interface PyPIVersionInfo {
  info: PyPIProjectInfo;
  last_serial: number;
  urls: PyPIFile[];
  vulnerabilities: PyPIVulnerability[];
}
