import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { ExpensesStore, type ExpenseRecord } from '../../../../domains/expenses/public-api';
import ExpensesComponent from './expenses.component';

const ROW: ExpenseRecord = {
  id: 'expense-1',
  date: '2026-10-29',
  concept: 'Publicidad',
  category: 'publicidad',
  type: 'inmediato',
  amount: 100,
  paymentMethod: 'efectivo',
  status: 'pagado',
  includesVat: false,
  irRetention: 0,
  beneficiary: 'Ana',
  notes: '',
  scheduledFor: '',
  recurrence: '',
  createdAt: '2026-10-29T12:00:00.000Z',
};

describe('ExpensesComponent', () => {
  const store = {
    summary: signal({
      day: 100,
      month: 100,
      year: 100,
      pending: 0,
      recurringActive: 0,
      salariesPending: 0,
    }),
    greeting: signal('Buenos días, Karla'),
    categories: signal([{ value: 'publicidad', label: 'Publicidad' }]),
    categoryLabels: signal({ publicidad: 'Publicidad' }),
    records: signal([ROW]),
    pagedRecords: signal([ROW]),
    filteredCount: signal(1),
    hasRecords: signal(true),
    tab: signal<'all' | 'scheduled'>('all'),
    type: signal<'all' | 'inmediato' | 'programado' | 'recurrente'>('all'),
    statusFilter: signal<'all' | 'pendiente' | 'pagado'>('all'),
    search: signal(''),
    category: signal('all'),
    currentPage: signal(1),
    pageCount: signal(1),
    addExpense: vi.fn((): { ok: boolean; message?: string } => ({ ok: true })),
    updateExpense: vi.fn((): { ok: boolean; message?: string } => ({ ok: true })),
    markPaid: vi.fn(),
    cancelExpense: vi.fn(),
    removeExpense: vi.fn(),
    setTab: vi.fn(),
    setType: vi.fn(),
    setStatus: vi.fn(),
    setCategory: vi.fn(),
    setSearch: vi.fn(),
    nextPage: vi.fn(),
    previousPage: vi.fn(),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesComponent],
      providers: [
        { provide: ExpensesStore, useValue: store },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ExpensesComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe pintar el saludo, KPIs y gastos', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Buenos días, Karla');
    expect(host.textContent).toContain('Gastos registrados');
    expect(host.textContent).toContain('Publicidad');
    expect(host.textContent).toContain('C$100.00');
    expect(host.querySelector('[data-testid="expenses-table"]')).not.toBeNull();
  });

  it('debe abrir el modal de alta y guardar', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.openNewExpense();
    expect(component.expenseModalOpen()).toBe(true);
    component.saveExpense({
      date: '2026-10-29',
      concept: 'Renta',
      category: 'renta',
      type: 'inmediato',
      amount: 50,
      paymentMethod: 'efectivo',
      includesVat: false,
      irRetention: 0,
      beneficiary: '',
      notes: '',
      scheduledFor: '',
      recurrence: '',
    });

    expect(store.addExpense).toHaveBeenCalled();
    expect(component.expenseModalOpen()).toBe(false);
  });

  it('debe abrir el reporte y registrar errores del store', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    store.addExpense.mockReturnValueOnce({ ok: false, message: 'Error de gasto' });

    component.openReport();
    expect(component.reportOpen()).toBe(true);
    component.openNewExpense();
    component.saveExpense({
      date: '2026-10-29',
      concept: 'Renta',
      category: 'renta',
      type: 'inmediato',
      amount: 50,
      paymentMethod: 'efectivo',
      includesVat: false,
      irRetention: 0,
      beneficiary: '',
      notes: '',
      scheduledFor: '',
      recurrence: '',
    });

    expect(component.modalError()).toBe('Error de gasto');
    expect(component.expenseModalOpen()).toBe(true);
  });
});
