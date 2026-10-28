import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import { CREDITS_SCOPE_CONFIG } from '../../../../shared/credits/constants/credits-config.tokens';
import type { CreditsScopeConfig } from '../../../../shared/credits/models/credits-config.model';
import { CreditsStore } from './credits.store';
import { creditsStorageKey } from '../../public-api';
import type { CreditRecord } from '../../models/credit.model';

function localDate(daysFromToday = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function credit(overrides: Partial<CreditRecord> = {}): CreditRecord {
  return {
    id: 'credit-1',
    customer: 'Carla',
    concept: 'Pedido',
    date: localDate(),
    dueDate: localDate(5),
    amount: 100,
    balance: 100,
    ...overrides,
  };
}

const COMPANY_CONFIG: CreditsScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Créditos',
  subtitle: 'Empresa',
};

const VENDOR_CONFIG: CreditsScopeConfig = {
  scope: 'vendor',
  storageScope: 'store',
  title: 'Créditos',
  subtitle: 'Tienda',
};

describe('CreditsStore', () => {
  const tenantId = signal<string | null>('tenant-1');
  const storeId = signal<string | null>('store-1');
  const authStore = {
    user: computed(() => ({ id: 'u-1', tenantId: tenantId(), storeId: storeId() })),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = (config: CreditsScopeConfig = COMPANY_CONFIG) => {
    TestBed.configureTestingModule({
      providers: [
        CreditsStore,
        { provide: AuthStore, useValue: authStore },
        { provide: CREDITS_SCOPE_CONFIG, useValue: config },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CreditsStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('tenant-1');
    storeId.set('store-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe cargar los créditos de empresa del tenant activo', () => {
    localStorage.setItem(
      creditsStorageKey('company', 'tenant-1'),
      JSON.stringify([credit({ id: 'company-record' })]),
    );
    localStorage.setItem(
      creditsStorageKey('company', 'tenant-2'),
      JSON.stringify([credit({ id: 'other-tenant' })]),
    );

    const store = setup();

    expect(store.records().map((item) => item.id)).toEqual(['company-record']);
    expect(store.summary()).toEqual({
      outstandingTotal: 100,
      overdueTotal: 0,
      collectedTotal: 0,
      activeCount: 1,
    });
  });

  it('debe aislar los créditos de la tienda de los de empresa', () => {
    localStorage.setItem(
      creditsStorageKey('company', 'tenant-1'),
      JSON.stringify([credit({ id: 'company-record' })]),
    );
    localStorage.setItem(
      creditsStorageKey('store', 'store-1'),
      JSON.stringify([credit({ id: 'store-record' })]),
    );

    const store = setup(VENDOR_CONFIG);

    expect(store.records().map((item) => item.id)).toEqual(['store-record']);
  });

  it('debe registrar, pagar y eliminar créditos', async () => {
    const store = setup();

    expect(
      store.addCredit({
        customer: '  Carla  ',
        concept: '  Pedido  ',
        dueDate: localDate(5),
        amount: 250,
      }).ok,
    ).toBe(true);
    expect(store.records()).toHaveLength(1);
    expect(store.summary().outstandingTotal).toBe(250);
    expect(notification.showSuccess).toHaveBeenCalledWith('Crédito registrado.');

    const id = store.records()[0].id;
    store.markPaid(id);
    expect(store.rows()[0]).toMatchObject({ balance: 0, paid: true });
    expect(store.summary().collectedTotal).toBe(250);
    expect(notification.showSuccess).toHaveBeenCalledWith('Crédito marcado como pagado.');

    store.removeCredit(id);
    expect(store.records()).toEqual([]);
    expect(notification.showSuccess).toHaveBeenCalledWith('Crédito eliminado.');

    await vi.waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(creditsStorageKey('company', 'tenant-1')) ?? '[]'),
      ).toEqual([]),
    );
  });

  it('debe marcar vencidos y rechazar créditos inválidos o el límite', () => {
    localStorage.setItem(
      creditsStorageKey('company', 'tenant-1'),
      JSON.stringify([credit({ id: 'overdue', dueDate: localDate(-1) })]),
    );
    const store = setup();

    expect(store.rows()[0].overdue).toBe(true);
    expect(store.summary().overdueTotal).toBe(100);
    expect(store.addCredit({ customer: '', concept: '', dueDate: '', amount: 0 })).toEqual({
      ok: false,
      message: 'Revisa cliente, concepto, vencimiento e importe.',
    });

    localStorage.setItem(
      creditsStorageKey('company', 'tenant-1'),
      JSON.stringify(Array.from({ length: 500 }, (_, index) => credit({ id: `c-${index}` }))),
    );
    TestBed.resetTestingModule();
    const fullStore = setup();

    expect(
      fullStore.addCredit({
        customer: 'Carla',
        concept: 'Pedido',
        dueDate: localDate(1),
        amount: 1,
      }),
    ).toEqual({ ok: false, message: 'Alcanzaste el límite de créditos.' });
  });

  it('debe ignorar storage corrupto', () => {
    localStorage.setItem(creditsStorageKey('company', 'tenant-1'), '{');
    const store = setup();

    expect(store.records()).toEqual([]);
    expect(store.hasRecords()).toBe(false);
  });
});
