import { TestBed } from '@angular/core/testing';
import { OrderTotalsComponent } from './order-totals.component';

describe('OrderTotalsComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [OrderTotalsComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderTotalsComponent);
    fixture.componentRef.setInput('subtotal', 1165);
    fixture.componentRef.setInput('discountPercent', 0);
    fixture.componentRef.setInput('discountAmount', 0);
    fixture.componentRef.setInput('taxAmount', 174.75);
    fixture.componentRef.setInput('taxLabel', 'IVA (15 %)');
    fixture.componentRef.setInput('total', 1339.75);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar subtotal, descuento, IVA y total', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="totals-subtotal"]')?.textContent).toContain(
      'C$1,165.00',
    );
    expect(host.querySelector('[data-testid="totals-discount"]')?.textContent).toContain('C$0.00');
    expect(host.querySelector('[data-testid="totals-tax"]')?.textContent).toContain('C$174.75');
    expect(host.querySelector('[data-testid="totals-total"]')?.textContent).toContain('C$1,339.75');
  });

  it('debe emitir el descuento digitado y sanear lo no numérico a 0', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('[data-testid="discount-input"]') as HTMLInputElement;
    const values: number[] = [];
    fixture.componentInstance.discountChange.subscribe((value) => values.push(value));

    input.value = '15';
    input.dispatchEvent(new Event('input'));
    input.value = '';
    input.dispatchEvent(new Event('input'));

    expect(values).toEqual([15, 0]);
  });

  it('debe ocultar el IVA y el input de descuento cuando el flujo no los usa', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('showTax', false);
    fixture.componentRef.setInput('discountEditable', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="totals-tax"]')).toBeNull();
    expect(host.querySelector('[data-testid="discount-input"]')).toBeNull();
    expect(host.querySelector('[data-testid="totals-discount"]')?.textContent).toContain('C$0.00');
  });
});
