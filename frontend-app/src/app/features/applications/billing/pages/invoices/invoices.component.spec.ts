import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
import InvoicesComponent from './invoices.component';

describe('InvoicesComponent', () => {
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoicesComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe mostrar la lista vacía y fijar el SEO sin facturas de demostración', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(seo.setPage).toHaveBeenCalledWith('Facturas — Facturación', expect.any(String));
    expect(host.querySelector('[data-testid="billing-demo-banner"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-testid="billing-invoice-row"]').length).toBe(0);
    expect(host.querySelector('[data-testid="billing-count-all"]')?.textContent).toContain('0');
    expect(host.textContent).toContain('Aún no hay facturas reales');
    expect(host.textContent).not.toContain('FAC-2026-0001');
  });

  it('debe mantener el estado vacío al filtrar por estado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="billing-filter-borrador"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelectorAll('[data-testid="billing-invoice-row"]').length).toBe(0);
    expect(host.textContent).toContain('Sin facturas con este estado');
  });

  it('debe limpiar el filtro al elegir "Todas"', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="billing-filter-pagada"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="billing-count-pagada"]')?.textContent).toContain('0');

    (host.querySelector('[data-testid="billing-filter-all"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid="billing-invoice-row"]').length).toBe(0);
  });
});
