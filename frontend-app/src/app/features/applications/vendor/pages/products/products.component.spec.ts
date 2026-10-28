import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import VendorProductsComponent from './products.component';
import { VendorOffersStore } from '../../state/vendor-offers/vendor-offers.store';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { VendorOffer } from '../../models/vendor-offer.model';

const offer: VendorOffer = {
  id: 'of-1',
  storeId: 't-1',
  productId: 'p-1',
  sku: 'SKU-001',
  productName: 'Teclado Mecánico',
  margin: 15,
  basePrice: 1000,
  salePrice: 1150,
  stock: 10,
  status: 'activa',
  createdAt: '2026-10-21T00:00:00.000Z',
};

describe('VendorProductsComponent', () => {
  const offersSignal = signal<VendorOffer[]>([]);
  const total = signal(0);
  const page = signal(1);
  const pages = signal(1);
  const loading = signal(false);
  const savingId = signal<string | null>(null);
  const error = signal<string | null>(null);

  const store = {
    offers: offersSignal.asReadonly(),
    total: total.asReadonly(),
    page: page.asReadonly(),
    pages: pages.asReadonly(),
    loading: loading.asReadonly(),
    savingId: savingId.asReadonly(),
    error: error.asReadonly(),
    isFirstPage: () => page() <= 1,
    isLastPage: () => page() >= pages(),
    hasOffers: () => offersSignal().length > 0,
    loadPage: vi.fn(),
    refresh: vi.fn(),
    updateMargin: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [VendorProductsComponent],
      providers: [
        provideRouter([]),
        { provide: VendorOffersStore, useValue: store },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(VendorProductsComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    offersSignal.set([]);
    total.set(0);
    page.set(1);
    pages.set(1);
    loading.set(false);
    savingId.set(null);
    error.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar la primera página al entrar', async () => {
    await setup();

    expect(store.loadPage).toHaveBeenCalledWith(1);
  });

  it('debe mostrar las ofertas con precios y margen', async () => {
    offersSignal.set([offer]);
    total.set(1);
    const fixture = await setup();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="offer-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Teclado Mecánico');
    expect(rows[0].textContent).toContain('SKU-001');
    expect(
      fixture.nativeElement.querySelector('[data-testid="offer-sale-price"]').textContent,
    ).toContain('1,150.00');
  });

  it('debe guardar un margen válido', async () => {
    offersSignal.set([offer]);
    const fixture = await setup();

    const input = fixture.nativeElement.querySelector(
      '[data-testid="offer-margin"]',
    ) as HTMLInputElement;
    input.value = '25';
    input.dispatchEvent(new Event('input'));
    fixture.componentInstance.saveMargin(offer);

    expect(store.updateMargin).toHaveBeenCalledWith({ offerId: 'of-1', margin: 25 });
  });

  it('no debe guardar un margen fuera de rango', async () => {
    offersSignal.set([offer]);
    const fixture = await setup();

    fixture.componentInstance.marginDrafts.set({ 'of-1': 100 });
    fixture.componentInstance.saveMargin(offer);
    fixture.detectChanges();

    expect(store.updateMargin).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="offer-validation-error"]').textContent,
    ).toContain('entre 0 y 90');
  });

  it('debe navegar a la página anterior y siguiente', async () => {
    offersSignal.set([offer]);
    page.set(2);
    pages.set(3);
    const fixture = await setup();
    vi.mocked(store.loadPage).mockClear();

    fixture.componentInstance.previousPage();
    fixture.componentInstance.nextPage();

    expect(store.loadPage).toHaveBeenNthCalledWith(1, 1);
    expect(store.loadPage).toHaveBeenNthCalledWith(2, 3);
  });

  it('debe mostrar el estado de carga', async () => {
    loading.set(true);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });

  it('debe mostrar el estado vacío', async () => {
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[data-testid="offers-empty"]')).not.toBeNull();
  });

  it('debe mostrar el error y reintentar', async () => {
    error.set('No se pudieron cargar tus ofertas.');
    const fixture = await setup();

    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar tus ofertas.');
    fixture.componentInstance.refresh();

    expect(store.refresh).toHaveBeenCalled();
  });
});
