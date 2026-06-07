import { PyPIClient, PyPIApiError } from '../index';
import { VersionResource } from './VersionResource';
import type { PyPIProject } from '../domain/Project';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse<T>(data: T, status = 200): void {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Not Found',
    json: () => Promise.resolve(data),
  });
}

const MOCK_PROJECT: PyPIProject = {
  info: {
    name: 'requests',
    version: '2.31.0',
    summary: 'Python HTTP for Humans.',
    description: null,
    description_content_type: null,
    author: 'Kenneth Reitz',
    author_email: 'me@kennethreitz.org',
    maintainer: null,
    maintainer_email: null,
    license: 'Apache 2.0',
    license_expression: null,
    keywords: null,
    classifiers: ['Programming Language :: Python :: 3'],
    requires_dist: ['urllib3>=1.21.1,<3'],
    requires_python: '>=3.7',
    home_page: 'https://requests.readthedocs.io',
    project_url: null,
    project_urls: { Homepage: 'https://requests.readthedocs.io' },
    bugtrack_url: null,
    docs_url: null,
    download_url: null,
    yanked: false,
    yanked_reason: null,
  },
  last_serial: 99999,
  releases: {
    '2.28.0': [],
    '2.29.0': [],
    '2.31.0': [
      {
        filename: 'requests-2.31.0.tar.gz',
        url: 'https://files.pythonhosted.org/packages/requests-2.31.0.tar.gz',
        size: 110794,
        digests: { md5: 'abc123', sha256: 'def456' },
        packagetype: 'sdist',
        python_version: 'source',
        requires_python: '>=3.7',
        upload_time_iso_8601: '2023-05-22T15:00:00Z',
        yanked: false,
        yanked_reason: null,
      },
    ],
  },
  urls: [
    {
      filename: 'requests-2.31.0.tar.gz',
      url: 'https://files.pythonhosted.org/packages/requests-2.31.0.tar.gz',
      size: 110794,
      digests: { md5: 'abc123', sha256: 'def456' },
      packagetype: 'sdist',
      python_version: 'source',
      requires_python: '>=3.7',
      upload_time_iso_8601: '2023-05-22T15:00:00Z',
      yanked: false,
      yanked_reason: null,
    },
  ],
  vulnerabilities: [],
};

const MOCK_RECENT = {
  data: { last_day: 1234, last_week: 8638, last_month: 35274 },
  package: 'requests',
  type: 'recent_downloads',
};

const MOCK_BREAKDOWN = {
  data: [
    { category: '3', date: '2024-01-01', downloads: 500 },
    { category: '2', date: '2024-01-01', downloads: 10 },
  ],
  package: 'requests',
  type: 'python_major_downloads',
};

