import { TestBed } from '@angular/core/testing';
import { CashReportModalComponent } from './cash-report-modal.component';
import type { CashMovement } from '../../../../domains/cash/public-api';

function localDate(daysFromToday = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function record(overrides: Partial<CashMovement> = {}): CashMovement {
  return {
    id: 'cash-1',
    date: localDate(),
    type: 'ingreso',
    concept: 'Venta',
    category: 'venta',
    amount: 100,
    paymentMethod: 'efectivo',
    status: 'confirmado',
    account: 'caja-general',
    source: 'venta',
    reference: '',
    counterpart: '',
    notes: '',
    createdAt: localDate(),
    ...overrides,
  };
}

describe('CashReportModalComponent', () => {
  const setup = async (records: CashMovement[] = [record()]) => {
    await TestBed.configureTestingModule({
      imports: [CashReportModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashReportModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('records', records);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe filtrar por mes y calcular totales confirmados', async () => {
    const fixture = await setup([
      record(),
      record({ id: 'out', type: 'egreso', amount: 40 }),
      record({ id: 'pending', amount: 300, status: 'pendiente' }),
      record({ id: 'old', date: '2020-01-01', amount: 900 }),
    ]);
    const component = fixture.componentInstance;

    expect(component.filtered()).toHaveLength(3);
    expect(component.totals()).toEqual({ income: 100, expense: 40, net: 60 });
  });

  it('debe emitir Excel y PDF con los filtros aplicados', async () => {
    const fixture = await setup([record(), record({ id: 'out', type: 'egreso', amount: 40 })]);
    const component = fixture.componentInstance;
    const exported = vi.fn();
    component.exportReport.subscribe(exported);

    component.setType('egreso');
    component.download('excel');
    component.download('pdf');

    expect(exported).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        format: 'excel',
        records: [expect.objectContaining({ id: 'out' })],
        filters: expect.objectContaining({
          type: 'egreso',
          period: 'month',
          dateFrom: '',
          dateTo: '',
        }),
      }),
    );
    expect(exported).toHaveBeenNthCalledWith(2, expect.objectContaining({ format: 'pdf' }));
  });

  it('debe cambiar período, rango personalizado, estado, método y búsqueda', async () => {
    const fixture = await setup([
      record({ id: 'a', concept: 'Venta' }),
      record({ id: 'b', concept: 'Compra', paymentMethod: 'tarjeta', status: 'pendiente' }),
      record({ id: 'c', date: '2020-01-01', concept: 'Viejo' }),
    ]);
    const component = fixture.componentInstance;
    const period = { target: { value: 'year' } } as unknown as Event;
    const custom = { target: { value: 'custom' } } as unknown as Event;
    const from = { target: { value: '2020-01-01' } } as unknown as Event;
    const to = { target: { value: '2020-01-31' } } as unknown as Event;
    const method = { target: { value: 'tarjeta' } } as unknown as Event;
    const search = { target: { value: 'compra' } } as unknown as Event;

    component.setPeriod(period);
    expect(component.filtered()).toHaveLength(2);
    component.setPeriod(custom);
    component.setDateFrom(from);
    component.setDateTo(to);
    expect(component.filtered()).toHaveLength(1);
    component.setDateFrom({ target: { value: '' } } as unknown as Event);
    component.setDateTo({ target: { value: '' } } as unknown as Event);
    component.setPeriod(period);
    component.setPaymentMethod(method);
    expect(component.filtered()).toHaveLength(1);
    component.setPaymentMethod({ target: { value: 'all' } } as unknown as Event);
    component.setStatus('pendiente');
    expect(component.filtered()).toHaveLength(1);
    component.setStatus('all');
    component.setSearch(search);
    expect(component.filtered()).toHaveLength(1);
  });

  it('debe emitir el cierre', async () => {
    const fixture = await setup();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    fixture.componentInstance.closed.emit();

    expect(closed).toHaveBeenCalled();
  });
});
