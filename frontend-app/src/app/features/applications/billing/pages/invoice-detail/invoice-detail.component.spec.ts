import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
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

  it('debe mostrar estado vacío en lugar de un comprobante de demostración', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="billing-demo-banner"]')).not.toBeNull();
    expect(host.textContent).toContain('Factura no encontrada');
    expect(host.textContent).toContain('No encontramos esa factura');
    expect(host.querySelector('[data-testid="billing-invoice-document"]')).toBeNull();
    expect(host.textContent).not.toContain('FAC-2026-0001');
    expect(seo.setPage).toHaveBeenCalledWith(
      'Detalle de factura — Facturación',
      expect.any(String),
    );
  });

  it('debe ocultar la impresión cuando no hay factura real', async () => {
    const fixture = await setup('fac-inexistente');
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="billing-print-invoice"]')).toBeNull();
  });
});
