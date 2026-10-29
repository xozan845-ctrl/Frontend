import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import {
  expensesStorageKey,
  legacyExpensesStorageKey,
  type CreateExpensePayload,
} from '../../public-api';
import { ExpensesStore } from './expenses.store';

function localDate(daysFromToday = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function payload(overrides: Partial<CreateExpensePayload> = {}): CreateExpensePayload {
  return {
    date: localDate(),
    concept: 'Publicidad',
    category: 'publicidad',
    type: 'inmediato',
    amount: 100,
    paymentMethod: 'efectivo',
    includesVat: false,
    irRetention: 0,
    beneficiary: '',
    notes: '',
    scheduledFor: '',
    recurrence: '',
    ...overrides,
  };
}

describe('ExpensesStore', () => {
  const tenantId = signal<string | null>('tenant-1');
  const authStore = {
    user: computed(() => ({ id: 'u-1', name: 'Karla López', tenantId: tenantId() })),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        ExpensesStore,
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(ExpensesStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('tenant-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe registrar, actualizar, pagar, cancelar y eliminar gastos', async () => {
    const store = setup();

    expect(store.addExpense(payload()).ok).toBe(true);
    expect(store.records()).toHaveLength(1);
    expect(notification.showSuccess).toHaveBeenCalledWith('Gasto registrado.');
    const id = store.records()[0].id;

    expect(
      store.updateExpense(id, payload({ concept: 'Publicidad actualizada', amount: 200 })).ok,
    ).toBe(true);
    expect(store.records()[0]).toMatchObject({ concept: 'Publicidad actualizada', amount: 200 });

    store.markPaid(id);
    expect(store.records()[0].status).toBe('pagado');
    store.cancelExpense(id);
    expect(store.records()[0].status).toBe('cancelado');
    store.removeExpense(id);
    expect(store.records()).toEqual([]);

    await vi.waitFor(() =>
      expect(JSON.parse(localStorage.getItem(expensesStorageKey('tenant-1')) ?? '[]')).toEqual([]),
    );
  });

  it('debe exponer KPIs, categorías y saludo', () => {
    const store = setup();

    expect(store.summary()).toMatchObject({ day: 0, month: 0, year: 0 });
    expect(store.categories().map((category) => category.value)).toContain('publicidad');
    expect(store.categoryLabels()['publicidad']).toBe('Publicidad');
    expect(store.greeting()).toContain('Karla');
  });

  it('debe filtrar por tab, tipo, estado, categoría y búsqueda', () => {
    const store = setup();
    store.addExpense(payload({ concept: 'Publicidad', category: 'publicidad' }));
    store.addExpense(payload({ concept: 'Renta', category: 'renta', type: 'programado' }));
    store.addExpense(payload({ concept: 'Salario', category: 'salarios', type: 'recurrente' }));

    store.setTab('scheduled');
    expect(store.filtered()).toHaveLength(2);
    store.setTab('all');
    store.setType('inmediato');
    expect(store.filtered()).toHaveLength(1);
    store.setType('all');
    store.setStatus('pagado');
    expect(store.filtered()).toHaveLength(1);
    store.setStatus('all');
    store.setCategory('renta');
    expect(store.filtered()).toHaveLength(1);
    store.setCategory('all');
    store.setSearch('salario');
    expect(store.filtered()).toHaveLength(1);
  });

  it('debe paginar los gastos filtrados', () => {
    const store = setup();
    for (let index = 0; index < 7; index += 1) {
      store.addExpense(payload({ concept: `Gasto ${index}` }));
    }

    expect(store.pagedRecords()).toHaveLength(5);
    expect(store.pageCount()).toBe(2);
    store.nextPage();
    expect(store.currentPage()).toBe(2);
    expect(store.pagedRecords()).toHaveLength(2);
    store.previousPage();
    expect(store.currentPage()).toBe(1);
  });

  it('debe migrar los gastos del store anterior', () => {
    localStorage.setItem(
      legacyExpensesStorageKey('tenant-1'),
      JSON.stringify([
        {
          id: 'legacy-1',
          date: localDate(),
          category: 'servicios',
          description: 'Luz',
          amount: 50,
          paymentMethod: 'transferencia',
        },
      ]),
    );
    const store = setup();

    expect(store.records()).toHaveLength(1);
    expect(store.records()[0]).toMatchObject({ concept: 'Luz', status: 'pagado' });
  });

  it('debe rechazar gastos inválidos y respetar el límite', () => {
    const store = setup();
    expect(store.addExpense(payload({ concept: '', amount: 0 }))).toEqual({
      ok: false,
      message: 'Revisa concepto, categoría, tipo e importe.',
    });
    expect(store.updateExpense('missing', payload())).toEqual({
      ok: false,
      message: 'El gasto no existe.',
    });

    localStorage.setItem(
      expensesStorageKey('tenant-1'),
      JSON.stringify(
        Array.from({ length: 1000 }, (_, index) => ({
          ...payload(),
          id: `expense-${index}`,
          status: 'pagado',
          createdAt: '2026-10-29T12:00:00.000Z',
          includesVat: false,
          irRetention: 0,
          notes: '',
          scheduledFor: '',
          recurrence: '',
          beneficiary: '',
        })),
      ),
    );
    TestBed.resetTestingModule();
    const fullStore = setup();
    expect(fullStore.addExpense(payload())).toEqual({
      ok: false,
      message: 'Alcanzaste el límite de gastos.',
    });
  });

  it('debe ignorar storage corrupto', () => {
    localStorage.setItem(expensesStorageKey('tenant-1'), '{');
    const store = setup();

    expect(store.records()).toEqual([]);
    expect(store.hasRecords()).toBe(false);
  });
});
