import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BILLING_INVOICES } from '../../constants/billing.fixtures';
import { InvoiceListTableComponent } from './invoice-list-table.component';

describe('InvoiceListTableComponent', () => {
  const setup = async (invoices = [...BILLING_INVOICES]) => {
    await TestBed.configureTestingModule({
      imports: [InvoiceListTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoiceListTableComponent);
    fixture.componentRef.setInput('invoices', invoices);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar una fila por factura con su total y estado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid="billing-invoice-row"]').length).toBe(5);
    expect(host.querySelector('[data-testid="billing-invoice-count"]')?.textContent).toContain(
      '5 facturas',
    );
    expect(host.textContent).toContain('FAC-2026-0001');
    expect(host.textContent).toContain('María López');
    expect(host.textContent).toContain('Pagada');
  });

  it('debe enlazar cada factura a su detalle', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector(
      '[data-testid="billing-invoice-link-fac-2"]',
    ) as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/facturacion/facturas/fac-2');
  });

  it('debe mostrar el estado vacío', async () => {
    const fixture = await setup([]);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="billing-invoices-empty"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-testid="billing-invoice-row"]').length).toBe(0);
  });

  it('debe emitir el reintento desde el error', async () => {
    const fixture = await setup([]);
    fixture.componentRef.setInput('error', 'No se pudo cargar');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => (retries += 1));

    (host.querySelector('[data-testid="billing-retry-invoices"]') as HTMLButtonElement).click();

    expect(retries).toBe(1);
  });
});
