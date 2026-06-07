/** A distribution file attached to a PyPI release (wheel or sdist). */
export interface PyPIFile {
  /** Distribution filename (e.g. `requests-2.31.0-py3-none-any.whl`) */
  filename: string;
  /** Direct download URL on `files.pythonhosted.org` */
  url: string;
  /** File size in bytes */
  size: number;
  /** Integrity digests for verification */
  digests: { md5: string; sha256: string };
  /** Distribution type: source archive or built wheel */
  packagetype: 'sdist' | 'bdist_wheel';
  /** Python tag (e.g. `'py3'`, `'cp311'`, `'source'`) */
  python_version: string;
  /** Python version constraint declared by the file, if any */
  requires_python: string | null;
  /** ISO 8601 upload timestamp */
  upload_time_iso_8601: string;
  /** Whether this file has been yanked from the index */
  yanked: boolean;
  /** Reason provided when the file was yanked, if any */
  yanked_reason: string | null;
}

/** A security vulnerability reported against a PyPI package version. */
export interface PyPIVulnerability {
  /** Unique advisory identifier (e.g. `'GHSA-j8r2-6x86-q33q'`) */
  id: string;
  /** Advisory database that reported this vulnerability (e.g. `'osv'`) */
  source: string;
  /** URL to the full advisory */
  link: string;
  /** Alternative identifiers such as CVE numbers */
  aliases: string[];
  /** Full vulnerability description */
  details: string;
  /** One-line summary of the vulnerability */
  summary: string;
  /** Version strings in which this vulnerability is fixed */
  fixed_in: string[];
  /** ISO 8601 timestamp when the advisory was withdrawn, or `null` */
  withdrawn: string | null;
}

/** Metadata block for the latest release of a PyPI project (`/pypi/{name}/json → info`). */
export interface PyPIProjectInfo {
  /** Normalised project name */
  name: string;
  /** Version string of the latest release */
  version: string;
  /** One-line project description */
  summary: string | null;
  /** Long-form description (may be Markdown or RST) */
  description: string | null;
  /** MIME type of the long description (e.g. `'text/markdown'`) */
  description_content_type: string | null;
  /** Primary author name */
  author: string | null;
  /** Primary author e-mail */
  author_email: string | null;
  /** Maintainer name */
  maintainer: string | null;
  /** Maintainer e-mail */
  maintainer_email: string | null;
  /** SPDX or free-text license string */
  license: string | null;
  /** SPDX expression (newer metadata field, may be absent) */
  license_expression: string | null;
  /** Comma-separated keyword tags */
  keywords: string | null;
  /** Trove classifiers (e.g. `'Programming Language :: Python :: 3'`) */
  classifiers: string[];
  /** PEP 508 dependency specifiers */
  requires_dist: string[] | null;
  /** Python version constraint (e.g. `'>=3.7'`) */
  requires_python: string | null;
  /** Project homepage URL */
  home_page: string | null;
  /** Legacy single project URL field */
  project_url: string | null;
  /** Named project URL map (e.g. `{ Homepage, Source, Documentation }`) */
  project_urls: Record<string, string> | null;
  /** Legacy bug tracker URL */
  bugtrack_url: string | null;
  /** Documentation URL registered on PyPI */
  docs_url: string | null;
  /** Download URL (legacy, rarely set) */
  download_url: string | null;
  /** Whether the latest release has been yanked */
  yanked: boolean;
  /** Reason the release was yanked, if applicable */
  yanked_reason: string | null;
}

/** Full response shape of `GET /pypi/{name}/json`. */
export interface PyPIProject {
  /** Metadata for the latest version */
  info: PyPIProjectInfo;
  /** Monotonically increasing PyPI event counter */
  last_serial: number;
  /** Map of version string → distribution files for all published versions */
  releases: Record<string, PyPIFile[]>;
  /** Distribution files for the latest version (same as the latest entry in `releases`) */
  urls: PyPIFile[];
  /** Known security vulnerabilities for the latest version */
  vulnerabilities: PyPIVulnerability[];
}
