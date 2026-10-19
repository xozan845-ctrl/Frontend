import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
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

  it('debe listar todas las facturas y fijar el SEO', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(seo.setPage).toHaveBeenCalledWith('Facturas — Facturación', expect.any(String));
    expect(host.querySelectorAll('[data-testid="billing-invoice-row"]').length).toBe(5);
    expect(host.querySelector('[data-testid="billing-count-all"]')?.textContent).toContain('5');
  });

  it('debe filtrar por estado y actualizar el estado vacío', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="billing-filter-borrador"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelectorAll('[data-testid="billing-invoice-row"]').length).toBe(1);
    expect(host.textContent).toContain('FAC-2026-0002');
  });

  it('debe limpiar el filtro al elegir "Todas"', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="billing-filter-pagada"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid="billing-invoice-row"]').length).toBe(2);

    (host.querySelector('[data-testid="billing-filter-all"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid="billing-invoice-row"]').length).toBe(5);
  });
});
