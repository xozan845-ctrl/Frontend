import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import AdminInventoryComponent from './inventory.component';
import { InventoryStore } from '../../state/inventory/inventory.store';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { InventoryLine } from '../../models/inventory.model';

const lines: InventoryLine[] = [
  {
    sku: 'SKU-001',
    name: 'Teclado Mecánico',
    stock: 12,
    available: 10,
    reserved: 2,
    status: 'disponible',
    basePrice: 1000,
    availableValueCents: 1000000,
    totalValueCents: 1200000,
  },
  {
    sku: 'SKU-002',
    name: 'Mouse Gamer',
    stock: 0,
    available: 0,
    reserved: 0,
    status: 'agotado',
    basePrice: 50,
    availableValueCents: 0,
    totalValueCents: 0,
  },
];

describe('AdminInventoryComponent', () => {
  const allLines = signal<InventoryLine[]>([]);
  const query = signal('');
  const status = signal<string | null>(null);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const inventory = {
    lines: allLines.asReadonly(),
    query: query.asReadonly(),
    status: status.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    filteredLines: () => allLines(),
    totalSkus: () => allLines().length,
    totalStock: () => allLines().reduce((sum, line) => sum + line.stock, 0),
    totalAvailable: () => allLines().reduce((sum, line) => sum + line.available, 0),
    totalReserved: () => allLines().reduce((sum, line) => sum + line.reserved, 0),
    totalValueCents: () => allLines().reduce((sum, line) => sum + line.totalValueCents, 0),
    hasLines: () => allLines().length > 0,
    load: vi.fn(),
    refresh: vi.fn(),
    setQuery: vi.fn((value: string) => query.set(value)),
    setStatus: vi.fn((value: string | null) => status.set(value)),
    clearError: vi.fn(),
    reset: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminInventoryComponent],
      providers: [
        provideRouter([]),
        { provide: InventoryStore, useValue: inventory },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminInventoryComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    allLines.set([]);
    query.set('');
    status.set(null);
    loading.set(false);
    error.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar el inventario al entrar', async () => {
    await setup();

    expect(inventory.load).toHaveBeenCalled();
  });

  it('debe mostrar las líneas y los totales', async () => {
    allLines.set(lines);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="inventory-row"]')).toHaveLength(2);
    expect(
      fixture.nativeElement.querySelector('[data-testid="inventory-skus"]').textContent,
    ).toContain('2');
    expect(
      fixture.nativeElement.querySelector('[data-testid="inventory-stock"]').textContent,
    ).toContain('12');
    expect(
      fixture.nativeElement.querySelector('[data-testid="inventory-reserved"]').textContent,
    ).toContain('2');
    expect(
      fixture.nativeElement.querySelector('[data-testid="inventory-value"]').textContent,
    ).toContain('12,000.00');
  });

  it('debe filtrar por texto y estado', async () => {
    allLines.set(lines);
    const fixture = await setup();

    const input = fixture.nativeElement.querySelector('[data-testid="inventory-search"]');
    input.value = 'teclado';
    input.dispatchEvent(new Event('input'));
    expect(inventory.setQuery).toHaveBeenCalledWith('teclado');

    const select = fixture.nativeElement.querySelector('[data-testid="inventory-status"]');
    select.value = 'agotado';
    select.dispatchEvent(new Event('change'));
    expect(inventory.setStatus).toHaveBeenCalledWith('agotado');
  });

  it('debe mostrar el estado de carga', async () => {
    loading.set(true);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });

  it('debe mostrar el estado vacío', async () => {
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[data-testid="inventory-empty"]')).not.toBeNull();
  });

  it('debe mostrar el error de carga', async () => {
    error.set('No se pudo cargar el inventario.');
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="inventory-error"]').textContent,
    ).toContain('No se pudo cargar el inventario.');
  });
});
