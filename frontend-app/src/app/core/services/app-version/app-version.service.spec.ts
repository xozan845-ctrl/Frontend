import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AppVersionService } from './app-version.service';

describe('AppVersionService', () => {
  const originalFetch = globalThis.fetch;

  const setup = () => {
    TestBed.configureTestingModule({});
    return TestBed.inject(AppVersionService);
  };

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar la versión desde version.json', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: '1.27.0' }),
    }) as unknown as typeof fetch;
    const service = setup();

    await service.load(true);

    expect(service.version()).toBe('1.27.0');
  });

  it('debe conservar la versión compilada si version.json falla', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    const service = setup();

    await service.load(true);

    expect(service.version()).toBe(environment.appVersion);
  });

  it('debe volver a consultar cuando se fuerza la carga', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ version: '1.27.0' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ version: '1.28.0' }) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const service = setup();
    fetchMock.mockClear();

    await service.load(true);
    await service.load(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(service.version()).toBe('1.28.0');
  });
});
