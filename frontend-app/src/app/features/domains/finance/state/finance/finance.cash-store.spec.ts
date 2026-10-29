import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import {
  CASH_PETTY_MAX_RECORDS,
  cashToday,
  financeStorageKey,
  type CashMovement,
  type PettyCashMovement,
} from '../../public-api';
import { FinanceStore } from './finance.store';

function localDate(daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function movement(overrides: Partial<CashMovement> = {}): CashMovement {
  return {
    id: `cash-${Math.random().toString(36).slice(2, 8)}`,
    date: localDate(),
    createdAt: new Date().toISOString(),
    type: 'ingreso',
    concept: 'Movimiento',
    amount: 100,
    currency: 'NIO',
    originalAmount: 100,
    exchangeRate: 1,
    paymentMethod: 'efectivo',
    category: 'aporte',
    source: 'manual',
    status: 'completado',
    reference: '',
    observations: '',
    ...overrides,
  };
}

function pettyMovement(overrides: Partial<PettyCashMovement> = {}): PettyCashMovement {
  return {
    id: `petty-${Math.random().toString(36).slice(2, 8)}`,
    date: localDate(),
    type: 'gasto',
    concept: 'Café',
    amount: 10,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('FinanceStore — caja', () => {
  const tenantId = signal<string | null>('tenant-1');
  const authStore = {
    user: computed(() => ({ id: 'u-1', tenantId: tenantId() })),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        FinanceStore,
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(FinanceStore);
  };

  const addMovement = (store: ReturnType<typeof setup>, overrides: Partial<CashMovement> = {}) => {
    const payload = movement(overrides);
    return store.addCashMovement({
      date: payload.date,
      type: payload.type,
      concept: payload.concept,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      category: payload.category,
      observations: payload.observations,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('tenant-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe sembrar métodos de pago y administrarlos', () => {
    const store = setup();

    expect(store.methods()).toHaveLength(5);
    expect(store.hasMethods()).toBe(true);

    const created = store.addPaymentMethod({ name: 'Cheque', kind: 'cheque' });
    expect(created.ok).toBe(true);
    expect(store.methods()).toHaveLength(6);
    expect(created.method?.icon).toContain('money-check');

    store.togglePaymentMethod(created.method!.id);
    expect(store.methods().find((method) => method.id === created.method!.id)?.active).toBe(false);

    expect(store.addPaymentMethod({ name: '', kind: 'otro' }).ok).toBe(false);
    expect(store.removePaymentMethod(created.method!.id).ok).toBe(true);
    expect(store.methods()).toHaveLength(5);

    addMovement(store, { paymentMethod: 'tarjeta' });
    expect(store.removePaymentMethod('tarjeta')).toMatchObject({ ok: false });
    for (const movement of store.cash()) {
      store.removeCashMovement(movement.id);
    }

    for (const method of store.methods().slice(1)) {
      expect(store.removePaymentMethod(method.id).ok).toBe(true);
    }
    expect(store.methods()).toHaveLength(1);
    expect(store.removePaymentMethod(store.methods()[0].id).ok).toBe(false);
  });

  it('debe conservar una lista vacía de métodos si el storage existe vacío', () => {
    localStorage.setItem(financeStorageKey('cash-methods', 'tenant-1'), JSON.stringify([]));
    const store = setup();

    expect(store.methods()).toEqual([]);
    expect(store.activeMethods()).toEqual([]);
  });

  it('debe calcular el cierre diario y bloquear duplicados o fechas distintas', () => {
    const store = setup();
    addMovement(store, { amount: 300, date: localDate(1) });
    addMovement(store, { amount: 200 });
    addMovement(store, { type: 'egreso', category: 'gasto', amount: 50 });

    expect(store.closurePreview()).toMatchObject({
      openingBalance: 300,
      income: 200,
      expense: 50,
      expectedBalance: 450,
      movementsCount: 2,
    });

    expect(store.addCashClosure({ date: localDate(1), countedBalance: 100 }).ok).toBe(false);
    expect(store.addCashClosure({ date: cashToday(), countedBalance: -1 }).ok).toBe(false);

    const result = store.addCashClosure({ date: cashToday(), countedBalance: 440, notes: 'Faltó' });
    expect(result.ok).toBe(true);
    expect(result.closure).toMatchObject({ difference: -10, notes: 'Faltó' });
    expect(store.hasClosures()).toBe(true);
    expect(store.addCashClosure({ date: cashToday(), countedBalance: 440 }).ok).toBe(false);
    expect(store.closurePreview().existing?.id).toBe(result.closure?.id);
  });

  it('debe administrar el fondo y los movimientos de caja chica', () => {
    const store = setup();

    expect(store.updatePettyFund(-1, '').ok).toBe(false);
    expect(store.updatePettyFund(1000, 'Karla').ok).toBe(true);
    expect(store.pettyFund()).toMatchObject({ amount: 1000, responsible: 'Karla' });

    expect(store.addPettyCashMovement({ date: '', type: 'gasto', concept: '', amount: 0 }).ok).toBe(
      false,
    );
    const expense = store.addPettyCashMovement({
      date: cashToday(),
      type: 'gasto',
      concept: 'Café',
      amount: 100,
    });
    const replenish = store.addPettyCashMovement({
      date: cashToday(),
      type: 'reposicion',
      concept: 'Reposición',
      amount: 200,
    });
    expect(expense.ok).toBe(true);
    expect(replenish.ok).toBe(true);
    expect(store.pettySummary()).toMatchObject({
      fund: 1000,
      replenishments: 200,
      expenses: 100,
      balance: 1100,
      movementsCount: 2,
    });
  });

  it('debe respetar el límite de movimientos de caja chica', () => {
    localStorage.setItem(
      financeStorageKey('cash-petty', 'tenant-1'),
      JSON.stringify(
        Array.from({ length: CASH_PETTY_MAX_RECORDS }, (_, index) =>
          pettyMovement({ id: `petty-${index}` }),
        ),
      ),
    );
    const store = setup();

    expect(
      store.addPettyCashMovement({
        date: cashToday(),
        type: 'gasto',
        concept: 'Café',
        amount: 10,
      }).ok,
    ).toBe(false);
  });

  it('debe crear, anular y resumir transferencias internas', () => {
    const store = setup();
    addMovement(store, { amount: 1000 });

    expect(
      store.addCashTransfer({
        date: cashToday(),
        fromId: 'cash',
        fromLabel: 'Caja',
        fromKind: 'cash',
        toId: 'cash',
        toLabel: 'Caja',
        toKind: 'cash',
        amount: 100,
        concept: 'Interna',
      }).ok,
    ).toBe(false);

    const created = store.addCashTransfer({
      date: cashToday(),
      fromId: 'cash',
      fromLabel: 'Caja',
      fromKind: 'cash',
      toId: 'bank-1',
      toLabel: 'BAC',
      toKind: 'bank',
      amount: 250,
      concept: 'Depósito',
    });
    expect(created.ok).toBe(true);
    expect(created.transfer?.fromId).toBe('cash');
    expect(store.cash()).toHaveLength(2);
    expect(store.transferSummary()).toEqual({
      totalTransferred: 250,
      transfersCount: 1,
      cancelledCount: 0,
    });
    expect(store.transferHistory()).toHaveLength(1);

    const transferId = created.transfer!.id;
    expect(store.annulCashTransfer('missing').ok).toBe(false);
    expect(store.annulCashTransfer(transferId).ok).toBe(true);
    expect(store.annulCashTransfer(transferId).ok).toBe(false);
    expect(store.cash().find((item) => item.transferId === transferId)?.status).toBe('anulado');
    expect(store.transferSummary()).toEqual({
      totalTransferred: 0,
      transfersCount: 1,
      cancelledCount: 1,
    });
  });

  it('debe registrar el lado de caja en una transferencia banco → caja', () => {
    const store = setup();
    const result = store.addCashTransfer({
      date: cashToday(),
      fromId: 'bank-1',
      fromLabel: 'BAC',
      fromKind: 'bank',
      toId: 'cash',
      toLabel: 'Caja',
      toKind: 'cash',
      amount: 120,
      concept: 'Retiro',
    });

    expect(result.ok).toBe(true);
    expect(store.cash()[0]).toMatchObject({ type: 'ingreso', amount: 120 });
  });

  it('debe inyectar ventas externas y combinarlas con los movimientos manuales', () => {
    const store = setup();
    addMovement(store, { amount: 100 });
    store.setExternalCash([
      movement({
        id: 'sale-local-1',
        concept: 'Venta V-1',
        amount: 300,
        source: 'venta',
        category: 'venta',
        reference: 'V-1',
      }),
      movement({
        id: 'sale-local-2',
        concept: 'Venta V-2',
        amount: 200,
        source: 'venta',
        category: 'venta',
        date: localDate(1),
      }),
    ]);

    expect(store.cash()).toHaveLength(1);
    expect(store.movements()).toHaveLength(3);
    expect(store.cashKpis()).toMatchObject({
      available: 600,
      monthIncome: 600,
      otherIncome: 100,
    });
    expect(store.methodSummaries().find((item) => item.method.id === 'efectivo')?.count).toBe(3);
  });

  it('debe anular solo movimientos manuales y rechazar ids inexistentes', () => {
    const store = setup();
    const created = addMovement(store, { amount: 500 });
    const id = created.cashMovement!.id;

    expect(store.annulCashMovement('missing').ok).toBe(false);
    expect(store.annulCashMovement(id).ok).toBe(true);
    expect(store.annulCashMovement(id).ok).toBe(false);
    expect(store.cash()[0].status).toBe('anulado');
    expect(store.cashKpis().available).toBe(0);

    store.setExternalCash([movement({ id: 'sale-1', source: 'venta', category: 'venta' })]);
    expect(store.annulCashMovement('sale-1').ok).toBe(false);
  });

  it('debe filtrar, buscar y paginar el libro de caja', () => {
    const store = setup();
    for (let index = 0; index < 17; index += 1) {
      addMovement(store, {
        concept: index === 0 ? 'Cobro especial' : `Movimiento ${index}`,
        amount: index + 1,
        date: localDate(index === 0 ? 1 : 0),
      });
    }

    expect(store.filteredCount()).toBe(17);
    expect(store.pageCount()).toBe(2);
    expect(store.pagedLedger()).toHaveLength(15);
    expect(store.isFirstPage()).toBe(true);

    store.nextCashPage();
    expect(store.currentPage()).toBe(2);
    expect(store.pagedLedger()).toHaveLength(2);
    expect(store.isLastPage()).toBe(true);
    store.nextCashPage();
    expect(store.currentPage()).toBe(2);
    store.previousCashPage();
    expect(store.currentPage()).toBe(1);
    store.previousCashPage();
    expect(store.currentPage()).toBe(1);
    store.setCashPage(2);
    expect(store.currentPage()).toBe(2);

    store.setCashSearch('especial');
    expect(store.filteredCount()).toBe(1);
    expect(store.filters().page).toBe(1);
    expect(store.hasFilteredCash()).toBe(true);

    store.setCashSearch('no-existe');
    expect(store.filteredCount()).toBe(0);
    expect(store.hasFilteredCash()).toBe(false);

    store.setCashPeriod('hoy');
    expect(store.filters().period).toBe('hoy');
    store.setCashPeriod('semana');
    store.setCashPeriod('año');
    store.setCashPeriod('personalizado');

    store.resetCashFilters();
    expect(store.filters()).toEqual({ period: 'mes', search: '', page: 1 });
  });

  it('debe persistir las colecciones nuevas por tenant', async () => {
    const store = setup();
    addMovement(store, { amount: 100 });
    store.addPaymentMethod({ name: 'Cheque', kind: 'cheque' });
    store.addCashClosure({ date: cashToday(), countedBalance: 100 });
    store.updatePettyFund(500, 'Karla');
    store.addPettyCashMovement({
      date: cashToday(),
      type: 'gasto',
      concept: 'Café',
      amount: 20,
    });
    store.addCashTransfer({
      date: cashToday(),
      fromId: 'cash',
      fromLabel: 'Caja',
      fromKind: 'cash',
      toId: 'bank-1',
      toLabel: 'BAC',
      toKind: 'bank',
      amount: 50,
      concept: 'Depósito',
    });

    await vi.waitFor(() => {
      for (const kind of [
        'cash-methods',
        'cash-closures',
        'cash-petty',
        'cash-petty-fund',
        'cash-transfers',
      ] as const) {
        expect(localStorage.getItem(financeStorageKey(kind, 'tenant-1'))).not.toBeNull();
      }
    });
    expect(
      JSON.parse(localStorage.getItem(financeStorageKey('cash-transfers', 'tenant-1')) ?? '[]'),
    ).toHaveLength(1);
  });
});
