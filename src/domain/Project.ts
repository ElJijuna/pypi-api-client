export interface PyPIFile {
  filename: string;
  url: string;
  size: number;
  digests: { md5: string; sha256: string };
  packagetype: 'sdist' | 'bdist_wheel';
  python_version: string;
  requires_python: string | null;
  upload_time_iso_8601: string;
  yanked: boolean;
  yanked_reason: string | null;
}

export interface PyPIVulnerability {
  id: string;
  source: string;
  link: string;
  aliases: string[];
  details: string;
  summary: string;
  fixed_in: string[];
  withdrawn: string | null;
}

export interface PyPIProjectInfo {
  name: string;
  version: string;
  summary: string | null;
  description: string | null;
  description_content_type: string | null;
  author: string | null;
  author_email: string | null;
  maintainer: string | null;
  maintainer_email: string | null;
  license: string | null;
  license_expression: string | null;
  keywords: string | null;
  classifiers: string[];
  requires_dist: string[] | null;
  requires_python: string | null;
  home_page: string | null;
  project_url: string | null;
  project_urls: Record<string, string> | null;
  bugtrack_url: string | null;
  docs_url: string | null;
  download_url: string | null;
  yanked: boolean;
  yanked_reason: string | null;
}

export interface PyPIProject {
  info: PyPIProjectInfo;
  last_serial: number;
  releases: Record<string, PyPIFile[]>;
  urls: PyPIFile[];
  vulnerabilities: PyPIVulnerability[];
}
