import { TestBed } from '@angular/core/testing';
import { ExpenseReportModalComponent } from './expense-report-modal.component';
import type { ExpenseRecord } from '../../../../domains/expenses/public-api';

function localDate(daysFromToday = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function record(overrides: Partial<ExpenseRecord> = {}): ExpenseRecord {
  return {
    id: 'expense-1',
    date: localDate(),
    concept: 'Publicidad',
    category: 'publicidad',
    type: 'inmediato',
    amount: 100,
    paymentMethod: 'efectivo',
    status: 'pagado',
    includesVat: false,
    irRetention: 0,
    beneficiary: '',
    notes: '',
    scheduledFor: '',
    recurrence: '',
    createdAt: localDate(),
    ...overrides,
  };
}

describe('ExpenseReportModalComponent', () => {
  const setup = async (records: ExpenseRecord[] = [record()]) => {
    await TestBed.configureTestingModule({
      imports: [ExpenseReportModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseReportModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('records', records);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe filtrar por mes activo y emitir Excel/PDF', async () => {
    const fixture = await setup([record(), record({ id: 'old', date: '2020-01-01', amount: 900 })]);
    const component = fixture.componentInstance;
    const exported = vi.fn();
    component.exportReport.subscribe(exported);

    expect(component.filtered()).toHaveLength(1);
    expect(component.total()).toBe(100);
    component.download('excel');
    component.download('pdf');

    expect(exported).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        format: 'excel',
        records: [expect.objectContaining({ id: 'expense-1' })],
      }),
    );
    expect(exported).toHaveBeenNthCalledWith(2, expect.objectContaining({ format: 'pdf' }));
  });

  it('debe cambiar estado y tipo', async () => {
    const fixture = await setup([
      record({ id: 'cancelled', status: 'cancelado' }),
      record({ id: 'scheduled', type: 'programado', status: 'pendiente' }),
    ]);
    const component = fixture.componentInstance;

    component.setStatus('all');
    component.setType('programado');
    expect(component.filtered()).toHaveLength(1);

    component.setStatus('cancelled');
    component.setType('all');
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
