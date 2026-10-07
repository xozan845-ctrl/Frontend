import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PwaInstallBannerComponent } from './pwa-install-banner.component';

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

describe('PwaInstallBannerComponent', () => {
  let fixtures: ComponentFixture<PwaInstallBannerComponent>[] = [];

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PwaInstallBannerComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PwaInstallBannerComponent);
    fixture.detectChanges();
    fixtures.push(fixture);
    return fixture;
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    fixtures.forEach((fixture) => {
      if (!fixture.componentRef.hostView.destroyed) fixture.destroy();
    });
    fixtures = [];
    localStorage.clear();
  });

  it('debe mostrar el banner al recibir beforeinstallprompt', async () => {
    const fixture = await setup();

    window.dispatchEvent(makeInstallEvent());

    expect(fixture.componentInstance.showBanner()).toBe(true);
  });

  it('no debe mostrar el banner si ya fue descartado', async () => {
    localStorage.setItem('ecom_pwa_dismissed', 'true');
    const fixture = await setup();

    window.dispatchEvent(makeInstallEvent());

    expect(fixture.componentInstance.showBanner()).toBe(false);
  });

  it('debe ocultar el banner cuando la instalación se acepta', async () => {
    const fixture = await setup();
    window.dispatchEvent(makeInstallEvent('accepted'));

    await fixture.componentInstance.install();

    expect(fixture.componentInstance.showBanner()).toBe(false);
  });

  it('debe mantener el banner cuando la instalación se rechaza', async () => {
    const fixture = await setup();
    window.dispatchEvent(makeInstallEvent('dismissed'));

    await fixture.componentInstance.install();

    expect(fixture.componentInstance.showBanner()).toBe(true);
  });

  it('no debe hacer nada al instalar si no hay prompt pendiente', async () => {
    const fixture = await setup();

    await fixture.componentInstance.install();

    expect(fixture.componentInstance.showBanner()).toBe(false);
  });

  it('debe ocultar y persistir el descarte manual', async () => {
    const fixture = await setup();
    window.dispatchEvent(makeInstallEvent());

    fixture.componentInstance.dismiss();

    expect(fixture.componentInstance.showBanner()).toBe(false);
    expect(localStorage.getItem('ecom_pwa_dismissed')).toBe('true');
  });

  it('debe ocultar el banner cuando la app ya está instalada', async () => {
    const fixture = await setup();
    window.dispatchEvent(makeInstallEvent());

    window.dispatchEvent(new Event('appinstalled'));

    expect(fixture.componentInstance.showBanner()).toBe(false);
  });

  it('debe retirar los listeners de window al destruirse (R-AR-10)', async () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const fixture = await setup();

    fixture.destroy();

    expect(remove).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('appinstalled', expect.any(Function));
  });
});
