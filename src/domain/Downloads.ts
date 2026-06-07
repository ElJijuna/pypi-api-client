/** Download totals returned by `GET /api/packages/{name}/recent` on pypistats.org. */
export interface PyPIRecentDownloadsData {
  /** Downloads in the last calendar day */
  last_day: number;
  /** Downloads in the last 7 days */
  last_week: number;
  /** Downloads in the last 30 days */
  last_month: number;
}

/** Full response shape of the pypistats.org recent-downloads endpoint. */
export interface PyPIRecentDownloads {
  /** Aggregated download counts */
  data: PyPIRecentDownloadsData;
  /** Package name as registered on PyPI */
  package: string;
  /** Discriminant type field */
  type: 'recent_downloads';
}

/** A single row in a pypistats.org breakdown response. */
export interface PyPIDownloadRow {
  /** Breakdown category (e.g. Python version `'3.11'`, OS `'Linux'`, mirror `'with_mirrors'`) */
  category: string;
  /** Date of this data point (`YYYY-MM-DD`) */
  date: string;
  /** Download count for this category on this date */
  downloads: number;
}

/** Full response shape of the pypistats.org per-category breakdown endpoints. */
export interface PyPIBreakdownDownloads {
  /** Per-category, per-day download rows */
  data: PyPIDownloadRow[];
  /** Package name as registered on PyPI */
  package: string;
  /** Discriminant type field (e.g. `'python_major_downloads'`) */
  type: string;
}

/** Optional date-range filter accepted by pypistats.org breakdown endpoints. */
export interface PyPIDownloadParams {
  /** Inclusive start date in `YYYY-MM-DD` format */
  start_date?: string;
  /** Inclusive end date in `YYYY-MM-DD` format */
  end_date?: string;
}
