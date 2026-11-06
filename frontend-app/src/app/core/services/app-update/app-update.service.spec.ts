import { TestBed } from '@angular/core/testing';
import { SwUpdate, type VersionEvent, type VersionReadyEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { AppVersionService } from '../app-version/app-version.service';
import { AppUpdateService } from './app-update.service';

describe('AppUpdateService', () => {
  const versions = new Subject<VersionEvent>();
  const swUpdate = {
    isEnabled: true,
    versionUpdates: versions.asObservable(),
    checkForUpdate: vi.fn().mockResolvedValue(false),
    activateUpdate: vi.fn().mockResolvedValue(true),
  };
  const appVersion = {
    load: vi.fn().mockResolvedValue({
      version: '1.27.0',
      changes: ['Nuevo: aviso de actualización'],
      totalChanges: 2,
    }),
  };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: swUpdate },
        { provide: AppVersionService, useValue: appVersion },
      ],
    });
    return TestBed.inject(AppUpdateService);
  };

  const ready = (hash: string): VersionReadyEvent =>
    ({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old' },
      latestVersion: { hash },
    }) as VersionReadyEvent;

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
  });

  it('debe publicar la versión nueva cuando el service worker está listo', async () => {
    const service = setup();

    versions.next(ready('hash-127'));

    await vi.waitFor(() =>
      expect(service.update()).toEqual({
        version: '1.27.0',
        hash: 'hash-127',
        changes: ['Nuevo: aviso de actualización'],
        totalChanges: 2,
      }),
    );
  });

  it('debe silenciar solo el hash descartado', async () => {
    const service = setup();
    versions.next(ready('hash-127'));
    await vi.waitFor(() => expect(service.update()).not.toBeNull());

    service.dismiss();

    expect(service.update()).toBeNull();
    expect(sessionStorage.getItem('ecom_update_dismissed_hash')).toBe('hash-127');

    versions.next(ready('hash-127'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(service.update()).toBeNull();

    versions.next(ready('hash-128'));
    await vi.waitFor(() =>
      expect(service.update()).toEqual({
        version: '1.27.0',
        hash: 'hash-128',
        changes: ['Nuevo: aviso de actualización'],
        totalChanges: 2,
      }),
    );
  });

  it('debe activar la versión y recargar al refrescar', async () => {
    const service = setup();
    const reload = vi
      .spyOn(service as unknown as { reloadPage: () => void }, 'reloadPage')
      .mockImplementation(() => undefined);

    await service.refresh();

    expect(swUpdate.activateUpdate).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });
});
