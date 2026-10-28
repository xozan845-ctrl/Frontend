import { TestBed } from '@angular/core/testing';
import { ExpensePanelComponent } from './expense-panel.component';
import type { ExpenseRecord } from '../../../../domains/finance/public-api';

const record: ExpenseRecord = {
  id: 'expense-1',
  date: '2026-10-20',
  category: 'servicios',
  description: 'Luz',
  amount: 50,
  paymentMethod: 'transferencia',
};

describe('ExpensePanelComponent', () => {
  const setup = async (records: ExpenseRecord[] = [record]) => {
    await TestBed.configureTestingModule({ imports: [ExpensePanelComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpensePanelComponent);
    fixture.componentRef.setInput('records', records);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir un gasto válido y mostrar las etiquetas', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const created = vi.fn();
    component.create.subscribe(created);
    const host = fixture.nativeElement as HTMLElement;
    component.form.patchValue({
      date: '2026-10-21',
      category: 'personal',
      description: '  Nómina  ',
      amount: 500,
      paymentMethod: 'tarjeta',
    });

    component.submit();

    expect(created).toHaveBeenCalledWith({
      date: '2026-10-21',
      category: 'personal',
      description: 'Nómina',
      amount: 500,
      paymentMethod: 'tarjeta',
    });
    expect(host.textContent).toContain('Servicios');
    expect(host.textContent).toContain('Transferencia');
  });

  it('no debe emitir gastos inválidos y debe emitir el borrado', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const created = vi.fn();
    const removed = vi.fn();
    component.create.subscribe(created);
    component.remove.subscribe(removed);

    component.submit();
    (
      fixture.nativeElement.querySelector('[data-testid="expense-remove"]') as HTMLButtonElement
    ).click();

    expect(created).not.toHaveBeenCalled();
    expect(removed).toHaveBeenCalledWith('expense-1');
  });
});
