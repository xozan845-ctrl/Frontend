import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppUpdateService } from '../../../core/services/app-update/app-update.service';
import type { AppUpdateInfo } from '../../../core/services/app-update/app-update.types';
import { AppVersionService } from '../../../core/services/app-version/app-version.service';
import { PwaNoticeComponent } from './pwa-notice.component';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const makeInstallEvent = (outcome: 'accepted' | 'dismissed' = 'accepted'): InstallPromptEvent => {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as InstallPromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  return event;
};

describe('PwaNoticeComponent', () => {
  let fixtures: ComponentFixture<PwaNoticeComponent>[] = [];
  const update = signal<AppUpdateInfo | null>(null);
  const version = signal('1.26.0');
  const appUpdate = {
    update,
    dismiss: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
  };
  const appVersion = {
    version,
    load: vi.fn().mockResolvedValue('1.26.0'),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PwaNoticeComponent],
      providers: [
        { provide: AppUpdateService, useValue: appUpdate },
        { provide: AppVersionService, useValue: appVersion },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PwaNoticeComponent);
    fixture.detectChanges();
    fixtures.push(fixture);
    return fixture;
  };

  beforeEach(() => {
    update.set(null);
    version.set('1.26.0');
    localStorage.clear();
    sessionStorage.clear();
    window.__pwaInstallPrompt = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    fixtures.forEach((fixture) => {
      if (!fixture.componentRef.hostView.destroyed) fixture.destroy();
    });
    fixtures = [];
    localStorage.clear();
    sessionStorage.clear();
    window.__pwaInstallPrompt = null;
  });

  it('debe mostrar el banner al recibir beforeinstallprompt', async () => {
    const fixture = await setup();

    window.dispatchEvent(makeInstallEvent());

    expect(fixture.componentInstance.showBanner()).toBe(true);
  });

  it('debe consumir el prompt capturado antes de Angular', async () => {
    window.__pwaInstallPrompt = makeInstallEvent();
    const fixture = await setup();

    expect(fixture.componentInstance.showBanner()).toBe(true);
  });

  it('debe reaccionar al evento pwa-install-available', async () => {
    const fixture = await setup();
    window.__pwaInstallPrompt = makeInstallEvent();

    window.dispatchEvent(new Event('pwa-install-available'));

    expect(fixture.componentInstance.showBanner()).toBe(true);
  });

  it('no debe mostrar el banner si ya fue descartado para esta versión', async () => {
    localStorage.setItem('ecom_pwa_dismissed_version', '1.26.0');
    const fixture = await setup();

    window.dispatchEvent(makeInstallEvent());

    expect(fixture.componentInstance.showBanner()).toBe(false);
  });

  it('debe volver a mostrar el banner cuando cambia la versión', async () => {
    localStorage.setItem('ecom_pwa_dismissed_version', '1.25.0');
    version.set('1.26.0');
    const fixture = await setup();

    window.dispatchEvent(makeInstallEvent());

    expect(fixture.componentInstance.showBanner()).toBe(true);
  });

  it('debe ignorar la clave antigua de descarte permanente', async () => {
    localStorage.setItem('ecom_pwa_dismissed', 'true');
    const fixture = await setup();

    window.dispatchEvent(makeInstallEvent());

    expect(fixture.componentInstance.showBanner()).toBe(true);
  });

  it('debe ocultar el banner cuando la instalación se acepta', async () => {
    const fixture = await setup();
    window.dispatchEvent(makeInstallEvent('accepted'));

    await fixture.componentInstance.install();

    expect(fixture.componentInstance.showBanner()).toBe(false);
  });

  it('debe ocultar el banner cuando la instalación se rechaza', async () => {
    const fixture = await setup();
    window.dispatchEvent(makeInstallEvent('dismissed'));

    await fixture.componentInstance.install();

    expect(fixture.componentInstance.showBanner()).toBe(false);
  });

  it('no debe hacer nada al instalar si no hay prompt pendiente', async () => {
    const fixture = await setup();

    await fixture.componentInstance.install();

    expect(fixture.componentInstance.showBanner()).toBe(false);
  });

  it('debe ocultar y persistir el descarte manual por versión', async () => {
    const fixture = await setup();
    window.dispatchEvent(makeInstallEvent());

    fixture.componentInstance.dismiss();

    expect(fixture.componentInstance.showBanner()).toBe(false);
    expect(localStorage.getItem('ecom_pwa_dismissed_version')).toBe('1.26.0');
    expect(localStorage.getItem('ecom_pwa_dismissed')).toBeNull();
  });

  it('debe ocultar el banner cuando la app ya está instalada', async () => {
    const fixture = await setup();
    window.dispatchEvent(makeInstallEvent());

    window.dispatchEvent(new Event('appinstalled'));

    expect(fixture.componentInstance.showBanner()).toBe(false);
  });

  it('debe mostrar la versión, el aviso de datos y refrescar', async () => {
    update.set({ version: '1.27.0', hash: 'hash-127' });
    const fixture = await setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('v1.27.0');
    expect(host.textContent).toContain('Tus datos y tu sesión permanecen seguros.');
    expect(host.textContent).toContain('Refresca para aplicar los cambios visuales.');

    fixture.componentInstance.refreshUpdate();

    expect(appUpdate.refresh).toHaveBeenCalledOnce();
  });

  it('debe permitir cerrar el aviso de actualización', async () => {
    update.set({ version: '1.27.0', hash: 'hash-127' });
    const fixture = await setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const close = host.querySelector<HTMLButtonElement>(
      '[aria-label="Cerrar aviso de actualización"]',
    );

    close?.click();

    expect(appUpdate.dismiss).toHaveBeenCalledOnce();
  });

  it('debe retirar los listeners de window al destruirse (R-AR-10)', async () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const fixture = await setup();

    fixture.destroy();

    expect(remove).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('pwa-install-available', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('pwa-installed', expect.any(Function));
  });
});
