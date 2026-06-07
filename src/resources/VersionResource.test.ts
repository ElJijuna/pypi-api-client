import { PyPIClient, PyPIApiError } from '../index';
import { VersionResource } from './VersionResource';
import type { PyPIVersionInfo } from '../domain/Version';
import type { PyPIFile } from '../domain/Project';

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

const MOCK_FILE: PyPIFile = {
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
};

const MOCK_VERSION: PyPIVersionInfo = {
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
    project_urls: null,
    bugtrack_url: null,
    docs_url: null,
    download_url: null,
    yanked: false,
    yanked_reason: null,
  },
  last_serial: 99999,
  urls: [MOCK_FILE],
  vulnerabilities: [],
};

const MOCK_DEPS = {
  nodes: [
    { versionKey: { system: 'PYPI', name: 'requests', version: '2.31.0' }, relation: 'SELF', bundled: false, errors: [] },
    { versionKey: { system: 'PYPI', name: 'urllib3', version: '2.0.4' }, relation: 'DIRECT', bundled: false, errors: [] },
  ],
  edges: [{ fromNode: 0, toNode: 1, requirement: '>=1.21.1,<3' }],
};

describe('VersionResource', () => {
  let pip: PyPIClient;

  beforeEach(() => {
    mockFetch.mockClear();
    pip = new PyPIClient();
  });

  describe('version()', () => {
    it('returns a VersionResource', () => {
      const vr = pip.package('requests').version('2.31.0');
      expect(vr).toBeInstanceOf(VersionResource);
    });
  });

  describe('get()', () => {
    it('fetches the correct version endpoint', async () => {
      mockResponse(MOCK_VERSION);
      await pip.package('requests').version('2.31.0').get();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypi.org/pypi/requests/2.31.0/json',
        expect.any(Object),
      );
    });

    it('returns version info', async () => {
      mockResponse(MOCK_VERSION);
      const result = await pip.package('requests').version('2.31.0').get();
      expect(result.info.name).toBe('requests');
      expect(result.info.version).toBe('2.31.0');
    });

    it('can be awaited directly (PromiseLike)', async () => {
      mockResponse(MOCK_VERSION);
      const result = await pip.package('requests').version('2.31.0');
      expect(result.info.version).toBe('2.31.0');
    });

    it('throws PyPIApiError on 404', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', json: jest.fn() });
      await expect(pip.package('requests').version('0.0.0').get()).rejects.toThrow(PyPIApiError);
    });

    it('encodes package name in URL', async () => {
      mockResponse(MOCK_VERSION);
      await pip.package('my-package').version('1.0.0').get();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypi.org/pypi/my-package/1.0.0/json',
        expect.any(Object),
      );
    });
  });

  describe('files()', () => {
    it('returns urls array from version info', async () => {
      mockResponse(MOCK_VERSION);
      const files = await pip.package('requests').version('2.31.0').files();
      expect(files).toHaveLength(1);
      expect(files[0].filename).toBe('requests-2.31.0.tar.gz');
      expect(files[0].packagetype).toBe('sdist');
    });
  });

  describe('vulnerabilities()', () => {
    it('returns empty array when no vulnerabilities', async () => {
      mockResponse(MOCK_VERSION);
      const vulns = await pip.package('requests').version('2.31.0').vulnerabilities();
      expect(vulns).toEqual([]);
    });

    it('returns vulnerabilities when present', async () => {
      const vuln = {
        id: 'GHSA-xxxx-xxxx-xxxx',
        source: 'osv',
        link: 'https://osv.dev/vulnerability/GHSA-xxxx-xxxx-xxxx',
        aliases: ['CVE-2023-12345'],
        details: 'A vulnerability in requests',
        summary: 'Summary',
        fixed_in: ['2.32.0'],
        withdrawn: null,
      };
      mockResponse({ ...MOCK_VERSION, vulnerabilities: [vuln] });
      const vulns = await pip.package('requests').version('2.31.0').vulnerabilities();
      expect(vulns).toHaveLength(1);
      expect(vulns[0].id).toBe('GHSA-xxxx-xxxx-xxxx');
    });
  });

  describe('dependencies()', () => {
    it('fetches deps.dev endpoint for specific version', async () => {
      mockResponse(MOCK_DEPS);
      await pip.package('requests').version('2.31.0').dependencies();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deps.dev/v3/systems/pypi/packages/requests/versions/2.31.0:dependencies',
        expect.any(Object),
      );
    });

    it('returns resolved dependency graph', async () => {
      mockResponse(MOCK_DEPS);
      const deps = await pip.package('requests').version('2.31.0').dependencies();
      expect(deps.nodes).toHaveLength(2);
      const self = deps.nodes.find(n => n.relation === 'SELF');
      const direct = deps.nodes.find(n => n.relation === 'DIRECT');
      expect(self?.versionKey.name).toBe('requests');
      expect(direct?.versionKey.name).toBe('urllib3');
    });
  });

  describe('latest() via latest()', () => {
    it('fetches base package endpoint', async () => {
      mockResponse({ ...MOCK_VERSION, releases: {} });
      await pip.package('requests').latest().get();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypi.org/pypi/requests/json',
        expect.any(Object),
      );
    });

    it('returns latest version info', async () => {
      mockResponse({ ...MOCK_VERSION, releases: {} });
      const result = await pip.package('requests').latest();
      expect(result.info.version).toBe('2.31.0');
    });

    it('dependencies() on latest resolves version first', async () => {
      mockResponse({ ...MOCK_VERSION, releases: {} }); // for get()
      mockResponse(MOCK_DEPS);                         // for deps.dev
      await pip.package('requests').latest().dependencies();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.deps.dev/v3/systems/pypi/packages/requests/versions/2.31.0:dependencies',
        expect.any(Object),
      );
    });
  });
});
