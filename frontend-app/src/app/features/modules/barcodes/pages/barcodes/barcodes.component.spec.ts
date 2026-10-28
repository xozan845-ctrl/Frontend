import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { BARCODES_SCOPE_CONFIG } from '../../../../../shared/barcodes/constants/barcodes-config.tokens';
import type { BarcodesScopeConfig } from '../../../../../shared/barcodes/models/barcodes-config.model';
import { BarcodesStore, type BarcodeLabel } from '../../../../barcodes/public-api';
import BarcodesComponent from './barcodes.component';

const config: BarcodesScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Códigos de barras',
  subtitle: 'Etiquetas de la empresa',
};

const label: BarcodeLabel = {
  id: 'barcode-1',
  productName: 'Camisa',
  sku: 'SKU-1',
  code: '1234567890128',
  symbology: 'EAN13',
  copies: 3,
  createdAt: '2026-10-28T12:00:00.000Z',
};

describe('BarcodesComponent', () => {
  const store = {
    labels: signal([label]),
    summary: signal({ labelsCount: 1, totalCopies: 3 }),
    hasLabels: signal(true),
    addLabel: vi.fn((): { ok: boolean; message?: string } => ({ ok: true })),
    removeLabel: vi.fn(),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [BarcodesComponent],
      providers: [
        { provide: BarcodesStore, useValue: store },
        { provide: BARCODES_SCOPE_CONFIG, useValue: config },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(BarcodesComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe mostrar KPIs y las etiquetas', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Códigos de barras');
    expect(host.textContent).toContain('Camisa');
    expect(host.textContent).toContain('EAN-13');
    expect(host.textContent).toContain('3');
    expect(host.querySelector('[data-testid="barcodes-table"]')).not.toBeNull();
  });

  it('debe registrar una etiqueta y limpiar el error', async () => {
    const fixture = await setup();

    fixture.componentInstance.addLabel({
      productName: 'Camisa',
      sku: 'SKU-1',
      code: '',
      symbology: 'EAN13',
      copies: 1,
    });

    expect(store.addLabel).toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('debe mostrar el error del store y delegar el borrado', async () => {
    const fixture = await setup();
    store.addLabel.mockReturnValueOnce({ ok: false, message: 'Código inválido' });
    const host = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.addLabel({
      productName: 'Camisa',
      sku: 'SKU-1',
      code: '1',
      symbology: 'EAN13',
      copies: 1,
    });
    fixture.detectChanges();
    (host.querySelector('[data-testid="barcode-remove"]') as HTMLButtonElement).click();

    expect(fixture.componentInstance.error()).toBe('Código inválido');
    expect(host.textContent).toContain('Código inválido');
    expect(store.removeLabel).toHaveBeenCalledWith('barcode-1');
  });
});
