import { PyPIClient, PyPIApiError } from './index';
import { PackageResource } from './resources/PackageResource';
import type { PyPIProject } from './domain/Project';

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

const MOCK_PROJECT: Partial<PyPIProject> = {
  info: {
    name: 'requests',
    version: '2.31.0',
    summary: null,
    description: null,
    description_content_type: null,
    author: null,
    author_email: null,
    maintainer: null,
    maintainer_email: null,
    license: null,
    license_expression: null,
    keywords: null,
    classifiers: [],
    requires_dist: null,
    requires_python: null,
    home_page: null,
    project_url: null,
    project_urls: null,
    bugtrack_url: null,
    docs_url: null,
    download_url: null,
    yanked: false,
    yanked_reason: null,
  },
  last_serial: 1,
  releases: {},
  urls: [],
  vulnerabilities: [],
};

describe('PyPIClient', () => {
  let pip: PyPIClient;

  beforeEach(() => {
    mockFetch.mockClear();
    pip = new PyPIClient();
  });

  describe('constructor', () => {
    it('instantiates with defaults', () => {
      expect(pip).toBeInstanceOf(PyPIClient);
    });

    it('accepts custom apiUrl', () => {
      const client = new PyPIClient({ apiUrl: 'https://my-pypi-mirror.example.com' });
      expect(client).toBeInstanceOf(PyPIClient);
    });

    it('accepts custom statsApiUrl', () => {
      const client = new PyPIClient({ statsApiUrl: 'https://stats.example.com' });
      expect(client).toBeInstanceOf(PyPIClient);
    });

    it('strips trailing slash from apiUrl', async () => {
      const client = new PyPIClient({ apiUrl: 'https://pypi.org/' });
      mockResponse(MOCK_PROJECT);
      await client.package('requests').get();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pypi.org/pypi/requests/json',
        expect.any(Object),
      );
    });

    it('uses custom apiUrl for requests', async () => {
      const client = new PyPIClient({ apiUrl: 'https://custom.example.com' });
      mockResponse(MOCK_PROJECT);
      await client.package('requests').get();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.example.com/pypi/requests/json',
        expect.any(Object),
      );
    });

    it('uses custom statsApiUrl for stats requests', async () => {
      const client = new PyPIClient({ statsApiUrl: 'https://custom-stats.example.com' });
      mockResponse({
        data: { last_day: 0, last_week: 0, last_month: 0 },
        package: 'requests',
        type: 'recent_downloads',
      });
      await client.package('requests').downloads();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-stats.example.com/api/packages/requests/recent',
        expect.any(Object),
      );
    });
  });

  describe('package()', () => {
    it('returns a PackageResource', () => {
      const pkg = pip.package('requests');
      expect(pkg).toBeInstanceOf(PackageResource);
    });

    it('exposes expected methods', () => {
      const pkg = pip.package('requests');
      expect(typeof pkg.get).toBe('function');
      expect(typeof pkg.info).toBe('function');
      expect(typeof pkg.version).toBe('function');
      expect(typeof pkg.latest).toBe('function');
      expect(typeof pkg.versions).toBe('function');
      expect(typeof pkg.releases).toBe('function');
      expect(typeof pkg.vulnerabilities).toBe('function');
      expect(typeof pkg.downloads).toBe('function');
      expect(typeof pkg.downloadsByPythonMajor).toBe('function');
      expect(typeof pkg.downloadsByPythonMinor).toBe('function');
      expect(typeof pkg.downloadsBySystem).toBe('function');
      expect(typeof pkg.downloadsByMirrors).toBe('function');
    });

    it('can be awaited directly', async () => {
      mockResponse(MOCK_PROJECT);
      const result = await pip.package('requests');
      expect(result.info?.name).toBe('requests');
    });

    it('sends Accept: application/json header', async () => {
      mockResponse(MOCK_PROJECT);
      await pip.package('requests').get();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Accept: 'application/json' }),
        }),
      );
    });

    it('throws PyPIApiError on non-2xx response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn(),
      });
      await expect(pip.package('nonexistent-xyz').get()).rejects.toThrow(PyPIApiError);
    });
  });

  describe('on()', () => {
    it('emits request event on success', async () => {
      const handler = jest.fn();
      pip.on('request', handler);
      mockResponse(MOCK_PROJECT);
      await pip.package('requests').get();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://pypi.org/pypi/requests/json',
          method: 'GET',
          statusCode: 200,
        }),
      );
    });

    it('emits request event with durationMs', async () => {
      const handler = jest.fn();
      pip.on('request', handler);
      mockResponse(MOCK_PROJECT);
      await pip.package('requests').get();
      const event = handler.mock.calls[0][0];
      expect(typeof event.durationMs).toBe('number');
      expect(event.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('emits request event with error on failure', async () => {
      const handler = jest.fn();
      pip.on('request', handler);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn(),
      });
      await pip
        .package('requests')
        .get()
        .catch(() => undefined);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(Error) }));
    });

    it('is chainable', () => {
      const result = pip.on('request', jest.fn());
      expect(result).toBe(pip);
    });

    it('supports multiple listeners', async () => {
      const h1 = jest.fn();
      const h2 = jest.fn();
      pip.on('request', h1).on('request', h2);
      mockResponse(MOCK_PROJECT);
      await pip.package('requests').get();
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });
  });
});
