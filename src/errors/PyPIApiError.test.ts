import { PyPIApiError } from '../index';

describe('PyPIApiError', () => {
  it('constructs with status and statusText', () => {
    const err = new PyPIApiError(404, 'Not Found');
    expect(err.status).toBe(404);
    expect(err.statusText).toBe('Not Found');
    expect(err.message).toBe('PyPI API error: 404 Not Found');
    expect(err.name).toBe('PyPIApiError');
  });

  it('is an instance of Error', () => {
    const err = new PyPIApiError(401, 'Unauthorized');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PyPIApiError);
  });

  it('can be caught with instanceof check', () => {
    try {
      throw new PyPIApiError(403, 'Forbidden');
    } catch (err) {
      expect(err).toBeInstanceOf(PyPIApiError);
      if (err instanceof PyPIApiError) {
        expect(err.status).toBe(403);
        expect(err.statusText).toBe('Forbidden');
      }
    }
  });
});
