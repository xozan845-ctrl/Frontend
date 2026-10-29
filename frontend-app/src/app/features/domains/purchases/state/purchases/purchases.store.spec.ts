import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import { legacyFinancePurchasesKey, purchaseStorageKey } from '../../constants/purchases.constants';
import { PurchasesStore } from './purchases.store';

function localDate(daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const BASE_PURCHASE = {
  date: localDate(),
  supplierName: 'Distribuidora',
  paymentMethod: 'efectivo' as const,
  status: 'recibida' as const,
  origin: 'productos' as const,
  costType: 'inventario' as const,
  lines: [{ productId: 'p-1', name: 'Taladro', sku: 'TAL-1', quantity: 2, unitCost: 100 }],
};

describe('PurchasesStore', () => {
  const tenantId = signal<string | null>('tenant-1');
  const authStore = {
    user: computed(() => ({ id: 'u-1', tenantId: tenantId() })),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        PurchasesStore,
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(PurchasesStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('tenant-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('arranca vacío con los filtros por defecto', () => {
    const store = setup();
    expect(store.records()).toEqual([]);
    expect(store.period()).toBe('mes');
    expect(store.status()).toBe('todas');
    expect(store.nextPurchaseNumber()).toBe('C-0001');
    expect(store.nextOrderNumber()).toBe('OC-0001');
    expect(store.kpis().totalCount).toBe(0);
  });

  it('registra compras, proveedor y KPIs', () => {
    const store = setup();
    const result = store.addPurchase(BASE_PURCHASE);

    expect(result.ok).toBe(true);
    expect(store.records()).toHaveLength(1);
    expect(store.suppliers()).toHaveLength(1);
    expect(store.records()[0]).toMatchObject({
      number: 'C-0001',
      supplierName: 'Distribuidora',
      total: 200,
    });
    expect(store.suppliers()[0].name).toBe('Distribuidora');
    expect(store.kpis().todayTotal).toBe(200);
    expect(store.historyRows()[0].productsLabel).toBe('Taladro');
    expect(store.nextPurchaseNumber()).toBe('C-0002');
  });

  it('rechaza compras inválidas y no crea proveedores', () => {
    const store = setup();
    const result = store.addPurchase({ ...BASE_PURCHASE, lines: [] });

    expect(result.ok).toBe(false);
    expect(result.message).toBeDefined();
    expect(store.records()).toHaveLength(0);
  });

  it('expone los derivados de historial, proveedores y órdenes', () => {
    const store = setup();
    store.addPurchase(BASE_PURCHASE);
    store.addOrder({
      date: localDate(),
      supplierName: 'Distribuidora',
      lines: [{ name: 'Taladro', quantity: 1, unitCost: 100 }],
    });

    expect(store.hasRecords()).toBe(true);
    expect(store.hasFilteredRecords()).toBe(true);
    expect(store.hasSuppliers()).toBe(true);
    expect(store.hasOrders()).toBe(true);
    expect(store.isFirstPage()).toBe(true);
    expect(store.isLastPage()).toBe(true);
    expect(store.supplierRows()).toHaveLength(1);
    expect(store.orderRows()).toHaveLength(1);
    expect(store.orderCount()).toBe(1);
  });

  it('rechaza compras directas, productos nuevos y órdenes inválidas', () => {
    const store = setup();
    expect(
      store.addDirectPurchase({
        date: localDate(),
        concept: '',
        costType: 'servicio',
        amount: 50,
        paymentMethod: 'efectivo',
      }).ok,
    ).toBe(false);
    expect(
      store.addNewProductPurchase({
        date: localDate(),
        productName: '',
        paymentMethod: 'efectivo',
        unitCost: 30,
        salePrice: 45,
        quantity: 1,
      }).ok,
    ).toBe(false);
    expect(
      store.addOrder({
        date: localDate(),
        supplierName: 'Distribuidora',
        lines: [],
      }).ok,
    ).toBe(false);
    expect(store.records()).toHaveLength(0);
    expect(store.orders()).toHaveLength(0);
  });

  it('registra compra directa, producto nuevo y orden', () => {
    const store = setup();

    expect(
      store.addDirectPurchase({
        date: localDate(),
        concept: 'Mantenimiento',
        costType: 'servicio',
        amount: 50,
        paymentMethod: 'efectivo',
      }).ok,
    ).toBe(true);
    expect(
      store.addNewProductPurchase({
        date: localDate(),
        productName: 'Martillo',
        category: 'Herramientas',
        sku: 'MAR-1',
        paymentMethod: 'efectivo',
        unitCost: 30,
        salePrice: 45,
        quantity: 2,
      }).ok,
    ).toBe(true);
    expect(
      store.addOrder({
        date: localDate(),
        supplierName: 'Distribuidora',
        lines: [{ name: 'Taladro', quantity: 1, unitCost: 100 }],
      }).ok,
    ).toBe(true);

    expect(store.records()).toHaveLength(2);
    expect(store.records().some((record) => record.origin === 'directa')).toBe(true);
    expect(store.records().some((record) => record.origin === 'productos')).toBe(true);
    expect(store.orders()).toHaveLength(1);
    expect(store.nextOrderNumber()).toBe('OC-0002');
  });

  it('convierte órdenes y las anula', () => {
    const store = setup();
    store.addOrder({
      date: localDate(),
      supplierName: 'Distribuidora',
      lines: [{ name: 'Taladro', quantity: 1, unitCost: 100 }],
    });
    const orderId = store.orders()[0].id;

    expect(store.convertOrderToPurchase(orderId).ok).toBe(true);
    expect(store.orders()[0].status).toBe('convertida');
    expect(store.records()).toHaveLength(1);
    expect(store.records()[0].notes).toContain('OC-0001');

    expect(store.convertOrderToPurchase(orderId).ok).toBe(false);

    const secondOrder = store.addOrder({
      date: localDate(),
      supplierName: 'Ferretería',
      lines: [{ name: 'Clavos', quantity: 2, unitCost: 5 }],
    });
    expect(secondOrder.ok).toBe(true);
    store.cancelOrder(store.orders()[0].id);
    expect(store.orders()[0].status).toBe('anulada');
  });

  it('anula y elimina compras', () => {
    const store = setup();
    store.addPurchase(BASE_PURCHASE);
    const id = store.records()[0].id;

    store.cancelPurchase(id);
    expect(store.records()[0].status).toBe('anulada');
    expect(store.kpis().cancelledCount).toBe(1);

    store.removePurchase(id);
    expect(store.records()).toHaveLength(0);
  });

  it('administra proveedores y evita duplicados', () => {
    const store = setup();
    expect(store.addSupplier({ name: '  Proveedor Uno  ' }).ok).toBe(true);
    expect(store.suppliers()[0].name).toBe('Proveedor Uno');
    expect(store.addSupplier({ name: 'proveedor uno' }).ok).toBe(false);
    expect(store.addSupplier({ name: '' }).ok).toBe(false);
  });

  it('guarda las preferencias de documentos saneadas', () => {
    const store = setup();
    store.updateDocumentSettings({
      logoSize: 'grande',
      headerColor: '#abcdef',
      matchTableColor: false,
      footerMessage: '  Gracias  ',
      showRuc: false,
      showAddress: true,
      showPhone: false,
    });

    expect(store.documentSettings()).toEqual({
      logoSize: 'grande',
      headerColor: '#ABCDEF',
      matchTableColor: false,
      footerMessage: 'Gracias',
      showRuc: false,
      showAddress: true,
      showPhone: false,
    });
  });

  it('filtra, busca y pagina el historial', () => {
    const store = setup();
    for (let index = 1; index <= 9; index += 1) {
      store.addPurchase({
        ...BASE_PURCHASE,
        supplierName: `Proveedor ${index}`,
      });
    }
    expect(store.pageCount()).toBe(2);
    expect(store.pagedRows()).toHaveLength(8);
    expect(store.isLastPage()).toBe(false);

    store.nextPage();
    expect(store.currentPage()).toBe(2);
    expect(store.pagedRows()).toHaveLength(1);
    expect(store.isLastPage()).toBe(true);
    store.previousPage();
    expect(store.currentPage()).toBe(1);

    store.setQuery('proveedor 9');
    expect(store.filteredCount()).toBe(1);
    expect(store.pagedRows()[0].supplierName).toBe('Proveedor 9');

    store.clearFilters();
    expect(store.query()).toBe('');
    expect(store.period()).toBe('mes');

    store.setPeriod('año');
    expect(store.period()).toBe('año');
    store.setCustomFrom(localDate());
    expect(store.isCustomPeriod()).toBe(true);
    store.setCustomTo(localDate());
    expect(store.isCustomPeriod()).toBe(true);
    store.setPage(2);
    expect(store.currentPage()).toBe(2);
    store.setStatus('anulada');
    expect(store.filteredCount()).toBe(0);
    store.reset();
    expect(store.records()).toHaveLength(0);
    expect(store.period()).toBe('mes');
  });

  it('tolera storage corrupto sin romper la carga', () => {
    localStorage.setItem(purchaseStorageKey('records', 'tenant-1'), '{');
    const store = setup();
    expect(store.records()).toEqual([]);
  });

  it('migra las compras heredadas y deriva proveedores', () => {
    localStorage.setItem(
      legacyFinancePurchasesKey('tenant-1'),
      JSON.stringify([
        {
          id: 'old-1',
          date: localDate(),
          supplier: 'Proveedor heredado',
          concept: 'Compra vieja',
          amount: 90,
          status: 'pagada',
        },
      ]),
    );
    const store = setup();

    expect(store.records()).toHaveLength(1);
    expect(store.records()[0]).toMatchObject({
      number: 'C-0001',
      status: 'recibida',
      supplierName: 'Proveedor heredado',
    });
    expect(store.suppliers()[0].name).toBe('Proveedor heredado');
    expect(store.historyRows()[0].productsLabel).toBe('Compra vieja');
    expect(purchaseStorageKey('records', 'tenant-1')).toContain('tenant-1');
  });

  it('carga una selección previa desde el storage del tenant', () => {
    localStorage.setItem(
      purchaseStorageKey('records', 'tenant-1'),
      JSON.stringify([
        {
          id: 'saved-1',
          number: 'C-0500',
          date: localDate(),
          supplierId: null,
          supplierName: 'Guardado',
          paymentMethod: 'tarjeta',
          status: 'pendiente',
          origin: 'directa',
          costType: 'gasto',
          lines: [
            {
              id: 'line-saved',
              productId: null,
              name: 'Servicio',
              sku: '',
              quantity: 1,
              unitCost: 25,
              salePrice: null,
            },
          ],
          subtotal: 25,
          retention: 0,
          total: 25,
          notes: '',
          userName: '',
          createdAt: `${localDate()}T12:00:00.000Z`,
        },
      ]),
    );
    localStorage.setItem(
      purchaseStorageKey('document', 'tenant-1'),
      JSON.stringify({ headerColor: '#123456', logoSize: 'grande' }),
    );

    const store = setup();
    expect(store.records()).toHaveLength(1);
    expect(store.nextPurchaseNumber()).toBe('C-0501');
    expect(store.documentSettings().headerColor).toBe('#123456');
  });
});
