import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import {
  CashStore,
  type CashMovement,
  type CashMovementSource,
  type CashMovementType,
  type CashPeriod,
  type CashReportExport,
  type CashTab,
} from '../../../../domains/cash/public-api';
import CashComponent from './cash.component';

const ROW: CashMovement = {
  id: 'cash-1',
  date: '2026-10-29',
  type: 'ingreso',
  concept: 'Venta de contado',
  category: 'venta',
  amount: 100,
  paymentMethod: 'efectivo',
  status: 'confirmado',
  account: 'caja-general',
  source: 'venta',
  reference: 'REC-1',
  counterpart: 'Ana',
  notes: '',
  createdAt: '2026-10-29T12:00:00.000Z',
};

describe('CashComponent', () => {
  const store = {
    summary: signal({
      available: 1215657.98,
      incomeMonth: 441435.63,
      incomeCountMonth: 360,
      expenseMonth: 0,
      expenseCountMonth: 0,
      movementsMonth: 360,
      otherIncome: 0,
      otherExpense: 0,
      pettyCash: 2000,
      banks: 0,
    }),
    greeting: signal('Buenas tardes, Karla'),
    today: signal('2026-10-29'),
    categoryLabels: signal({ venta: 'Venta', gasto: 'Gasto' }),
    paymentLabels: signal({ efectivo: 'Efectivo' }),
    accountLabels: signal({ 'caja-general': 'Caja general', bac: 'BAC Credomatic' }),
    statusLabels: signal({ confirmado: 'Confirmado', pendiente: 'Pendiente' }),
    typeLabels: signal({ ingreso: 'Ingreso', egreso: 'Egreso' }),
    sourceLabels: signal({ manual: 'Manual', venta: 'Ventas' }),
    sourceLocks: signal({ manual: false, venta: true }),
    records: signal([ROW]),
    movementRows: signal([{ record: ROW, balance: 100 }]),
    filteredCount: signal(1),
    hasRecords: signal(true),
    tab: signal<CashTab>('movements'),
    period: signal<CashPeriod>('month'),
    type: signal<'all' | CashMovementType>('all'),
    status: signal<'all' | 'confirmado' | 'pendiente' | 'anulado'>('all'),
    category: signal('all'),
    paymentMethod: signal<'all' | 'efectivo'>('all'),
    search: signal(''),
    dateFrom: signal(''),
    dateTo: signal(''),
    currentPage: signal(1),
    pageCount: signal(1),
    pagedRecords: signal([ROW]),
    paymentBreakdown: signal([
      {
        method: 'efectivo' as const,
        label: 'Efectivo',
        income: 100,
        expense: 40,
        net: 60,
        count: 2,
      },
    ]),
    dailyClosures: signal([
      {
        date: '2026-10-29',
        income: 100,
        expense: 40,
        net: 60,
        count: 2,
        status: 'abierto' as const,
      },
    ]),
    bankAccounts: signal([
      {
        account: 'bac',
        label: 'BAC Credomatic',
        income: 500,
        expense: 100,
        balance: 400,
        count: 2,
      },
    ]),
    addMovement: vi.fn((): { ok: boolean; message?: string } => ({ ok: true })),
    updateMovement: vi.fn((): { ok: boolean; message?: string } => ({ ok: true })),
    confirmMovement: vi.fn(),
    annulMovement: vi.fn(),
    removeMovement: vi.fn(),
    setTab: vi.fn(),
    setPeriod: vi.fn(),
    setDateRange: vi.fn(),
    setType: vi.fn(),
    setStatus: vi.fn(),
    setCategory: vi.fn(),
    setPaymentMethod: vi.fn(),
    setSearch: vi.fn(),
    resetFilters: vi.fn(),
    nextPage: vi.fn(),
    previousPage: vi.fn(),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashComponent],
      providers: [
        { provide: CashStore, useValue: store },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.tab.set('movements');
    store.period.set('month');
    store.dateFrom.set('');
    store.dateTo.set('');
    store.hasRecords.set(true);
    store.filteredCount.set(1);
    store.currentPage.set(1);
    store.pageCount.set(1);
    store.addMovement.mockReturnValue({ ok: true });
    store.updateMovement.mockReturnValue({ ok: true });
    TestBed.resetTestingModule();
  });

  it('debe pintar la cabecera, KPIs y movimientos con formato NIO', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Buenas tardes, Karla');
    expect(host.textContent).toContain('Centro financiero del negocio');
    expect(host.textContent).toContain('NIO 1,215,657.98');
    expect(host.textContent).toContain('NIO 441,435.63');
    expect(host.textContent).toContain('360 entradas');
    expect(host.textContent).toContain('Venta de contado');
    expect(host.textContent).toContain('NIO 100.00');
    expect(host.textContent).toContain('Ventas');
    expect(host.querySelector('[data-testid="cash-table"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="cash-kpi-other-income"]')).not.toBeNull();
  });

  it('debe pintar métodos, cierres, bancos, caja chica y transferencias', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    store.tab.set('payment-methods');
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="cash-payment-table"]')).not.toBeNull();

    store.tab.set('closures');
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="cash-closures-table"]')).not.toBeNull();

    store.tab.set('banks');
    fixture.detectChanges();
    expect(host.textContent).toContain('BAC Credomatic');
    expect(host.querySelector('[data-testid="cash-section-table"]')).not.toBeNull();

    store.tab.set('petty-cash');
    fixture.detectChanges();
    expect(host.textContent).toContain('Fondo asignado');
    expect(host.textContent).toContain('Gasto de caja chica');

    store.tab.set('transfers');
    fixture.detectChanges();
    expect(host.textContent).toContain('Nueva transferencia');
  });

  it('debe abrir el modal de alta y guardar', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.openNewMovement();
    expect(component.movementModalOpen()).toBe(true);

    component.saveMovement({
      date: '2026-10-29',
      type: 'ingreso',
      concept: 'Cobro',
      category: 'cobro',
      amount: 50,
      paymentMethod: 'efectivo',
      account: 'caja-general',
      reference: '',
      counterpart: '',
      notes: '',
    });

    expect(store.addMovement).toHaveBeenCalled();
    expect(component.movementModalOpen()).toBe(false);
  });

  it('debe editar y registrar errores del store', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    store.updateMovement.mockReturnValueOnce({ ok: false, message: 'Error de caja' });

    component.openEditMovement(ROW);
    expect(component.editingMovement()).toEqual(ROW);
    component.saveMovement({
      date: '2026-10-29',
      type: 'ingreso',
      concept: 'Cobro',
      category: 'cobro',
      amount: 50,
      paymentMethod: 'efectivo',
      account: 'caja-general',
      reference: '',
      counterpart: '',
      notes: '',
    });

    expect(component.modalError()).toBe('Error de caja');
    expect(component.movementModalOpen()).toBe(true);
  });

  it('debe abrir y cerrar el reporte y aplicar filtros', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.openReport();
    expect(component.reportOpen()).toBe(true);
    component.closeReport();
    expect(component.reportOpen()).toBe(false);

    component.selectPeriod('custom');
    component.setDateFrom({ target: { value: '2026-10-01' } } as unknown as Event);
    component.setDateTo({ target: { value: '2026-10-31' } } as unknown as Event);
    component.search({ target: { value: 'venta' } } as unknown as Event);
    component.resetFilters();

    expect(store.setPeriod).toHaveBeenCalledWith('custom');
    expect(store.setDateRange).toHaveBeenCalledWith('2026-10-01', '');
    expect(store.setDateRange).toHaveBeenCalledWith('', '2026-10-31');
    expect(store.setSearch).toHaveBeenCalledWith('venta');
    expect(store.resetFilters).toHaveBeenCalled();
  });

  it('debe clasificar tabs, periodos, categorías, saldos y orígenes', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    expect(component.tabClass('movements')).toContain('bg-emerald-300');
    expect(component.tabClass('banks')).toContain('text-slate-500');
    expect(component.periodClass('month')).toContain('bg-emerald-300');
    expect(component.periodClass('year')).toContain('text-slate-500');
    expect(component.categoryBadge('venta')).toBe('badge badge-success normal-case');
    expect(component.categoryBadge('gasto')).toBe('badge badge-danger normal-case');
    expect(component.categoryBadge('transferencia')).toBe('badge badge-primary normal-case');
    expect(component.categoryBadge('caja-chica')).toBe('badge badge-warning normal-case');
    expect(component.categoryBadge('otro')).toBe('badge badge-neutral normal-case');
    expect(component.balanceClass(-1)).toContain('text-red-600');
    expect(component.balanceClass(1)).toContain('text-emerald-600');
    expect(component.statusClass('confirmado')).toBe('badge-success');
    expect(component.statusClass('pendiente')).toBe('badge-warning');
    expect(component.statusClass('anulado')).toBe('badge-danger');
    const source = 'venta' as CashMovementSource;
    expect(component.sourceLabel(source)).toBe('Ventas');
  });

  it('debe exportar el reporte en Excel y PDF', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    type Internals = {
      downloadCsv: (records: readonly CashMovement[]) => void;
      openPdf: (records: readonly CashMovement[]) => void;
    };
    const internals = component as unknown as Internals;
    const csv = vi.spyOn(internals, 'downloadCsv').mockImplementation(() => undefined);
    const pdf = vi.spyOn(internals, 'openPdf').mockImplementation(() => undefined);
    const report: CashReportExport = {
      format: 'excel',
      records: [ROW],
      filters: {
        period: 'month',
        type: 'all',
        status: 'all',
        category: 'all',
        paymentMethod: 'all',
        search: '',
        dateFrom: '',
        dateTo: '',
      },
    };

    component.openReport();
    component.handleExport(report);
    component.handleExport({ ...report, format: 'pdf' });

    expect(csv).toHaveBeenCalledWith([ROW]);
    expect(pdf).toHaveBeenCalledWith([ROW]);
    expect(component.reportOpen()).toBe(false);
  });

  it('debe generar CSV y PDF con el detalle de movimientos', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    type Internals = {
      downloadCsv: (records: readonly CashMovement[]) => void;
      openPdf: (records: readonly CashMovement[]) => void;
    };
    const internals = component as unknown as Internals;
    const createObjectURL = vi.fn(() => 'blob:cash');
    const revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    try {
      internals.downloadCsv([ROW]);
      expect(createObjectURL).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalled();
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      click.mockRestore();
    }

    const print = vi.fn();
    const fakeWindow = {
      document,
      opener: null,
      focus: vi.fn(),
      print,
    } as unknown as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(fakeWindow);

    try {
      internals.openPdf([ROW]);
      expect(open).toHaveBeenCalled();
      expect(print).toHaveBeenCalled();
    } finally {
      open.mockRestore();
    }
  });
});
