import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import { BARCODES_SCOPE_CONFIG } from '../../../../../shared/barcodes/constants/barcodes-config.tokens';
import type { BarcodesScopeConfig } from '../../../../../shared/barcodes/models/barcodes-config.model';
import { BarcodesStore } from './barcodes.store';
import { barcodesStorageKey } from '../../public-api';
import { generateEan13 } from '../../adapters/barcodes/barcodes.adapter';
import type { BarcodeLabel } from '../../models/barcode.model';

function label(overrides: Partial<BarcodeLabel> = {}): BarcodeLabel {
  return {
    id: 'barcode-1',
    productName: 'Camisa',
    sku: 'SKU-1',
    code: generateEan13('123'),
    symbology: 'EAN13',
    copies: 2,
    createdAt: '2026-10-28T12:00:00.000Z',
    ...overrides,
  };
}

const COMPANY_CONFIG: BarcodesScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Códigos de barras',
  subtitle: 'Empresa',
};

const VENDOR_CONFIG: BarcodesScopeConfig = {
  scope: 'vendor',
  storageScope: 'store',
  title: 'Códigos de barras',
  subtitle: 'Tienda',
};

describe('BarcodesStore', () => {
  const tenantId = signal<string | null>('tenant-1');
  const storeId = signal<string | null>('store-1');
  const authStore = {
    user: computed(() => ({ id: 'u-1', tenantId: tenantId(), storeId: storeId() })),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = (config: BarcodesScopeConfig = COMPANY_CONFIG) => {
    TestBed.configureTestingModule({
      providers: [
        BarcodesStore,
        { provide: AuthStore, useValue: authStore },
        { provide: BARCODES_SCOPE_CONFIG, useValue: config },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(BarcodesStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('tenant-1');
    storeId.set('store-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe cargar las etiquetas de empresa del tenant activo', () => {
    localStorage.setItem(
      barcodesStorageKey('company', 'tenant-1'),
      JSON.stringify([label({ id: 'company-record' })]),
    );
    localStorage.setItem(
      barcodesStorageKey('company', 'tenant-2'),
      JSON.stringify([label({ id: 'other-tenant' })]),
    );

    const store = setup();

    expect(store.labels().map((item) => item.id)).toEqual(['company-record']);
    expect(store.summary()).toEqual({ labelsCount: 1, totalCopies: 2 });
  });

  it('debe aislar las etiquetas de la tienda de las de empresa', () => {
    localStorage.setItem(
      barcodesStorageKey('company', 'tenant-1'),
      JSON.stringify([label({ id: 'company-record' })]),
    );
    localStorage.setItem(
      barcodesStorageKey('store', 'store-1'),
      JSON.stringify([label({ id: 'store-record' })]),
    );

    const store = setup(VENDOR_CONFIG);

    expect(store.labels().map((item) => item.id)).toEqual(['store-record']);
  });

  it('debe registrar y eliminar etiquetas', async () => {
    const store = setup();

    expect(
      store.addLabel({
        productName: '  Camisa  ',
        sku: '  SKU-1  ',
        code: '',
        symbology: 'CODE128',
        copies: 5,
      }).ok,
    ).toBe(true);
    expect(store.labels()).toHaveLength(1);
    expect(store.summary()).toEqual({ labelsCount: 1, totalCopies: 5 });
    expect(notification.showSuccess).toHaveBeenCalledWith('Código de barras registrado.');

    store.removeLabel(store.labels()[0].id);
    expect(store.labels()).toEqual([]);
    expect(notification.showSuccess).toHaveBeenCalledWith('Código de barras eliminado.');

    await vi.waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(barcodesStorageKey('company', 'tenant-1')) ?? '[]'),
      ).toEqual([]),
    );
  });

  it('debe rechazar etiquetas inválidas y respetar el límite', () => {
    const store = setup();

    expect(
      store.addLabel({
        productName: '',
        sku: '',
        code: '',
        symbology: 'EAN13',
        copies: 0,
      }),
    ).toEqual({ ok: false, message: 'Revisa producto, SKU, código, simbología y copias.' });

    localStorage.setItem(
      barcodesStorageKey('company', 'tenant-1'),
      JSON.stringify(Array.from({ length: 500 }, (_, index) => label({ id: `b-${index}` }))),
    );
    TestBed.resetTestingModule();
    const fullStore = setup();

    expect(
      fullStore.addLabel({
        productName: 'Camisa',
        sku: 'SKU-1',
        code: '',
        symbology: 'EAN13',
        copies: 1,
      }),
    ).toEqual({ ok: false, message: 'Alcanzaste el límite de códigos de barras.' });
  });

  it('debe ignorar storage corrupto', () => {
    localStorage.setItem(barcodesStorageKey('company', 'tenant-1'), '{');
    const store = setup();

    expect(store.labels()).toEqual([]);
    expect(store.hasLabels()).toBe(false);
  });
});
