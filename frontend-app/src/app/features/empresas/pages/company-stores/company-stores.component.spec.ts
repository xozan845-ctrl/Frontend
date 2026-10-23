import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CompanyStoresComponent from './company-stores.component';
import { CompanyPortalStore } from '../../state/company-portal/company-portal.store';
import { SeoService } from '../../../../core/services/seo/seo.service';
import type { CompanyStore } from '../../models/company-store.model';

const store: CompanyStore = {
  id: 'tienda-1',
  companyId: 'empresa-1',
  ownerUserId: 'user-1',
  sellerId: 'vendedor-1',
  name: 'Tienda Centro',
  description: 'Sucursal central',
  participationPercentage: 100,
  createdAt: '2026-10-21T10:00:00.000Z',
};

describe('CompanyStoresComponent', () => {
  const stores = signal<CompanyStore[]>([]);
  const storesLoading = signal(false);
  const error = signal<string | null>(null);
  const portal = {
    stores: stores.asReadonly(),
    storesLoading: storesLoading.asReadonly(),
    error: error.asReadonly(),
    loadStores: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyStoresComponent],
      providers: [
        provideRouter([]),
        { provide: CompanyPortalStore, useValue: portal },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyStoresComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    stores.set([]);
    storesLoading.set(false);
    error.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar las tiendas al entrar', async () => {
    await setup();

    expect(portal.loadStores).toHaveBeenCalled();
  });

  it('debe listar tiendas con participación y storefront', async () => {
    stores.set([store]);
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="company-store-row"]'),
    ).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Tienda Centro');
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="company-store-link-tienda-1"]')
        .getAttribute('href'),
    ).toBe('/tienda/tienda-1/shop');
  });

  it('debe mostrar carga, vacío y error', async () => {
    storesLoading.set(true);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    storesLoading.set(false);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="company-stores-empty"]'),
    ).not.toBeNull();

    error.set('No se pudieron cargar las tiendas.');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="company-stores-error"]').textContent,
    ).toContain('No se pudieron cargar las tiendas.');
  });
});
