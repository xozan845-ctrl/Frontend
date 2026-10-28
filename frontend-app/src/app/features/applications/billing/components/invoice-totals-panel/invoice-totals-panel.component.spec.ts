import { TestBed } from '@angular/core/testing';
import { InvoiceTotalsPanelComponent } from './invoice-totals-panel.component';

describe('InvoiceTotalsPanelComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceTotalsPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoiceTotalsPanelComponent);
    fixture.componentRef.setInput('subtotal', 1165);
    fixture.componentRef.setInput('discountPercent', 0);
    fixture.componentRef.setInput('discountAmount', 0);
    fixture.componentRef.setInput('taxAmount', 174.75);
    fixture.componentRef.setInput('total', 1339.75);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar subtotal, descuento, IVA y total con la tasa vigente', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('IVA (15 %)');
    expect(host.querySelector('[data-testid="billing-totals-subtotal"]')?.textContent).toContain(
      'C$1,165.00',
    );
    expect(host.querySelector('[data-testid="billing-totals-discount"]')?.textContent).toContain(
      'C$0.00',
    );
    expect(host.querySelector('[data-testid="billing-totals-tax"]')?.textContent).toContain(
      'C$174.75',
    );
    expect(host.querySelector('[data-testid="billing-totals-total"]')?.textContent).toContain(
      'C$1,339.75',
    );
  });

  it('debe emitir el descuento digitado y sanear lo no numérico', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('[data-testid="billing-discount-input"]') as HTMLInputElement;
    const values: number[] = [];
    fixture.componentInstance.discountChange.subscribe((value) => values.push(value));

    input.value = '15';
    input.dispatchEvent(new Event('input'));
    input.value = '';
    input.dispatchEvent(new Event('input'));

    expect(values).toEqual([15, 0]);
  });

  it('debe ocultar el campo de descuento en modo lectura', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('editable', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="billing-discount-input"]')).toBeNull();
    expect(host.textContent).toContain('Descuento (0 %)');
  });
});
