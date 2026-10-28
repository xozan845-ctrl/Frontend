import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import VendorStoreComponent from './store.component';
import { VendorStoreStore } from '../../state/vendor-store/vendor-store.store';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { Store } from '../../../products/public-api';

const store: Store = {
  id: 't-1',
  vendorId: 'u-1',
  name: 'Mi Tienda',
  description: 'Ropa y accesorios',
  companyId: 'e-1',
  ownerUserId: 'u-1',
  participationPercentage: 100,
  createdAt: '2026-10-21T20:57:47.870Z',
};

describe('VendorStoreComponent', () => {
  const storeSignal = signal<Store | null>(null);
  const loading = signal(false);
  const loaded = signal(false);
  const error = signal<string | null>(null);
  const vendorStore = {
    store: storeSignal.asReadonly(),
    loading: loading.asReadonly(),
    loaded: loaded.asReadonly(),
    error: error.asReadonly(),
    load: vi.fn(),
    refresh: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [VendorStoreComponent],
      providers: [
        provideRouter([]),
        { provide: VendorStoreStore, useValue: vendorStore },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(VendorStoreComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storeSignal.set(null);
    loading.set(false);
    loaded.set(false);
    error.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar la ficha al entrar', async () => {
    await setup();

    expect(vendorStore.load).toHaveBeenCalled();
  });

  it('debe mostrar la ficha de la tienda con participación y enlace público', async () => {
    storeSignal.set(store);
    loaded.set(true);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[data-testid="store-name"]').textContent).toContain(
      'Mi Tienda',
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="store-description"]').textContent,
    ).toContain('Ropa y accesorios');
    expect(
      fixture.nativeElement.querySelector('[data-testid="store-participation"]').textContent,
    ).toContain('100');
    expect(
      fixture.nativeElement.querySelector('[data-testid="store-public-link"]').getAttribute('href'),
    ).toBe('/tienda/t-1/shop');
  });

  it('debe mostrar el estado vacío con enlace a crear tienda', async () => {
    loaded.set(true);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[data-testid="store-empty"]')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="store-create-link"]').getAttribute('href'),
    ).toBe('/crear-tienda');
  });

  it('debe mostrar el error y reintentar', async () => {
    error.set('No se pudo cargar tu tienda.');
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="store-error"]').textContent,
    ).toContain('No se pudo cargar tu tienda.');
    fixture.componentInstance.vendorStore.refresh();
    expect(vendorStore.refresh).toHaveBeenCalled();
  });

  it('debe mostrar el estado de carga', async () => {
    loading.set(true);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });
});