describe('PackageResource', () => {
  let pip: PyPIClient;

  beforeEach(() => {
    mockFetch.mockClear();
    pip = new PyPIClient();
  });

  describe('get()', () => {
    it('fetches the correct PyPI endpoint', async () => {
      mockResponse(MOCK_PROJECT);
      await pip.package('requests').get();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypi.org/pypi/requests/json',
        expect.any(Object),
      );
    });

    it('returns full project data', async () => {
      mockResponse(MOCK_PROJECT);
      const result = await pip.package('requests').get();
      expect(result.info.name).toBe('requests');
      expect(result.info.version).toBe('2.31.0');
      expect(result.last_serial).toBe(99999);
    });

    it('can be awaited directly (PromiseLike)', async () => {
      mockResponse(MOCK_PROJECT);
      const result = await pip.package('requests');
      expect(result.info.name).toBe('requests');
    });

    it('throws PyPIApiError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn(),
      });
      await expect(pip.package('nonexistent-xyz').get()).rejects.toThrow(PyPIApiError);
    });

    it('throws PyPIApiError with correct status code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn(),
      });
      try {
        await pip.package('nonexistent-xyz').get();
      } catch (err) {
        expect(err).toBeInstanceOf(PyPIApiError);
        expect((err as PyPIApiError).status).toBe(404);
      }
    });
  });

  describe('info()', () => {
    it('returns the info field from the project', async () => {
      mockResponse(MOCK_PROJECT);
      const info = await pip.package('requests').info();
      expect(info.name).toBe('requests');
      expect(info.requires_python).toBe('>=3.7');
      expect(info.license).toBe('Apache 2.0');
    });
  });

  describe('version()', () => {
    it('returns a VersionResource', () => {
      const vr = pip.package('requests').version('2.31.0');
      expect(vr).toBeInstanceOf(VersionResource);
    });

    it('fetches the version endpoint when awaited', async () => {
      const versionData = { ...MOCK_PROJECT, releases: undefined };
      mockResponse(versionData);
      await pip.package('requests').version('2.31.0').get();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypi.org/pypi/requests/2.31.0/json',
        expect.any(Object),
      );
    });
  });

  describe('latest()', () => {
    it('returns a VersionResource', () => {
      const vr = pip.package('requests').latest();
      expect(vr).toBeInstanceOf(VersionResource);
    });

    it('fetches base package endpoint when awaited', async () => {
      mockResponse(MOCK_PROJECT);
      await pip.package('requests').latest().get();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypi.org/pypi/requests/json',
        expect.any(Object),
      );
    });
  });

  describe('versions()', () => {
    it('returns all version strings from releases', async () => {
      mockResponse(MOCK_PROJECT);
      const versions = await pip.package('requests').versions();
      expect(versions).toEqual(['2.28.0', '2.29.0', '2.31.0']);
    });
  });

  describe('releases()', () => {
    it('returns the full releases map', async () => {
      mockResponse(MOCK_PROJECT);
      const releases = await pip.package('requests').releases();
      expect(Object.keys(releases)).toHaveLength(3);
      expect(releases['2.31.0'][0].filename).toBe('requests-2.31.0.tar.gz');
    });
  });

  describe('vulnerabilities()', () => {
    it('returns empty array when no vulnerabilities', async () => {
      mockResponse(MOCK_PROJECT);
      const vulns = await pip.package('requests').vulnerabilities();
      expect(vulns).toEqual([]);
    });

    it('returns vulnerabilities when present', async () => {
      const vuln = {
        id: 'GHSA-xxxx-xxxx-xxxx',
        source: 'osv',
        link: 'https://osv.dev/vulnerability/GHSA-xxxx-xxxx-xxxx',
        aliases: ['CVE-2023-12345'],
        details: 'A vulnerability',
        summary: 'Summary',
        fixed_in: ['2.32.0'],
        withdrawn: null,
      };
      mockResponse({ ...MOCK_PROJECT, vulnerabilities: [vuln] });
      const vulns = await pip.package('requests').vulnerabilities();
      expect(vulns).toHaveLength(1);
      expect(vulns[0].id).toBe('GHSA-xxxx-xxxx-xxxx');
      expect(vulns[0].fixed_in).toEqual(['2.32.0']);
    });
  });

  describe('downloads()', () => {
    it('fetches pypistats recent endpoint', async () => {
      mockResponse(MOCK_RECENT);
      await pip.package('requests').downloads();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypistats.org/api/packages/requests/recent',
        expect.any(Object),
      );
    });

    it('returns recent download counts', async () => {
      mockResponse(MOCK_RECENT);
      const stats = await pip.package('requests').downloads();
      expect(stats.data.last_day).toBe(1234);
      expect(stats.data.last_week).toBe(8638);
      expect(stats.data.last_month).toBe(35274);
    });
  });

  describe('downloadsByPythonMajor()', () => {
    it('fetches correct pypistats endpoint', async () => {
      mockResponse(MOCK_BREAKDOWN);
      await pip.package('requests').downloadsByPythonMajor();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypistats.org/api/packages/requests/python_major',
        expect.any(Object),
      );
    });

    it('accepts date range params', async () => {
      mockResponse(MOCK_BREAKDOWN);
      await pip
        .package('requests')
        .downloadsByPythonMajor({ start_date: '2024-01-01', end_date: '2024-01-31' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypistats.org/api/packages/requests/python_major?start_date=2024-01-01&end_date=2024-01-31',
        expect.any(Object),
      );
    });
  });

  describe('downloadsByPythonMinor()', () => {
    it('fetches correct pypistats endpoint', async () => {
      mockResponse(MOCK_BREAKDOWN);
      await pip.package('requests').downloadsByPythonMinor();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypistats.org/api/packages/requests/python_minor',
        expect.any(Object),
      );
    });
  });

  describe('downloadsBySystem()', () => {
    it('fetches correct pypistats endpoint', async () => {
      mockResponse(MOCK_BREAKDOWN);
      await pip.package('requests').downloadsBySystem();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypistats.org/api/packages/requests/system',
        expect.any(Object),
      );
    });
  });

  describe('downloadsByMirrors()', () => {
    it('fetches correct pypistats endpoint', async () => {
      mockResponse(MOCK_BREAKDOWN);
      await pip.package('requests').downloadsByMirrors();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypistats.org/api/packages/requests/overall',
        expect.any(Object),
      );
    });
  });
});
