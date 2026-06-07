export interface PyPIRecentDownloadsData {
  last_day: number;
  last_week: number;
  last_month: number;
}

export interface PyPIRecentDownloads {
  data: PyPIRecentDownloadsData;
  package: string;
  type: 'recent_downloads';
}

export interface PyPIDownloadRow {
  category: string;
  date: string;
  downloads: number;
}

export interface PyPIBreakdownDownloads {
  data: PyPIDownloadRow[];
  package: string;
  type: string;
}

export interface PyPIDownloadParams {
  start_date?: string;
  end_date?: string;
}
