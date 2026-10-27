import { TestBed } from '@angular/core/testing';
import { PurchasePanelComponent } from './purchase-panel.component';
import type { PurchaseRecord } from '../../../../finance/public-api';

const record: PurchaseRecord = {
  id: 'purchase-1',
  date: '2026-10-20',
  supplier: 'Proveedor',
  concept: 'Compra',
  amount: 100,
  status: 'pendiente',
};

describe('PurchasePanelComponent', () => {
  const setup = async (records: PurchaseRecord[] = [record]) => {
    await TestBed.configureTestingModule({ imports: [PurchasePanelComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PurchasePanelComponent);
    fixture.componentRef.setInput('records', records);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir una compra válida y reiniciar el formulario', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const created = vi.fn();
    component.create.subscribe(created);
    component.form.patchValue({
      date: '2026-10-21',
      supplier: '  Distribuidora  ',
      concept: '  Reposición  ',
      amount: 250,
      status: 'pagada',
    });

    component.submit();

    expect(created).toHaveBeenCalledWith({
      date: '2026-10-21',
      supplier: 'Distribuidora',
      concept: 'Reposición',
      amount: 250,
      status: 'pagada',
    });
    expect(component.form.controls.supplier.value).toBe('');
    expect(component.form.controls.amount.value).toBe(0);
  });

  it('no debe emitir compras inválidas', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const created = vi.fn();
    component.create.subscribe(created);

    component.submit();

    expect(created).not.toHaveBeenCalled();
    expect(component.form.controls.supplier.touched).toBe(true);
  });

  it('debe emitir el identificador al eliminar una compra', async () => {
    const fixture = await setup();
    const removed = vi.fn();
    fixture.componentInstance.remove.subscribe(removed);
    const button = fixture.nativeElement.querySelector(
      '[data-testid="purchase-remove"]',
    ) as HTMLButtonElement;

    button.click();

    expect(removed).toHaveBeenCalledWith('purchase-1');
  });
});
