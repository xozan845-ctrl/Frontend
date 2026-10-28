import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import { PAYABLES_SCOPE_CONFIG } from '../../../../shared/payables/constants/payables-config.tokens';
import type { PayablesScopeConfig } from '../../../../shared/payables/models/payables-config.model';
import { payablesStorageKey } from '../../public-api';
import { PayablesStore } from './payables.store';
import type { PayableRecord } from '../../models/payables.model';

function localDate(daysFromToday = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function payable(overrides: Partial<PayableRecord> = {}): PayableRecord {
  return {
    id: 'payable-1',
    supplier: 'Proveedor',
    concept: 'Factura',
    dueDate: localDate(5),
    amount: 100,
    status: 'pendiente',
    paidAt: '',
    ...overrides,
  };
}

const COMPANY_CONFIG: PayablesScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Cuentas por pagar',
  subtitle: 'Empresa',
};

const VENDOR_CONFIG: PayablesScopeConfig = {
  scope: 'vendor',
  storageScope: 'store',
  title: 'Cuentas por pagar',
  subtitle: 'Tienda',
};

describe('PayablesStore', () => {
  const tenantId = signal<string | null>('tenant-1');
  const storeId = signal<string | null>('store-1');
  const authStore = {
    user: computed(() => ({ id: 'u-1', tenantId: tenantId(), storeId: storeId() })),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = (config: PayablesScopeConfig = COMPANY_CONFIG) => {
    TestBed.configureTestingModule({
      providers: [
        PayablesStore,
        { provide: AuthStore, useValue: authStore },
        { provide: PAYABLES_SCOPE_CONFIG, useValue: config },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(PayablesStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('tenant-1');
    storeId.set('store-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe cargar las cuentas de empresa del tenant activo', () => {
    localStorage.setItem(
      payablesStorageKey('company', 'tenant-1'),
      JSON.stringify([payable({ id: 'company-record' })]),
    );
    localStorage.setItem(
      payablesStorageKey('company', 'tenant-2'),
      JSON.stringify([payable({ id: 'other-tenant' })]),
    );

    const store = setup(COMPANY_CONFIG);

    expect(store.records().map((record) => record.id)).toEqual(['company-record']);
  });

  it('debe aislar las cuentas de la tienda de las de empresa', () => {
    localStorage.setItem(
      payablesStorageKey('company', 'tenant-1'),
      JSON.stringify([payable({ id: 'company-record' })]),
    );
    localStorage.setItem(
      payablesStorageKey('store', 'store-1'),
      JSON.stringify([payable({ id: 'store-record' })]),
    );

    const store = setup(VENDOR_CONFIG);

    expect(store.records().map((record) => record.id)).toEqual(['store-record']);
  });

  it('debe registrar, pagar y eliminar cuentas con sus avisos', async () => {
    const store = setup();

    expect(
      store.addPayable({
        supplier: '  Proveedor  ',
        concept: '  Factura  ',
        dueDate: localDate(5),
        amount: 250,
      }).ok,
    ).toBe(true);
    expect(store.records()).toHaveLength(1);
    expect(store.summary()).toMatchObject({ pendingTotal: 250, pendingCount: 1 });
    expect(notification.showSuccess).toHaveBeenCalledWith('Cuenta por pagar registrada.');

    const id = store.records()[0].id;
    store.markPaid(id);
    expect(store.rows()[0]).toMatchObject({ status: 'pagada' });
    expect(store.rows()[0].paidAt).not.toBe('');
    expect(notification.showSuccess).toHaveBeenCalledWith('Cuenta marcada como pagada.');

    store.removePayable(id);
    expect(store.records()).toEqual([]);
    expect(notification.showSuccess).toHaveBeenCalledWith('Cuenta por pagar eliminada.');

    await vi.waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(payablesStorageKey('company', 'tenant-1')) ?? '[]'),
      ).toEqual([]),
    );
  });

  it('debe marcar como vencidas las cuentas pendientes con fecha pasada', () => {
    localStorage.setItem(
      payablesStorageKey('company', 'tenant-1'),
      JSON.stringify([
        payable({ id: 'overdue', dueDate: localDate(-1) }),
        payable({ id: 'today', dueDate: localDate(0) }),
      ]),
    );
    const store = setup();

    expect(store.rows().find((row) => row.id === 'overdue')?.overdue).toBe(true);
    expect(store.rows().find((row) => row.id === 'today')?.overdue).toBe(false);
    expect(store.summary()).toMatchObject({ overdueTotal: 100 });
  });

  it('debe rechazar payloads inválidos y respetar el límite', () => {
    const store = setup();

    expect(store.addPayable({ supplier: '', concept: '', dueDate: '', amount: 0 })).toEqual({
      ok: false,
      message: 'Revisa proveedor, concepto, vencimiento e importe.',
    });
    expect(notification.showSuccess).not.toHaveBeenCalled();

    localStorage.setItem(
      payablesStorageKey('company', 'tenant-1'),
      JSON.stringify(Array.from({ length: 500 }, (_, index) => payable({ id: `p-${index}` }))),
    );
    TestBed.resetTestingModule();
    const fullStore = setup();

    expect(
      fullStore.addPayable({
        supplier: 'Proveedor',
        concept: 'Factura',
        dueDate: localDate(1),
        amount: 1,
      }),
    ).toEqual({ ok: false, message: 'Alcanzaste el límite de cuentas por pagar.' });
  });

  it('debe ignorar storage corrupto', () => {
    localStorage.setItem(payablesStorageKey('company', 'tenant-1'), '{');
    const store = setup();

    expect(store.records()).toEqual([]);
    expect(store.hasRecords()).toBe(false);
  });
});
