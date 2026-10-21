import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../../core/services/seo/seo.service';
import InvoiceDetailComponent from './invoice-detail.component';

describe('InvoiceDetailComponent', () => {
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async (id = 'fac-1') => {
    await TestBed.configureTestingModule({
      imports: [InvoiceDetailComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoiceDetailComponent);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe pintar el comprobante con cliente, líneas y totales', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="billing-invoice-document"]')).not.toBeNull();
    expect(host.textContent).toContain('FAC-2026-0001');
    expect(host.textContent).toContain('María López');
    expect(host.querySelectorAll('[data-testid="invoice-line-row"]').length).toBe(2);
    expect(host.querySelector('[data-testid="billing-totals-total"]')?.textContent).toContain(
      'C$1,736.50',
    );
    expect(seo.setPage).toHaveBeenCalledWith(
      'Factura FAC-2026-0001 — Facturación',
      expect.any(String),
    );
  });

  it('debe mostrar el estado vacío cuando la factura no existe', async () => {
    const fixture = await setup('fac-inexistente');
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Factura no encontrada');
    expect(host.textContent).toContain('No encontramos esa factura');
    expect(host.querySelector('[data-testid="billing-invoice-document"]')).toBeNull();
  });

  it('debe invocar la impresión del navegador', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    (host.querySelector('[data-testid="billing-print-invoice"]') as HTMLButtonElement).click();

    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });
});
