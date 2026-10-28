import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import NewInvoiceComponent from './new-invoice.component';

describe('NewInvoiceComponent', () => {
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [NewInvoiceComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();
    const fixture = TestBed.createComponent(NewInvoiceComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe pintar el POS de facturación con el SEO de la página', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(seo.setPage).toHaveBeenCalledWith('Nueva factura — Facturación', expect.any(String));
    expect(host.querySelector('[data-testid="billing-new-invoice-page"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="billing-client-card"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="billing-info-card"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="billing-catalog-card"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="billing-draft-empty"]')).not.toBeNull();
  });

  it('debe agregar productos y recalcular los totales', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (
      host.querySelector(
        '[data-testid="billing-product-card-prod-1"] [data-testid="billing-add-product"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="billing-draft-count"]')?.textContent).toContain(
      '1 producto',
    );
    expect(host.querySelector('[data-testid="billing-totals-subtotal"]')?.textContent).toContain(
      'C$480.00',
    );
    expect(host.querySelector('[data-testid="billing-totals-tax"]')?.textContent).toContain(
      'C$72.00',
    );
    expect(host.querySelector('[data-testid="billing-totals-total"]')?.textContent).toContain(
      'C$552.00',
    );
  });

  it('debe pedir cliente antes de emitir y luego mostrar el aviso de diseño', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (
      host.querySelector(
        '[data-testid="billing-product-card-prod-1"] [data-testid="billing-add-product"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (host.querySelector('[data-testid="billing-emit-invoice"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="billing-notice"]')?.textContent).toContain(
      'Selecciona un cliente',
    );

    (
      host.querySelector('[data-testid="billing-client-option-cli-1"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (host.querySelector('[data-testid="billing-emit-invoice"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="billing-notice"]')?.textContent).toContain(
      'María López',
    );
  });

  it('debe filtrar clientes y productos por término', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    const clientSearch = host.querySelector(
      '[data-testid="billing-client-search"]',
    ) as HTMLInputElement;
    clientSearch.value = 'carlos';
    clientSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid^="billing-client-option-"]').length).toBe(1);

    const productSearch = host.querySelector(
      '[data-testid="billing-product-search"]',
    ) as HTMLInputElement;
    productSearch.value = 'tinte';
    productSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid^="billing-product-card-"]').length).toBe(2);
  });
});
