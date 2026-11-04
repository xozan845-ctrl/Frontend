import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import StoreEntryComponent from './store-entry.component';
import { MediaBackgroundConfig } from '../../../../../core/models/media-background.model';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { AuthStore } from '../../../auth/public-api';
import { MediaBackgroundStore } from '../../../../domains/media-background/public-api';
import type { User } from '../../../auth/public-api';

describe('StoreEntryComponent', () => {
  const seo = { setPage: vi.fn(), reset: vi.fn() };
  const currentUser = signal<User | null>(null);
  const platformBackground = signal<MediaBackgroundConfig | null>(null);
  const companyBackground = signal<MediaBackgroundConfig | null>(null);
  const authStoreStub = {
    user: currentUser.asReadonly(),
    hasActiveCompany: computed(
      () => currentUser()?.role === 'empresario' && !!currentUser()?.tenantId,
    ),
  };
  const mediaBackgroundStoreStub = {
    platform: platformBackground.asReadonly(),
    company: companyBackground.asReadonly(),
    loadPlatform: vi.fn(),
    loadCompany: vi.fn(),
  };

  const setup = async () => {
    const testingModule = TestBed.configureTestingModule({
      imports: [StoreEntryComponent],
      providers: [
        provideRouter([]),
        { provide: SeoService, useValue: seo },
        { provide: AuthStore, useValue: authStoreStub },
      ],
    });
    // El componente declara los providers reales del dominio; en el test se
    // sustituyen por el doble para no tocar HTTP (R-CP-4).
    testingModule.overrideComponent(StoreEntryComponent, {
      set: {
        providers: [{ provide: MediaBackgroundStore, useValue: mediaBackgroundStoreStub }],
      },
    });
    await testingModule.compileComponents();
    const fixture = TestBed.createComponent(StoreEntryComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.set(null);
    platformBackground.set(null);
    companyBackground.set(null);
    TestBed.resetTestingModule();
  });

  it('debe navegar al asistente al pulsar "Crear empresa"', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Crear empresa'))!;

    button.click();

    expect(navigate).toHaveBeenCalledWith(['/crear-empresa']);
  });

  it('debe entrar a la tienda indicada', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goToStore('t-1');

    expect(navigate).toHaveBeenCalledWith(['/tienda', 't-1', 'shop']);
  });

  it('debe normalizar el id al entrar a la tienda', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goToStore('  t-1  ');

    expect(navigate).toHaveBeenCalledWith(['/tienda', 't-1', 'shop']);
  });

  it('no debe navegar cuando el id de tienda es inválido', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goToStore('   ');
    fixture.componentInstance.goToStore('../admin');
    fixture.componentInstance.goToStore('a'.repeat(101));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('debe actualizar el SEO al entrar', async () => {
    await setup();

    expect(seo.setPage).toHaveBeenCalled();
  });

  it('debe restaurar el SEO al salir', async () => {
    const fixture = await setup();

    fixture.destroy();

    expect(seo.reset).toHaveBeenCalled();
  });

  it('mantiene la raíz accesible y reemplaza crear empresa por el panel para empresarios', async () => {
    currentUser.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@empresa.test',
      role: 'empresario',
      tenantId: 'empresa-1',
    });
    const fixture = await setup();

    expect(fixture.componentInstance.hasActiveCompany()).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('¿Tienes una empresa?');
    expect(
      fixture.nativeElement.querySelector('[data-testid="company-workspace-link"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="create-logistics-company-link"]'),
    ).not.toBeNull();
  });

  it('navega al workspace desde el card del empresario', async () => {
    currentUser.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@empresa.test',
      role: 'empresario',
      tenantId: 'empresa-1',
    });
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    (
      fixture.nativeElement.querySelector(
        '[data-testid="company-workspace-link"]',
      ) as HTMLButtonElement
    ).click();

    expect(navigate).toHaveBeenCalledWith(['/empresa/inicio']);
  });

  it('carga el fondo de plataforma al entrar', async () => {
    await setup();

    expect(mediaBackgroundStoreStub.loadPlatform).toHaveBeenCalledOnce();
    expect(mediaBackgroundStoreStub.loadCompany).not.toHaveBeenCalled();
  });

  it('carga el fondo de la empresa activa y lo prefiere sobre el de plataforma', async () => {
    currentUser.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@empresa.test',
      role: 'empresario',
      tenantId: 'empresa-1',
    });
    const companyConfig: MediaBackgroundConfig = {
      objectId: 'o-company',
      mediaType: 'imagen',
      url: 'https://cdn.test/company.jpg',
      posterObjectId: null,
      posterUrl: null,
      alt: 'Empresa',
      overlay: 35,
      position: 'center',
      active: true,
    };
    companyBackground.set(companyConfig);
    const fixture = await setup();

    expect(mediaBackgroundStoreStub.loadCompany).toHaveBeenCalledWith('empresa-1');
    expect(fixture.componentInstance.background()).toBe(companyConfig);
  });

  it('usa el fondo de plataforma cuando la empresa no tiene uno visible', async () => {
    currentUser.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@empresa.test',
      role: 'empresario',
      tenantId: 'empresa-1',
    });
    const platformConfig: MediaBackgroundConfig = {
      objectId: 'o-platform',
      mediaType: 'video',
      url: 'https://cdn.test/platform.mp4',
      posterObjectId: null,
      posterUrl: null,
      alt: 'Plataforma',
      overlay: 40,
      position: 'center',
      active: true,
    };
    platformBackground.set(platformConfig);
    const fixture = await setup();

    expect(fixture.componentInstance.background()).toBe(platformConfig);
  });
});
