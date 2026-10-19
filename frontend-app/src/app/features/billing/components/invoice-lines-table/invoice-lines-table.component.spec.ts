import { TestBed } from '@angular/core/testing';
import { InvoiceLinesTableComponent } from './invoice-lines-table.component';

const lines = [
  { productId: 'p1', productName: 'Crema hidratante', sku: 'CR-001', unitPrice: 480, quantity: 2 },
  { productId: 'p2', productName: 'Sérum reparador', sku: 'TR-001', unitPrice: 550, quantity: 1 },
];

describe('InvoiceLinesTableComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar las líneas y el importe redondeado de cada una', async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceLinesTableComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoiceLinesTableComponent);
    fixture.componentRef.setInput('lines', lines);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid="invoice-line-row"]').length).toBe(2);
    expect(host.textContent).toContain('Crema hidratante');
    expect(host.textContent).toContain('CR-001');
    expect(host.querySelectorAll('[data-testid="invoice-line-total"]')[0].textContent).toContain(
      'C$960.00',
    );
    expect(host.querySelectorAll('[data-testid="invoice-line-total"]')[1].textContent).toContain(
      'C$550.00',
    );
  });
});
