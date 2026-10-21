import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VendorOffersStore } from './vendor-offers.store';
import {
  VENDOR_OFFER_REPOSITORY,
  VendorOfferRepository,
} from '../../repositories/vendor-offer.repository';
import { NotificationService } from '../../../../core/services/notification.service';
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

describe('VendorOffersStore', () => {
  let repo: VendorOfferRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      listOffers: vi.fn((page: number, limit: number) =>
        of({ items: [offer], total: 1, page, limit, pages: 1 }),
      ),
      updateMargin: vi.fn(() => of({ ...offer, margin: 25, salePrice: 1250 })),
    };
    TestBed.configureTestingModule({
      providers: [
        VendorOffersStore,
        { provide: VENDOR_OFFER_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(VendorOffersStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe iniciar sin ofertas', () => {
    const store = setup();

    expect(store.offers()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.hasOffers()).toBe(false);
  });

  it('debe cargar una página de ofertas', async () => {
    const store = setup();

    store.loadPage(1);

    await vi.waitFor(() => expect(store.offers()).toEqual([offer]));
    expect(repo.listOffers).toHaveBeenCalledWith(1, 20);
    expect(store.loading()).toBe(false);
    expect(store.pages()).toBe(1);
    expect(store.isFirstPage()).toBe(true);
    expect(store.isLastPage()).toBe(true);
  });

  it('debe recargar la página actual', async () => {
    const store = setup();
    store.loadPage(2);
    await vi.waitFor(() => expect(repo.listOffers).toHaveBeenCalledWith(2, 20));

    store.refresh();

    await vi.waitFor(() => expect(repo.listOffers).toHaveBeenCalledTimes(2));
    expect(repo.listOffers).toHaveBeenLastCalledWith(2, 20);
  });

  it('debe registrar el error al cargar sin mensaje', async () => {
    const store = setup();
    vi.mocked(repo.listOffers).mockReturnValue(throwError(() => new Error('')));

    store.loadPage(1);

    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar tus ofertas.'));
    expect(store.loading()).toBe(false);
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe actualizar el margen y reemplazar la fila', async () => {
    const store = setup();
    store.loadPage(1);
    await vi.waitFor(() => expect(store.offers()).toEqual([offer]));

    store.updateMargin({ offerId: 'of-1', margin: 25 });

    await vi.waitFor(() => expect(store.offers()[0]?.margin).toBe(25));
    expect(repo.updateMargin).toHaveBeenCalledWith('of-1', 25);
    expect(store.offers()[0]?.salePrice).toBe(1250);
    expect(store.savingId()).toBeNull();
    expect(notification.showSuccess).toHaveBeenCalledWith('Margen actualizado.');
  });

  it('debe registrar el error al actualizar el margen sin mensaje', async () => {
    const store = setup();
    vi.mocked(repo.updateMargin).mockReturnValue(throwError(() => new Error('')));

    store.updateMargin({ offerId: 'of-1', margin: 25 });

    await vi.waitFor(() => expect(store.error()).toBe('No se pudo actualizar el margen.'));
    expect(store.savingId()).toBeNull();
  });

  it('debe limpiar el error y reiniciar el estado', async () => {
    const store = setup();
    vi.mocked(repo.listOffers).mockReturnValue(throwError(() => new Error('boom')));
    store.loadPage(1);
    await vi.waitFor(() => expect(store.error()).toBe('boom'));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.offers()).toEqual([]);
    expect(store.page()).toBe(1);
  });
});
