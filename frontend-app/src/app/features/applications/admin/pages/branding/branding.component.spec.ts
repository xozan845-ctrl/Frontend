import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import AdminBrandingComponent from './branding.component';
import {
  MediaBackgroundConfig,
  MediaBackgroundDraft,
  EMPTY_MEDIA_BACKGROUND,
} from '../../../../../core/models/media-background.model';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { adminGuard } from '../../../auth/public-api';
import {
  MediaBackgroundStore,
  MediaBackgroundUploadService,
  MediaBackgroundWriteService,
} from '../../../../domains/media-background/public-api';
import { ADMIN_ROUTES } from '../../admin.routes';

const CONFIG: MediaBackgroundConfig = {
  ...EMPTY_MEDIA_BACKGROUND,
  objectId: 'obj-1',
  mediaType: 'imagen',
  url: 'https://cdn.test/fondo.jpg',
  active: true,
};

const DRAFT: MediaBackgroundDraft = {
  objectId: 'obj-1',
  posterObjectId: null,
  alt: 'Fondo',
  overlay: 40,
  position: 'center',
  active: true,
};

describe('AdminBrandingComponent', () => {
  const platform = signal<MediaBackgroundConfig | null>(null);
  const panelAi = signal<MediaBackgroundConfig | null>(null);
  const error = signal<string | null>(null);
  const storeStub = {
    platform: platform.asReadonly(),
    panelAi: panelAi.asReadonly(),
    error: error.asReadonly(),
    loadingPlatform: signal(false).asReadonly(),
    loadingPanelAi: signal(false).asReadonly(),
    loadPlatform: vi.fn(),
    loadPanelAi: vi.fn(),
    setPlatform: vi.fn(),
    setPanelAi: vi.fn(),
  };
  const writerStub = {
    updateSite: vi.fn(() => of(CONFIG)),
  };
  const uploadsStub = { upload: vi.fn(() => of(CONFIG)) };
  const notifications = { showSuccess: vi.fn() };
  const seo = { setPage: vi.fn(), updateTitle: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    const testingModule = TestBed.configureTestingModule({
      imports: [AdminBrandingComponent],
      providers: [
        { provide: SeoService, useValue: seo },
        { provide: NotificationService, useValue: notifications },
        { provide: MediaBackgroundWriteService, useValue: writerStub },
        { provide: MediaBackgroundUploadService, useValue: uploadsStub },
      ],
    });
    // El componente declara los providers reales del dominio; en el test se
    // sustituyen por el doble y se evita montar los editores (R-CP-4).
    testingModule.overrideComponent(AdminBrandingComponent, {
      set: {
        template: '',
        providers: [{ provide: MediaBackgroundStore, useValue: storeStub }],
      },
    });
    await testingModule.compileComponents();
    return TestBed.createComponent(AdminBrandingComponent);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    platform.set(null);
    panelAi.set(null);
    error.set(null);
    TestBed.resetTestingModule();
  });

  it('carga el fondo de plataforma y el del panel de IA al crear la página', async () => {
    await setup();

    expect(storeStub.loadPlatform).toHaveBeenCalledOnce();
    expect(storeStub.loadPanelAi).toHaveBeenCalledOnce();
  });

  it('guarda el fondo de plataforma y lo aplica al store', async () => {
    const fixture = await setup();

    let resultado: MediaBackgroundConfig | undefined;
    fixture.componentInstance.guardarPlataforma(DRAFT).subscribe((config) => {
      resultado = config;
    });

    expect(writerStub.updateSite).toHaveBeenCalledWith('platform', DRAFT);
    expect(storeStub.setPlatform).toHaveBeenCalledWith(CONFIG);
    expect(resultado).toBe(CONFIG);
  });

  it('guarda el fondo del panel de IA y lo aplica al store', async () => {
    const fixture = await setup();

    fixture.componentInstance.guardarPanelAi(DRAFT).subscribe();

    expect(writerStub.updateSite).toHaveBeenCalledWith('panel-ai', DRAFT);
    expect(storeStub.setPanelAi).toHaveBeenCalledWith(CONFIG);
  });

  it('notifica el guardado correcto', async () => {
    const fixture = await setup();

    fixture.componentInstance.onGuardado('Fondo actualizado.');

    expect(notifications.showSuccess).toHaveBeenCalledWith('Fondo actualizado.');
  });

  it('protege la personalización global con adminGuard', () => {
    const route = ADMIN_ROUTES.find((item) => item.path === 'personalizacion');

    expect(route).toBeDefined();
    expect(route?.canActivate).toContain(adminGuard);
  });
});
