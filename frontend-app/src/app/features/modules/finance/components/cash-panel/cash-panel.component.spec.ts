import { TestBed } from '@angular/core/testing';
import { CashPanelComponent } from './cash-panel.component';
import type { CashMovement } from '../../../../domains/finance/public-api';

const record: CashMovement = {
  id: 'cash-1',
  date: '2026-10-20',
  type: 'ingreso',
  concept: 'Cobro',
  amount: 200,
  paymentMethod: 'efectivo',
};

describe('CashPanelComponent', () => {
  const setup = async (records: CashMovement[] = [record]) => {
    await TestBed.configureTestingModule({ imports: [CashPanelComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CashPanelComponent);
    fixture.componentRef.setInput('records', records);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe calcular el saldo y emitir un movimiento válido', async () => {
    const fixture = await setup([record, { ...record, id: 'cash-2', type: 'egreso', amount: 50 }]);
    const component = fixture.componentInstance;
    const created = vi.fn();
    component.create.subscribe(created);
    component.form.patchValue({
      date: '2026-10-21',
      type: 'egreso',
      concept: '  Pago  ',
      amount: 75,
      paymentMethod: 'transferencia',
    });

    component.submit();

    expect(component.balance()).toBe(150);
    expect(created).toHaveBeenCalledWith({
      date: '2026-10-21',
      type: 'egreso',
      concept: 'Pago',
      amount: 75,
      paymentMethod: 'transferencia',
    });
  });

  it('no debe emitir movimientos inválidos y debe emitir el borrado', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const created = vi.fn();
    const removed = vi.fn();
    component.create.subscribe(created);
    component.remove.subscribe(removed);

    component.submit();
    (
      fixture.nativeElement.querySelector('[data-testid="cash-remove"]') as HTMLButtonElement
    ).click();

    expect(created).not.toHaveBeenCalled();
    expect(removed).toHaveBeenCalledWith('cash-1');
  });
});
