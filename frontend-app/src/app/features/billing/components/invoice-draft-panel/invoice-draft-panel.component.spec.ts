import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoiceLine } from '../../models/billing.model';
import { InvoiceDraftPanelComponent } from './invoice-draft-panel.component';

const lines: InvoiceLine[] = [
  {
    productId: 'prod-1',
    productName: 'Crema hidratante facial',
    sku: 'CR-001',
    unitPrice: 480,
    quantity: 2,
  },
];

const setInputs = (fixture: ComponentFixture<InvoiceDraftPanelComponent>) => {
  fixture.componentRef.setInput('lines', lines);
  fixture.componentRef.setInput('subtotal', 960);
  fixture.componentRef.setInput('discountPercent', 0);
  fixture.componentRef.setInput('discountAmount', 0);
  fixture.componentRef.setInput('taxAmount', 144);
  fixture.componentRef.setInput('total', 1104);
  fixture.componentRef.setInput('notes', '');
  fixture.detectChanges();
};

describe('InvoiceDraftPanelComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceDraftPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoiceDraftPanelComponent);
    setInputs(fixture);
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar el estado vacío y deshabilitar la emisión', async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceDraftPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoiceDraftPanelComponent);
    fixture.componentRef.setInput('lines', []);
    fixture.componentRef.setInput('subtotal', 0);
    fixture.componentRef.setInput('discountPercent', 0);
    fixture.componentRef.setInput('discountAmount', 0);
    fixture.componentRef.setInput('taxAmount', 0);
    fixture.componentRef.setInput('total', 0);
    fixture.componentRef.setInput('notes', '');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="billing-draft-empty"]')).not.toBeNull();
    expect(
      (host.querySelector('[data-testid="billing-emit-invoice"]') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('debe pintar la línea, sus totales y emitir cambios de cantidad y baja', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const quantities: Array<{ productId: string; quantity: number }> = [];
    const removed: string[] = [];
    fixture.componentInstance.quantityChange.subscribe((value) => quantities.push(value));
    fixture.componentInstance.removeLine.subscribe((value) => removed.push(value));

    expect(host.querySelector('[data-testid="billing-line-total"]')?.textContent).toContain(
      'C$960.00',
    );
    expect(host.querySelector('[data-testid="billing-line-quantity"]')?.textContent).toContain('2');

    (host.querySelector('[data-testid="billing-qty-increase"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="billing-qty-decrease"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="billing-remove-line"]') as HTMLButtonElement).click();

    expect(quantities).toEqual([
      { productId: 'prod-1', quantity: 3 },
      { productId: 'prod-1', quantity: 1 },
    ]);
    expect(removed).toEqual(['prod-1']);
  });

  it('debe emitir la emisión de la factura', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    let emitted = 0;
    fixture.componentInstance.emitInvoice.subscribe(() => (emitted += 1));

    (host.querySelector('[data-testid="billing-emit-invoice"]') as HTMLButtonElement).click();

    expect(emitted).toBe(1);
  });
});
