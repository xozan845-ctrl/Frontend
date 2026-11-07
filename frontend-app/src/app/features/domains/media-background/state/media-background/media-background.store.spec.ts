import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { MediaBackgroundConfig } from '@core/models/media-background.model';
import { MEDIA_BACKGROUND_REPOSITORY } from '../../repositories/media-background.repository';
import { MediaBackgroundStore } from './media-background.store';

const config = (id: string, mediaType: 'imagen' | 'video' = 'imagen'): MediaBackgroundConfig => ({
  objectId: id,
  mediaType,
  url: `https://cdn.test/${id}`,
  posterObjectId: mediaType === 'video' ? `${id}-poster` : null,
  posterUrl: mediaType === 'video' ? `https://cdn.test/${id}-poster` : null,
  alt: id,
  overlay: 35,
  position: 'center',
  active: true,
});

describe('MediaBackgroundStore', () => {
  let repo: {
    platform: ReturnType<typeof vi.fn>;
    panelAi: ReturnType<typeof vi.fn>;
    company: ReturnType<typeof vi.fn>;
    store: ReturnType<typeof vi.fn>;
  };

  const setup = () => {
    repo = {
      platform: vi.fn((): Observable<MediaBackgroundConfig> => of(config('platform', 'video'))),
      panelAi: vi.fn((): Observable<MediaBackgroundConfig> => of(config('panel-ai', 'video'))),
      company: vi.fn((): Observable<MediaBackgroundConfig> => of(config('company'))),
      store: vi.fn((): Observable<MediaBackgroundConfig> => of(config('store'))),
    };
    TestBed.configureTestingModule({
      providers: [MediaBackgroundStore, { provide: MEDIA_BACKGROUND_REPOSITORY, useValue: repo }],
    });
    return TestBed.inject(MediaBackgroundStore);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe cargar el fondo de plataforma una sola vez', async () => {
    const store = setup();

    store.loadPlatform();
    await vi.waitFor(() => expect(store.platformLoaded()).toBe(true));
    store.loadPlatform();

    expect(repo.platform).toHaveBeenCalledOnce();
    expect(store.platform()).toMatchObject({ objectId: 'platform', mediaType: 'video' });
    expect(store.loadingPlatform()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('debe cargar el fondo del panel de IA una sola vez', async () => {
    const store = setup();

    store.loadPanelAi();
    await vi.waitFor(() => expect(store.panelAiLoaded()).toBe(true));
    store.loadPanelAi();

    expect(repo.panelAi).toHaveBeenCalledOnce();
    expect(store.panelAi()).toMatchObject({ objectId: 'panel-ai', mediaType: 'video' });
    expect(store.loadingPanelAi()).toBe(false);
  });

  it('debe cargar fondos de empresa y tienda por id, sin repetir el mismo id', async () => {
    const store = setup();

    store.loadCompany('c-1');
    store.loadCompany('c-1');
    await vi.waitFor(() => expect(store.companyLoadedId()).toBe('c-1'));
    store.loadCompany('c-2');
    await vi.waitFor(() => expect(store.companyLoadedId()).toBe('c-2'));

    store.loadStore('t-1');
    store.loadStore('t-1');
    await vi.waitFor(() => expect(store.storeLoadedId()).toBe('t-1'));

    expect(repo.company).toHaveBeenCalledTimes(2);
    expect(repo.store).toHaveBeenCalledOnce();
    expect(store.company()?.objectId).toBe('company');
    expect(store.store()?.objectId).toBe('store');
  });

  it('debe registrar el error y permitir reintentar', async () => {
    const store = setup();
    repo.platform.mockReturnValueOnce(throwError(() => new Error('sin red')));

    store.loadPlatform();
    await vi.waitFor(() => expect(store.error()).toBe('sin red'));

    expect(store.platformLoaded()).toBe(false);
    expect(store.loadingPlatform()).toBe(false);

    store.loadPlatform();
    await vi.waitFor(() => expect(store.platformLoaded()).toBe(true));
    expect(store.error()).toBeNull();
  });

  it('debe ignorar ids vacíos y registrar errores de empresa/tienda', async () => {
    const store = setup();
    repo.company.mockReturnValueOnce(throwError(() => new Error('empresa sin red')));
    repo.store.mockReturnValueOnce(throwError(() => new Error('tienda sin red')));

    store.loadCompany('');
    store.loadStore('');
    expect(repo.company).not.toHaveBeenCalled();
    expect(repo.store).not.toHaveBeenCalled();

    store.loadCompany('c-1');
    await vi.waitFor(() => expect(store.error()).toBe('empresa sin red'));
    expect(store.companyLoadedId()).toBeNull();

    store.loadStore('t-1');
    await vi.waitFor(() => expect(store.error()).toBe('tienda sin red'));
    expect(store.storeLoadedId()).toBeNull();
    expect(store.loadingCompany()).toBe(false);
    expect(store.loadingStore()).toBe(false);
  });

  it('debe limpiar el error y reiniciar las ranuras', async () => {
    const store = setup();
    store.loadPlatform();
    await vi.waitFor(() => expect(store.platformLoaded()).toBe(true));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.platform()).toBeNull();
    expect(store.company()).toBeNull();
    expect(store.store()).toBeNull();
    expect(store.platformLoaded()).toBe(false);
    expect(store.companyLoadedId()).toBeNull();
    expect(store.storeLoadedId()).toBeNull();
  });
});
